#!/usr/bin/env python3
"""
知识库管理业务模块 - FastAPI 路由
"""
from fastapi import APIRouter, UploadFile, Request, File
from typing import List, Optional
import logging

from ..db import KnowledgeBase, Document, Chunk
from ..schemas.knowledge import (
    KnowledgeBaseCreateRequest,
    KnowledgeBaseUpdateRequest,
)
from ..utils.get_tenant_id import get_tenant_id
from ..utils.file_upload import validate_knowledge_base, process_uploaded_files
from ..utils.api_response import success_response, error_response

logger = logging.getLogger(__name__)
router = APIRouter()


def serialize_knowledge_base(kb: KnowledgeBase) -> dict:
    doc_count = Document.select().where(
        (Document.kb_id == kb.kb_id) &
        (Document.is_deleted == False)
    ).count()
    chunk_count = Chunk.select().where(
        (Chunk.kb_id == kb.kb_id) &
        (Chunk.is_deleted == False)
    ).count()
    doc_types = Document.select(Document.file_type).where(
        (Document.kb_id == kb.kb_id) &
        (Document.is_deleted == False)
    ).distinct().tuples()

    return {
        "id": kb.kb_id,
        "tenant_id": kb.tenant_id,
        "name": kb.name,
        "description": kb.description,
        "chunk_size": kb.chunk_size,
        "chunk_overlap": kb.chunk_overlap,
        "document_count": doc_count,
        "chunk_count": chunk_count,
        "file_types": [dt[0] for dt in doc_types],
        "cover_image": kb.cover_image,
        "cover_color": kb.cover_color,
        "create_time": kb.create_time,
        "update_time": kb.update_time,
    }


@router.post("/create", summary="创建知识库", tags=["知识库"])
async def create_knowledge_base(request: Request, data: KnowledgeBaseCreateRequest):
    logger.info(f"📝 收到创建知识库请求：name={data.name}")

    try:
        tenant_id = get_tenant_id(request)
        exists = KnowledgeBase.get_or_none(
            (KnowledgeBase.tenant_id == tenant_id) &
            (KnowledgeBase.name == data.name) &
            (KnowledgeBase.is_deleted == False)
        )
        if exists:
            return error_response("知识库名称已存在", code=409)

        import uuid
        kb_id = uuid.uuid4().hex[:32]
        kb = KnowledgeBase.create(
            kb_id=kb_id,
            tenant_id=tenant_id,
            name=data.name,
            description=data.description,
            chunk_size=data.chunk_size,
            chunk_overlap=data.chunk_overlap,
            cover_image=data.cover_image,
            cover_color=data.cover_color,
        )
        return success_response({"id": kb.kb_id, "name": kb.name}, "知识库创建成功")
    except Exception as e:
        logger.error(f"❌ 创建知识库失败：name={data.name}, error={str(e)}", exc_info=True)
        return error_response(str(e))


@router.put("/{kb_id}", summary="更新知识库", tags=["知识库"])
async def update_knowledge_base(request: Request, kb_id: str, data: KnowledgeBaseUpdateRequest):
    logger.info(f"✏️ 收到更新知识库请求：kb_id={kb_id}")

    try:
        tenant_id = get_tenant_id(request)
        kb = validate_knowledge_base(kb_id, tenant_id)
        if not kb:
            return error_response("知识库不存在或无权访问", code=404)

        name_exists = KnowledgeBase.get_or_none(
            (KnowledgeBase.tenant_id == tenant_id) &
            (KnowledgeBase.name == data.name) &
            (KnowledgeBase.kb_id != kb_id) &
            (KnowledgeBase.is_deleted == False)
        )
        if name_exists:
            return error_response("知识库名称已存在", code=409)

        kb.name = data.name
        kb.description = data.description
        kb.cover_image = data.cover_image
        kb.cover_color = data.cover_color
        kb.save()

        return success_response(serialize_knowledge_base(kb), "知识库更新成功")
    except Exception as e:
        logger.error(f"❌ 更新知识库失败：kb_id={kb_id}, error={str(e)}", exc_info=True)
        return error_response(str(e))


