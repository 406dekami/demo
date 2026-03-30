#!/usr/bin/env python3
"""
知识库管理业务模块 - FastAPI 路由
"""
from fastapi import APIRouter, HTTPException, UploadFile, Request, File
from typing import List, Optional
from ..db import KnowledgeBase, Document, Chunk, User
from ..schemas.knowledge import (
    KnowledgeBaseCreateRequest,
    KnowledgeBaseResponse,
    KnowledgeBaseListResponse,
    UploadFileResponse,
    DeleteResponse
)
from ..utils.get_tenant_id import get_tenant_id
from ..utils.file_upload import save_uploaded_file, validate_knowledge_base, BASE_UPLOAD_DIR, process_uploaded_files
import logging

# 获取模块 logger
logger = logging.getLogger(__name__)


router = APIRouter()

@router.post("/create", response_model=KnowledgeBaseListResponse, summary="创建知识库")
async def create_knowledge_base(request: Request, data: KnowledgeBaseCreateRequest):
    """
    创建新的知识库
    """
    logger.info(f"📝 收到创建知识库请求：name={data.name}")
    
    try:
        tenant_id = get_tenant_id(request)
        logger.info(f"✓ 获取租户 ID: {tenant_id}")
        
        # 检查知识库名称是否已存在
        exists = KnowledgeBase.get_or_none(
            (KnowledgeBase.tenant_id == tenant_id) & 
            (KnowledgeBase.name == data.name) & 
            (KnowledgeBase.is_deleted == False)
        )
        if exists:
            logger.warning(f"⚠️ 知识库名称已存在：name={data.name}")
            return {"code": 1, "message": "知识库名称已存在", "data": None}
        
        # 创建知识库记录（自动生成 kb_id）
        import uuid
        kb_id = uuid.uuid4().hex[:32]  # 生成 32 位唯一 ID
        
        kb = KnowledgeBase.create(
            kb_id=kb_id,
            tenant_id=tenant_id,
            name=data.name,
            description=data.description,
            chunk_size=data.chunk_size,
            chunk_overlap=data.chunk_overlap
        )
        logger.info(f"✅ 知识库创建成功：kb_id={kb.kb_id}, name={kb.name}")
        return {
            "code": 0, 
            "message": "知识库创建成功", 
            "data": {
                "id": kb.kb_id,
                "name": kb.name
            }
        }
    except Exception as e:
        logger.error(f"❌ 创建知识库失败：name={data.name}, error={str(e)}", exc_info=True)
        return {"code": 500, "message": str(e), "data": None}

@router.get("/list", response_model=KnowledgeBaseListResponse, summary="获取知识库列表")
async def list_knowledge_bases(request: Request, tenant_id: Optional[str] = None):
    """
    获取知识库列表
    """
    logger.info(f"📋 收到获取知识库列表请求")
    
    try:
        current_tenant_id = tenant_id or get_tenant_id(request)
        logger.info(f"✓ 使用租户 ID: {current_tenant_id}")
        
        kbs = KnowledgeBase.select().where(
            (KnowledgeBase.tenant_id == current_tenant_id) & 
            (KnowledgeBase.is_deleted == False)
        ).order_by(KnowledgeBase.update_time.desc())
        
        result = []
        for kb in kbs:
            # 统计文档和切片数量
            doc_count = Document.select().where(
                (Document.kb_id == kb.kb_id) & 
                (Document.is_deleted == False)
            ).count()
            
            chunk_count = Chunk.select().where(
                (Chunk.kb_id == kb.kb_id) & 
                (Chunk.is_deleted == False)
            ).count()
            
            # 获取文档类型列表（去重）
            doc_types = Document.select(
                Document.file_type
            ).where(
                (Document.kb_id == kb.kb_id) & 
                (Document.is_deleted == False)
            ).distinct().tuples()
            
            # 提取文件类型列表
            file_type_list = [dt[0] for dt in doc_types]
            
            result.append({
                "id": kb.kb_id,
                "tenant_id": kb.tenant_id,
                "name": kb.name,
                "description": kb.description,
                "chunk_size": kb.chunk_size,
                "chunk_overlap": kb.chunk_overlap,
                "document_count": doc_count,
                "chunk_count": chunk_count,
                "file_types": file_type_list,  # 新增：文档类型列表
                "create_time": kb.create_time,
                "update_time": kb.update_time
            })
        
        logger.info(f"✅ 获取知识库列表成功，共 {len(result)} 条")
        return {"code": 0, "message": "success", "data": {"knowledge_bases": result}}
    except Exception as e:
        logger.error(f"❌ 获取知识库列表失败：error={str(e)}", exc_info=True)
        return {"code": 500, "message": str(e), "data": None}


