#!/usr/bin/env python3
"""RAG 核心业务模块 - FastAPI 路由

提供文档上传、处理、问答及笔记本管理功能
统一使用 success_response / error_response 工具函数
"""
import json
import logging
import os
import time
import uuid

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from ..db import Chunk, Conversation, Document, KnowledgeBase, Message
from ..rag.embedding import QwenEmbedding
from ..rag.generator import Generator
from ..rag.retriever import Retriever
from ..rag.vector_store import VectorStore
from ..schemas.rag import NotebookCreateRequest, ProcessDocumentRequest, QueryRequest
from ..utils.api_response import error_response, success_response
from ..utils.get_tenant_id import get_tenant_id

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_owned_kb_or_none(tenant_id: str, kb_id: str):
    return KnowledgeBase.get_or_none((KnowledgeBase.kb_id == kb_id) & (KnowledgeBase.tenant_id == tenant_id) & (KnowledgeBase.is_deleted == False))


def _parse_kb_ids(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        value = json.loads(raw)
        return value if isinstance(value, list) else []
    except Exception:
        return []


def _ensure_conversation(tenant_id: str, conversation_id: str, title: str, kb_id: str):
    conversation = Conversation.get_or_none((Conversation.id == conversation_id) & (Conversation.tenant_id == tenant_id) & (Conversation.is_deleted == False))
    if conversation:
        return conversation
    return Conversation.create(id=conversation_id, tenant_id=tenant_id, user_id=tenant_id, title=title, model_name="qwen-plus", kb_ids=json.dumps([kb_id], ensure_ascii=False), system_prompt=None)


@router.post("/upload", summary="上传文档到知识库", tags=["RAG"])
async def upload_document(request: Request, file: UploadFile = File(...), kb_id: str = Form(...), chunk_size: int = Form(512), chunk_overlap: int = Form(50)):
    try:
        tenant_id = get_tenant_id(request)
        kb = _get_owned_kb_or_none(tenant_id, kb_id)
        if not kb:
            return error_response("知识库不存在或无权访问")

        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "uploads", str(tenant_id), str(kb_id))
        os.makedirs(upload_dir, exist_ok=True)

        file_ext = os.path.splitext(file.filename or "")[1]
        file_path = os.path.join(upload_dir, f"{uuid.uuid4().hex}{file_ext}")
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        doc = Document.create(id=uuid.uuid4().hex, kb_id=kb_id, name=file.filename, file_path=file_path, file_type=os.path.splitext(file.filename or "")[1][1:], file_size=len(content), parse_status="processing")
        kb.update_time = int(time.time() * 1000)
        kb.save()
        return success_response({"document_id": doc.id, "filename": file.filename, "chunk_size": chunk_size, "chunk_overlap": chunk_overlap}, "文件上传成功，开始处理")
    except Exception as e:
        logger.error(f"❌ 文件上传失败：{e}", exc_info=True)
        return error_response(str(e))


