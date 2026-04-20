#!/usr/bin/env python3
"""
文件上传工具模块
负责文件的本地存储、数据库记录创建和异步处理调度
"""
import logging
import os
import shutil
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional

from fastapi import UploadFile

from ..core.config import settings
from ..db import KnowledgeBase, Document


# 基础上传目录：使用配置中的租户隔离路径
# 实际路径在 save_uploaded_file 中动态生成


async def save_uploaded_file(
    file: UploadFile,
    kb_id: str,
    tenant_id: str
) -> Optional[Dict[str, Any]]:
    """
    保存上传的文件到本地并创建数据库记录
    
    Args:
        file: FastAPI UploadFile 对象
        kb_id: 知识库 ID
        tenant_id: 租户 ID
        
    Returns:
        文件记录信息字典，包含 file_id, file_name, path, status 等
        如果失败返回 None
    """
    if not file.filename:
        return None
    
    try:
        # 1. 安全处理文件名
        safe_filename = os.path.basename(file.filename)
        if not safe_filename:
            return None
        
        # 2. 获取文件扩展名
        file_ext = Path(safe_filename).suffix.lower()
        if not file_ext:
            file_ext = ".bin"
        
        ext_folder_name = file_ext.lstrip('.')
        
        # 3. 构建存储路径：使用配置中的租户上传目录
        upload_dir = settings.get_tenant_upload_dir(str(tenant_id))
        dest_dir = upload_dir / str(kb_id) / ext_folder_name
        dest_dir.mkdir(parents=True, exist_ok=True)
        
        # 4. 生成唯一文件名
        unique_filename = f"{uuid.uuid4().hex}_{safe_filename}"
        file_path = os.path.join(dest_dir, unique_filename)
        
        # 5. 保存文件到本地
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logging.info(f"保存文件：{file_path}")
        
        # 6. 创建数据库记录
        # 生成文档 ID
        doc_id = uuid.uuid4().hex
        file_record = Document.create(
            id=doc_id,
            kb_id=kb_id,
            name=safe_filename,
            file_path=file_path,
            file_type=file_ext,
            file_size=file.size or 0,
            chunk_count=0,
            parse_status="pending",
            parse_msg=None
        )
        
        return {
            "file_id": file_record.id,
            "file_name": safe_filename,
            "path": file_path,
            "status": "pending",
            "file_type": file_ext,
            "record": file_record
        }
        
    except Exception as e:
        logging.error(f"保存文件失败：{file.filename}, error: {str(e)}")
        # 清理已保存的文件
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise


async def process_uploaded_files(
    files: List[UploadFile],
    kb_id: str,
    tenant_id: str,
    process_callback=None
) -> Dict[str, Any]:
    """
    批量处理上传的文件
    
    Args:
        files: 上传的文件列表
        kb_id: 知识库 ID
        tenant_id: 租户 ID
        process_callback: 可选的异步处理回调函数，签名：async fn(doc_id, kb_id)
        
    Returns:
        包含上传结果信息的字典
    """
    uploaded_file_records = []
    
    for file in files:
        result = await save_uploaded_file(file, kb_id, tenant_id)
        if result:
            record_info = {
                "file_id": result["file_id"],
                "file_name": result["file_name"],
                "path": result["path"],
                "status": result["status"]
            }
            uploaded_file_records.append(record_info)
            
            # 如果有回调函数，调用它进行异步处理
            if process_callback and result.get("record"):
                import asyncio
                asyncio.create_task(process_callback(result["record"].id, kb_id))
    
    return {
        "count": len(uploaded_file_records),
        "files": uploaded_file_records
    }


def validate_knowledge_base(kb_id: str, tenant_id: str) -> Optional[KnowledgeBase]:
    """
    验证知识库是否存在且属于当前租户
    
    Args:
        kb_id: 知识库 ID
        tenant_id: 租户 ID
        
    Returns:
        KnowledgeBase 对象，如果不存在返回 None
    """
    kb = KnowledgeBase.get_or_none(
        (KnowledgeBase.kb_id == kb_id) &
        (KnowledgeBase.tenant_id == tenant_id) &
        (KnowledgeBase.is_deleted == False)
    )
    return kb