@router.get("/{kb_id}/documents", response_model=KnowledgeBaseListResponse, summary="获取知识库文档列表")
async def list_documents(request: Request, kb_id: str):
    """
    获取知识库下的文档列表
    """
    logger.info(f"📋 收到获取文档列表请求：kb_id={kb_id}")
    
    try:
        tenant_id = get_tenant_id(request)
        logger.info(f"✓ 获取租户 ID: {tenant_id}")
        
        # 验证知识库是否存在且属于当前租户
        kb = validate_knowledge_base(kb_id, tenant_id)
        if not kb:
            logger.warning(f"❌ 知识库不存在或无权访问：kb_id={kb_id}")
            return {"code": 404, "message": "知识库不存在或无权访问", "data": None}
        
        # 查询文档列表
        documents = Document.select().where(
            (Document.kb_id == kb_id) & 
            (Document.is_deleted == False)
        ).order_by(Document.create_time.desc())
        
        result = []
        for doc in documents:
            result.append({
                "id": doc.id,
                "kb_id": doc.kb_id,
                "name": doc.name,
                "file_path": doc.file_path,
                "file_type": doc.file_type,
                "file_size": doc.file_size,
                "chunk_count": doc.chunk_count,
                "parse_status": doc.parse_status,
                "parse_msg": doc.parse_msg,
                "create_time": doc.create_time,
                "update_time": doc.update_time
            })
        
        logger.info(f"✅ 获取文档列表成功，共 {len(result)} 条")
        return {
            "code": 0,
            "message": "success",
            "data": {
                "kb_id": kb_id,
                "documents": result
            }
        }
    except Exception as e:
        logger.error(f"❌ 获取文档列表失败：kb_id={kb_id}, error={str(e)}", exc_info=True)
        return {"code": 500, "message": str(e), "data": None}


@router.post("/{kb_id}/upload", response_model=UploadFileResponse, summary="知识库上传文件")
async def upload_knowledge_base(request: Request, kb_id: str, files: List[UploadFile] = File(...)):
    """
    上传知识库文件（仅上传，不处理）
    处理后由 /api/v1/rag/process 接口负责
    """
    logger.info(f"📥 收到上传文件请求：kb_id={kb_id}, files={len(files)}")
    
    try:
        tenant_id = get_tenant_id(request)
        logger.info(f"✓ 获取租户 ID: {tenant_id}")

        # 检查知识库是否存在且属于当前租户
        kb = validate_knowledge_base(kb_id, tenant_id)
        if not kb:
            logger.warning(f"❌ 知识库不存在或无权访问：kb_id={kb_id}")
            return {"code": 404, "message": "知识库不存在或无权访问", "data": None}

        logger.info(f"✓ 知识库验证通过：kb_id={kb_id}")

        # 使用工具函数处理文件上传
        result = await process_uploaded_files(
            files=files,
            kb_id=kb_id,
            tenant_id=tenant_id,
            process_callback=None  # 不立即处理，等待调用 /rag/process
        )

        logger.info(f"✅ 文件上传成功：kb_id={kb_id}, uploaded={len(result.get('uploaded_files', []))}")
        return {
            "code": 200,
            "message": "文件上传成功",
            "data": {
                "kb_id": kb_id,
                **result
            }
        }

    except Exception as e:
        logger.error(f"❌ 上传文件失败：kb_id={kb_id}, error={str(e)}", exc_info=True)
        return {"code": 500, "message": f"上传失败：{str(e)}", "data": None}