@router.post("/process", summary="处理已上传的文档", tags=["RAG"])
async def process_document(request: ProcessDocumentRequest, req: Request):
    try:
        tenant_id = get_tenant_id(req)
        doc = Document.get_or_none((Document.id == request.document_id) & (Document.kb_id.in_(KnowledgeBase.select(KnowledgeBase.kb_id).where((KnowledgeBase.tenant_id == tenant_id) & (KnowledgeBase.is_deleted == False)))))
        if not doc:
            return error_response("文档不存在或无权访问")

        kb = KnowledgeBase.get_by_id(doc.kb_id)
        if not kb:
            return error_response("知识库不存在")

        from ..rag.chunking import LangChainChunker
        from ..rag.document_loader import DocumentLoader

        loader = DocumentLoader()
        chunker = LangChainChunker(chunk_size=request.chunk_size, chunk_overlap=request.chunk_overlap)
        vector_store = VectorStore(kb.kb_id)
        embedding_service = QwenEmbedding()

        try:
            raw_chunks = loader.load_document(doc.file_path)
            if raw_chunks:
                text = raw_chunks[0].get("text", "")
                printable_ratio = sum(1 for c in text if c.isprintable() or c in "\n\r\t") / max(len(text), 1)
                if len(text) > 100 and printable_ratio < 0.7:
                    raise ValueError(f"暂不支持该文件格式或文件已损坏：{doc.name}。请尝试转换为 PDF 或 .docx 后重新上传。")

            text_chunks = chunker.chunk_documents(raw_chunks)
            if not text_chunks:
                raise ValueError("文档分块结果为空")

            texts = [chunk["text"] for chunk in text_chunks]
            embeddings = embedding_service.embed_documents(texts)
            ids, metadatas, documents, db_chunks = [], [], [], []

            for index, (chunk, embedding) in enumerate(zip(text_chunks, embeddings)):
                ids.append(f"{doc.id}_{index}")
                metadatas.append({**{k: v for k, v in chunk.items() if k in ["page", "source", "start_index", "end_index"]}, "doc_id": doc.id, "kb_id": kb.kb_id, "chunk_index": index})
                documents.append(chunk["text"])
                db_chunks.append(Chunk(document_id=doc.id, kb_id=kb.kb_id, content=chunk["text"], meta_info=json.dumps({"page": chunk.get("page"), "source": chunk.get("source"), "start_index": chunk.get("start_index"), "end_index": chunk.get("end_index"), "chunk_index": index}, ensure_ascii=False), vector=json.dumps(embedding, ensure_ascii=False)))

            Chunk.bulk_create(db_chunks)
            vector_store.add_vectors(vectors=embeddings, documents=documents, ids=ids, metadatas=metadatas)
            doc.parse_status = "done"
            doc.chunk_count = len(text_chunks)
            doc.parse_msg = None
            doc.save()
            kb.update_time = int(time.time() * 1000)
            kb.save()
            return success_response({"chunk_count": len(text_chunks), "vector_count": vector_store.count()}, f"文档处理完成，共生成{len(text_chunks)}个文本片段")
        except Exception as e:
            doc.parse_status = "failed"
            doc.parse_msg = f"处理失败：{str(e)}"
            doc.save()
            raise
    except Exception as e:
        logger.error(f"❌ 文档处理失败：{e}", exc_info=True)
        return error_response(str(e))


@router.post("/query", summary="基于知识库的问答", tags=["RAG"])
async def rag_query(req: Request, request: QueryRequest):
    try:
        tenant_id = get_tenant_id(req)
        kb = _get_owned_kb_or_none(tenant_id, request.kb_id)
        if not kb:
            return error_response("知识库不存在或无权访问")

        history = []
        if request.conversation_id:
            messages = Message.select().where((Message.conversation_id == request.conversation_id) & (Message.is_deleted == False)).order_by(Message.create_time.asc())
            history = [{"role": msg.role, "content": msg.content} for msg in messages]

        retriever = Retriever(VectorStore(kb.kb_id), QwenEmbedding(), top_k=5)
        context = retriever.retrieve(request.query, top_k=5, use_knowledge_graph=request.use_knowledge_graph)
        answer = Generator(model_name="qwen-plus").generate(query=request.query, context=context, history=history)

        if request.conversation_id:
            _ensure_conversation(tenant_id, request.conversation_id, request.query[:50] + "..." if len(request.query) > 50 else request.query, kb.kb_id)
            Message.create(conversation_id=request.conversation_id, role="user", content=request.query)
            Message.create(conversation_id=request.conversation_id, role="assistant", content=answer, meta_info=json.dumps({"context": [{"text": c.get("text"), "score": c.get("score"), "source": c.get("metadata", {}).get("source", "unknown")} for c in context], "kb_id": kb.kb_id, "model": "qwen-plus"}, ensure_ascii=False))

        return success_response({"answer": answer, "context": [{"text": c.get("text"), "score": round(c.get("score", 0), 4), "source": c.get("metadata", {}).get("source", "unknown"), "chunk_index": c.get("metadata", {}).get("chunk_index", -1)} for c in context], "conversation_id": request.conversation_id, "model": "qwen-plus"})
    except Exception as e:
        logger.error(f"❌ 问答处理失败：{e}", exc_info=True)
        return error_response(str(e))


