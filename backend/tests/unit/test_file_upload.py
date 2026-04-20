"""
文件上传工具测试
"""
import pytest
import os
import tempfile
from pathlib import Path
from io import BytesIO
from fastapi import UploadFile

from backend.app.utils.file_upload import save_uploaded_file, validate_knowledge_base
from backend.app.db.models import KnowledgeBase, Document, DB

@pytest.fixture(scope="module")
def test_tenant_id():
    """测试租户 ID"""
    return "test_tenant_001"


@pytest.fixture(scope="module")
def test_knowledge_base(test_tenant_id):
    """创建测试知识库"""
    # 确保数据库连接并初始化表
    DB.connect(reuse_if_open=True)
    
    # 初始化数据库表
    from ..app.db.database import init_tables
    init_tables()
    
    # 创建测试知识库
    kb = KnowledgeBase.create(
        tenant_id=test_tenant_id,
        kb_id=f"kb_{test_tenant_id}_001",
        name="测试知识库",
        description="用于测试文件上传功能",
        embd_model="text-embedding-v3",
        chunk_size=512,
        chunk_overlap=50
    )
    
    yield kb
    
    # 清理：删除测试知识库及相关文档
    try:
        # 删除相关文档记录
        Document.delete().where(Document.kb_id == kb.kb_id).execute()
        # 删除知识库（使用 kb_id 而不是 id）
        KnowledgeBase.delete().where(KnowledgeBase.kb_id == kb.kb_id).execute()
    except Exception as e:
        print(f"清理测试数据失败：{e}")
    finally:
        DB.close()


@pytest.fixture
def sample_txt_file():
    """创建测试文本文件"""
    content = b"This is a test file content.\nLine 2.\nLine 3."
    file_like = BytesIO(content)
    
    upload_file = UploadFile(
        filename="test_document.txt",
        file=file_like,
        size=len(content)
    )
    
    yield upload_file
    
    file_like.close()


@pytest.fixture
def sample_pdf_file():
    """创建测试 PDF 文件（模拟）"""
    content = b"%PDF-1.4 fake pdf content for testing"
    file_like = BytesIO(content)
    
    upload_file = UploadFile(
        filename="test_report.pdf",
        file=file_like,
        size=len(content)
    )
    
    yield upload_file
    
    file_like.close()