@router.delete("/{kb_id}/delete", response_model=DeleteResponse, summary="删除知识库")
async def delete_knowledge_base(request: Request, kb_id: str):
    """
    删除知识库（硬删除：删除数据库记录 + 物理文件 + 向量数据 或 软删除）
    """
    logger.info(f"🗑️ 收到删除知识库请求：kb_id={kb_id}")
    
    try:
        tenant_id = get_tenant_id(request)
        logger.info(f"✓ 获取租户 ID: {tenant_id}")
        
        # 检查知识库是否存在且属于当前租户
        kb = KnowledgeBase.get_or_none(
            (KnowledgeBase.kb_id == kb_id) & 
            (KnowledgeBase.tenant_id == tenant_id) & 
            (KnowledgeBase.is_deleted == False)
        )
        if not kb:
            logger.warning(f"❌ 知识库不存在或无权访问：kb_id={kb_id}")
            return {"code": 404, "message": "知识库不存在或无权访问", "data": None}
        ##硬删除-----------
        # ========== 1. 删除所有相关文档和文件 ==========
        logger.info(f"📁 开始删除知识库下的文档和文件...")
        documents = Document.select().where(Document.kb_id == kb_id)
        
        import os
        import shutil
        for doc in documents:
            # 删除物理文件
            if os.path.exists(doc.file_path):
                os.remove(doc.file_path)
                logger.info(f"✓ 删除文件：{doc.file_path}")
        
        # ========== 2. 删除所有切片记录 ==========
        logger.info(f"✂️  删除所有切片记录...")
        Chunk.delete().where(Chunk.kb_id == kb_id).execute()
        logger.info(f"✓ 删除切片完成")
        
        # ========== 3. 删除向量数据库目录 ==========
        logger.info(f"🗄️  删除向量数据库目录...")
        try:
            from ..rag.vector_store import VectorStore
            vector_store_dir = f"database/chroma_db/{kb_id}"
            if os.path.exists(vector_store_dir):
                shutil.rmtree(vector_store_dir)
                logger.info(f"✓ 删除向量库目录：{vector_store_dir}")
        except Exception as e:
            logger.warning(f"⚠️  删除向量库失败：{e}")
        
        # ========== 4. 删除知识库记录 ==========
        logger.info(f"🗑️  删除知识库记录...")
        kb.delete_instance()
        # ### 执行软删除------------
        # kb.is_deleted = True
        # kb.save()
        #
        logger.info(f"✅ 知识库删除成功：kb_id={kb_id}")
        return {"code": 0, "message": "知识库删除成功", "data": None}
    except Exception as e:
        logger.error(f"❌ 删除知识库失败：kb_id={kb_id}, error={str(e)}", exc_info=True)
        return {"code": 500, "message": str(e), "data": None}


@router.delete("/{kb_id}/documents/{doc_id}/delete", response_model=DeleteResponse, summary="删除文档")
async def delete_document(request: Request, kb_id: str, doc_id: str):
    """
    删除知识库下的文档（硬删除，同时删除文件和数据库记录）
    """
    logger.info(f"🗑️ 收到删除文档请求：kb_id={kb_id}, doc_id={doc_id}")
    
    try:
        tenant_id = get_tenant_id(request)
        logger.info(f"✓ 获取租户 ID: {tenant_id}")
        
        # 验证知识库是否存在且属于当前租户
        kb = validate_knowledge_base(kb_id, tenant_id)
        if not kb:
            logger.warning(f"❌ 知识库不存在或无权访问：kb_id={kb_id}")
            return {"code": 404, "message": "知识库不存在或无权访问", "data": None}
        
        # 查询文档
        doc = Document.get_or_none(
            (Document.id == doc_id) & 
            (Document.kb_id == kb_id) & 
            (Document.is_deleted == False)
        )
        if not doc:
            logger.warning(f"❌ 文档不存在：doc_id={doc_id}")
            return {"code": 404, "message": "文档不存在", "data": None}
        
        # 删除文件（如果存在）
        import os
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
            logger.info(f"✓ 删除文件：{doc.file_path}")
        
        # 删除相关的切片记录
        Chunk.delete().where(Chunk.document_id == doc_id).execute()
        logger.info(f"✓ 删除文档相关的切片")
        
        # 删除文档记录
        doc.delete_instance()
        logger.info(f"✅ 文档删除成功：doc_id={doc_id}")
        
        return {"code": 0, "message": "文档删除成功", "data": None}
    except Exception as e:
        logger.error(f"❌ 删除文档失败：kb_id={kb_id}, doc_id={doc_id}, error={str(e)}", exc_info=True)
        return {"code": 500, "message": str(e), "data": None}