@router.get("/notebook/list", summary="获取笔记本列表", tags=["RAG"])
async def list_notebooks(request: Request):
    try:
        tenant_id = get_tenant_id(request)
        conversations = Conversation.select().where((Conversation.tenant_id == tenant_id) & (Conversation.is_deleted == False)).order_by(Conversation.create_time.desc())
        notebooks = [{"notebook_id": str(conv.id), "title": conv.title, "kb_ids": _parse_kb_ids(conv.kb_ids)} for conv in conversations]
        return success_response({"notebooks": notebooks}, "获取成功")
    except Exception as e:
        logger.error(f"❌ 获取笔记本列表失败：{e}", exc_info=True)
        return error_response(str(e), data={"notebooks": []})


@router.post("/notebook/create", summary="创建笔记本", tags=["RAG"])
async def create_notebook(request: Request, data: NotebookCreateRequest):
    try:
        tenant_id = get_tenant_id(request)
        if data.kb_ids:
            existing_kb_ids = [kb.kb_id for kb in KnowledgeBase.select().where((KnowledgeBase.kb_id.in_(data.kb_ids)) & (KnowledgeBase.tenant_id == tenant_id) & (KnowledgeBase.is_deleted == False))]
            missing_kbs = set(data.kb_ids) - set(existing_kb_ids)
            if missing_kbs:
                return error_response(f"以下知识库不存在：{', '.join(missing_kbs)}")
        conversation = Conversation.create(id=uuid.uuid4().hex, tenant_id=tenant_id, user_id=tenant_id, title=data.title, model_name=data.model_name or "qwen-plus", kb_ids=json.dumps(data.kb_ids or [], ensure_ascii=False), system_prompt=data.system_prompt)
        return success_response({"notebook_id": str(conversation.id), "title": conversation.title, "kb_ids": data.kb_ids or []}, "创建成功")
    except Exception as e:
        logger.error(f"❌ 创建笔记本失败：{e}", exc_info=True)
        return error_response(f"服务器内部错误：{str(e)}")


@router.put("/notebook/{notebook_id}", summary="更新笔记本", tags=["RAG"])
async def update_notebook(request: Request, notebook_id: str, data: NotebookCreateRequest):
    try:
        tenant_id = get_tenant_id(request)
        conversation = Conversation.get_or_none((Conversation.id == notebook_id) & (Conversation.tenant_id == tenant_id) & (Conversation.is_deleted == False))
        if not conversation:
            raise HTTPException(status_code=404, detail="笔记本不存在")
        if data.kb_ids is not None:
            conversation.kb_ids = json.dumps(data.kb_ids, ensure_ascii=False)
        if data.model_name:
            conversation.model_name = data.model_name
        if data.system_prompt is not None:
            conversation.system_prompt = data.system_prompt
        if data.title:
            conversation.title = data.title
        conversation.save()
        return success_response({"notebook_id": notebook_id, "title": conversation.title, "kb_ids": data.kb_ids or []}, "更新成功")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 更新笔记本失败：{e}", exc_info=True)
        return error_response(str(e))


@router.delete("/notebook/{notebook_id}/delete", summary="删除笔记本", tags=["RAG"])
async def delete_notebook(request: Request, notebook_id: str):
    try:
        tenant_id = get_tenant_id(request)
        conversation = Conversation.get_or_none((Conversation.id == notebook_id) & (Conversation.tenant_id == tenant_id) & (Conversation.is_deleted == False))
        if not conversation:
            raise HTTPException(status_code=404, detail="笔记本不存在")
        Message.delete().where(Message.conversation_id == notebook_id).execute()
        conversation.delete_instance()
        return success_response({"notebook_id": notebook_id}, "删除成功")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 删除笔记本失败：{e}", exc_info=True)
        return error_response(str(e))