@router.get("/list", summary="获取知识库列表", tags=["知识库"])
async def list_knowledge_bases(request: Request, tenant_id: Optional[str] = None):
    logger.info("📋 收到获取知识库列表请求")

    try:
        current_tenant_id = tenant_id or get_tenant_id(request)
        kbs = KnowledgeBase.select().where(
            (KnowledgeBase.tenant_id == current_tenant_id) &
            (KnowledgeBase.is_deleted == False)
        ).order_by(KnowledgeBase.update_time.desc())

        result = [serialize_knowledge_base(kb) for kb in kbs]
        return success_response({"knowledge_bases": result})
    except Exception as e:
        logger.error(f"❌ 获取知识库列表失败：error={str(e)}", exc_info=True)
        return error_response(str(e))


@router.get("/{kb_id}/documents", summary="获取知识库文档列表", tags=["知识库"])
async def list_documents(request: Request, kb_id: str):
    logger.info(f"📋 收到获取文档列表请求：kb_id={kb_id}")

    try:
        tenant_id = get_tenant_id(request)
        kb = validate_knowledge_base(kb_id, tenant_id)
        if not kb:
            return error_response("知识库不存在或无权访问", code=404)

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
                "update_time": doc.update_time,
            })

        return success_response({"kb_id": kb_id, "documents": result})
    except Exception as e:
        logger.error(f"❌ 获取文档列表失败：kb_id={kb_id}, error={str(e)}", exc_info=True)
        return error_response(str(e))


@router.post("/{kb_id}/upload", summary="知识库上传文件", tags=["知识库"])
async def upload_knowledge_base(request: Request, kb_id: str, files: List[UploadFile] = File(...)):
    logger.info(f"📥 收到上传文件请求：kb_id={kb_id}, files={len(files)}")

    try:
        tenant_id = get_tenant_id(request)
        kb = validate_knowledge_base(kb_id, tenant_id)
        if not kb:
            return error_response("知识库不存在或无权访问", code=404)

        result = await process_uploaded_files(
            files=files,
            kb_id=kb_id,
            tenant_id=tenant_id,
            process_callback=None,
        )

        return success_response({"kb_id": kb_id, **result}, "文件上传成功")
    except Exception as e:
        logger.error(f"❌ 上传文件失败：kb_id={kb_id}, error={str(e)}", exc_info=True)
        return error_response(f"上传失败：{str(e)}")


@router.delete("/{kb_id}/delete", summary="删除知识库", tags=["知识库"])
async def delete_knowledge_base(request: Request, kb_id: str):
    logger.info(f"🗑️ 收到删除知识库请求：kb_id={kb_id}")

    try:
        tenant_id = get_tenant_id(request)
        kb = KnowledgeBase.get_or_none(
            (KnowledgeBase.kb_id == kb_id) &
            (KnowledgeBase.tenant_id == tenant_id) &
            (KnowledgeBase.is_deleted == False)
        )
        if not kb:
            return error_response("知识库不存在或无权访问", code=404)

        documents = Document.select().where(Document.kb_id == kb_id)
        for doc in documents:
            if os.path.exists(doc.file_path):
                os.remove(doc.file_path)

        Chunk.delete().where(Chunk.kb_id == kb_id).execute()

        try:
            vector_store_dir = f"database/chroma_db/{kb_id}"
            if os.path.exists(vector_store_dir):
                shutil.rmtree(vector_store_dir)
        except Exception as e:
            logger.warning(f"⚠️ 删除向量库失败：{e}")

        kb.delete_instance()
        return success_response(None, "知识库删除成功")
    except Exception as e:
        logger.error(f"❌ 删除知识库失败：kb_id={kb_id}, error={str(e)}", exc_info=True)
        return error_response(str(e))


@router.delete("/{kb_id}/documents/{doc_id}/delete", summary="删除文档")
async def delete_document(request: Request, kb_id: str, doc_id: str):
    logger.info(f"🗑️ 收到删除文档请求：kb_id={kb_id}, doc_id={doc_id}")

    try:
        tenant_id = get_tenant_id(request)
        kb = validate_knowledge_base(kb_id, tenant_id)
        if not kb:
            return error_response("知识库不存在或无权访问", code=404)

        doc = Document.get_or_none(
            (Document.id == doc_id) &
            (Document.kb_id == kb_id) &
            (Document.is_deleted == False)
        )
        if not doc:
            return error_response("文档不存在", code=404)

        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)

        Chunk.delete().where(Chunk.document_id == doc_id).execute()
        doc.delete_instance()

        return success_response(None, "文档删除成功")
    except Exception as e:
        logger.error(f"❌ 删除文档失败：kb_id={kb_id}, doc_id={doc_id}, error={str(e)}", exc_info=True)
        return error_response(str(e))