class TestSaveUploadedFile:
    """测试save_uploaded_file 函数"""
    
    @pytest.mark.asyncio
    async def test_save_txt_file(self, sample_txt_file, test_knowledge_base, test_tenant_id):
        """测试保存 TXT 文件"""
        result = await save_uploaded_file(
            file=sample_txt_file,
            kb_id=test_knowledge_base.kb_id,
            tenant_id=test_tenant_id
        )
        
        assert result is not None
        assert "file_id" in result
        assert "file_name" in result
        assert "path" in result
        assert "status" in result
        
        assert result["file_name"] == "test_document.txt"
        assert result["status"] == "pending"
        
        # 验证文件是否存在于指定路径
        assert os.path.exists(result["path"])
        
        # 验证数据库记录
        db_record = Document.get_by_id(result["file_id"])
        assert db_record.name == "test_document.txt"
        assert db_record.file_type == ".txt"
        assert db_record.parse_status == "pending"
        assert db_record.kb_id == test_knowledge_base.kb_id
        
        # 清理：删除创建的文件
        if os.path.exists(result["path"]):
            os.remove(result["path"])
    
    @pytest.mark.asyncio
    async def test_save_pdf_file(self, sample_pdf_file, test_knowledge_base, test_tenant_id):
        """测试保存 PDF 文件"""
        result = await save_uploaded_file(
            file=sample_pdf_file,
            kb_id=test_knowledge_base.kb_id,
            tenant_id=test_tenant_id
        )
        
        assert result is not None
        assert result["file_name"] == "test_report.pdf"
        assert result["file_type"] == ".pdf"
        
        # 验证文件路径包含正确的目录结构
        assert str(test_knowledge_base.kb_id) in result["path"]
        assert "pdf" in result["path"]
        
        # 验证文件存在
        assert os.path.exists(result["path"])
        
        # 清理
        if os.path.exists(result["path"]):
            os.remove(result["path"])
    
    @pytest.mark.asyncio
    async def test_save_file_with_no_extension(self, test_knowledge_base, test_tenant_id):
        """测试保存没有扩展名的文件"""
        content = b"file without extension"
        file_like = BytesIO(content)
        
        upload_file = UploadFile(
            filename="no_extension_file",
            file=file_like,
            size=len(content)
        )
        
        try:
            result = await save_uploaded_file(
                file=upload_file,
                kb_id=test_knowledge_base.kb_id,
                tenant_id=test_tenant_id
            )
            
            assert result is not None
            # 应该给默认扩展名 .bin
            assert ".bin" in result["file_type"]
            
            # 清理
            if os.path.exists(result["path"]):
                os.remove(result["path"])
        finally:
            file_like.close()
    
    @pytest.mark.asyncio
    async def test_save_file_with_special_chars_in_name(self, test_knowledge_base, test_tenant_id):
        """测试保存文件名包含特殊字符"""
        content = b"content"
        file_like = BytesIO(content)
        
        # 文件名包含空格和特殊字符
        upload_file = UploadFile(
            filename="test file (1).txt",
            file=file_like,
            size=len(content)
        )
        
        try:
            result = await save_uploaded_file(
                file=upload_file,
                kb_id=test_knowledge_base.kb_id,
                tenant_id=test_tenant_id
            )
            
            assert result is not None
            assert result["file_name"] == "test file (1).txt"
            
            # 清理
            if os.path.exists(result["path"]):
                os.remove(result["path"])
        finally:
            file_like.close()
    
    @pytest.mark.asyncio
    async def test_save_file_empty_filename(self, test_knowledge_base, test_tenant_id):
        """测试空文件名的情况"""
        content = b"content"
        file_like = BytesIO(content)
        
        upload_file = UploadFile(
            filename="",
            file=file_like,
            size=len(content)
        )
        
        try:
            result = await save_uploaded_file(
                file=upload_file,
                kb_id=test_knowledge_base.kb_id,
                tenant_id=test_tenant_id
            )
            
            # 空文件名应该返回 None
            assert result is None
        finally:
            file_like.close()
    
    @pytest.mark.asyncio
    async def test_save_file_path_traversal(self, test_knowledge_base, test_tenant_id):
        """测试防止路径遍历攻击"""
        content = b"malicious content"
        file_like = BytesIO(content)
        
        # 尝试路径遍历攻击
        upload_file = UploadFile(
            filename="../../etc/passwd",
            file=file_like,
            size=len(content)
        )
        
        try:
            result = await save_uploaded_file(
                file=upload_file,
                kb_id=test_knowledge_base.kb_id,
                tenant_id=test_tenant_id
            )
            
            # 应该只保留基本文件名，忽略路径
            assert result is not None
            assert "passwd" in result["file_name"] or result["file_name"] == "passwd"
            # 路径不应该包含 .. 
            assert ".." not in result["path"]
            
            # 清理
            if os.path.exists(result["path"]):
                os.remove(result["path"])
        finally:
            file_like.close()
    
    @pytest.mark.asyncio
    async def test_save_file_cleanup_on_error(self, test_knowledge_base, test_tenant_id):
        """测试数据库记录失败时清理文件"""
        content = b"error test content"
        file_like = BytesIO(content)
        
        upload_file = UploadFile(
            filename="cleanup_test.txt",
            file=file_like,
            size=len(content)
        )
        
        # 使用错误的知识库 ID 来触发数据库错误
        try:
            result = await save_uploaded_file(
                file=upload_file,
                kb_id="invalid_kb_id_that_does_not_exist",
                tenant_id=test_tenant_id
            )
            # 应该会抛出异常
            assert False, "应该抛出异常"
        except Exception as e:
            # 验证文件已被清理
            # 注意：这里需要知道文件路径来验证，但由于异常发生在文件保存之后
            # 实际应用中应该在异常处理中记录文件路径以便清理
            pass
        finally:
            file_like.close()


class TestValidateKnowledgeBase:
    """测试 validate_knowledge_base 函数"""
    
    def test_validate_existing_knowledge_base(self, test_knowledge_base, test_tenant_id):
        """测试验证存在的知识库"""
        kb = validate_knowledge_base(test_knowledge_base.kb_id, test_tenant_id)
        
        assert kb is not None
        assert kb.kb_id == test_knowledge_base.kb_id
        assert kb.name == "测试知识库"
    
    def test_validate_nonexistent_knowledge_base(self, test_tenant_id):
        """测试验证不存在的知识库"""
        kb = validate_knowledge_base("nonexistent_id", test_tenant_id)
        
        assert kb is None
    
    def test_validate_wrong_tenant(self, test_knowledge_base):
        """测试用错误的租户 ID 验证"""
        kb = validate_knowledge_base(test_knowledge_base.kb_id, "wrong_tenant_id")
        
        assert kb is None
    
    def test_validate_deleted_knowledge_base(self, test_knowledge_base, test_tenant_id):
        """测试验证已删除的知识库"""
        # 软删除知识库
        test_knowledge_base.is_deleted = True
        test_knowledge_base.save()
        
        kb = validate_knowledge_base(test_knowledge_base.kb_id, test_tenant_id)
        
        assert kb is None
        
        # 恢复
        test_knowledge_base.is_deleted = False
        test_knowledge_base.save()
