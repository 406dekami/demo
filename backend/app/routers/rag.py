#!/usr/bin/env python3
"""
RAG 核心业务模块 - FastAPI 路由
提供文档上传、处理和问答接口
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from typing import List, Optional
import json
from ..db import KnowledgeBase, Document, Chunk, Conversation, Message
from ..schemas.rag import ProcessDocumentRequest, QueryRequest, UploadResponse, ProcessResponse, QueryResponse, NotebookCreateResponse
from ..rag.document_loader import DocumentLoader
from ..rag.chunking import LangChainChunker
from ..rag.vector_store import VectorStore
from ..rag.embedding import QwenEmbedding
from ..rag.retriever import Retriever
from ..rag.generator import Generator
from ..utils.get_tenant_id import get_tenant_id
import os
import logging
import uuid
import time

# 获取模块 logger
logger = logging.getLogger(__name__)



router = APIRouter(tags=["RAG 核心"])

@router.post("/upload", response_model=UploadResponse, summary="上传文档到知识库")
async def upload_document(
    request: Request,
    file: UploadFile = File(...), 
    kb_id: str = Form(...),
    chunk_size: int = Form(512),
    chunk_overlap: int = Form(50)
):
    """
    上传文档并添加到指定知识库
    """
    logger.info(f"📥 开始接收上传文件：kb_id={kb_id}, filename={file.filename}")
    
    try:
        tenant_id = get_tenant_id(request)
        logger.info(f"✓ 获取租户 ID: {tenant_id}")
        
        # 验证知识库是否存在且属于当前租户
        kb = KnowledgeBase.get_or_none(
            (KnowledgeBase.id == kb_id) & 
            (KnowledgeBase.tenant_id == tenant_id) & 
            (KnowledgeBase.is_deleted == False)
        )
        if not kb:
            logger.warning(f"❌ 知识库不存在或无权访问：kb_id={kb_id}, tenant_id={tenant_id}")
            return {"code": 404, "message": "知识库不存在或无权访问", "data": None}
        
        logger.info(f"✓ 知识库验证通过：{kb.name}")
        
        # 创建 uploads 目录：backend/data/uploads/{tenant_id}/{kb_id}/
        upload_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),  # backend/
            "data",
            "uploads",
            str(tenant_id),
            str(kb_id)
        )
        os.makedirs(upload_dir, exist_ok=True)
        logger.info(f"✓ 上传目录已准备：{upload_dir}")
        
        # 生成唯一文件名（使用 UUID 避免重名）
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(upload_dir, unique_filename)
        logger.info(f"✓ 生成文件路径：{file_path}")
        
        # 保存上传的文件
        logger.info(f"💾 正在保存文件...")
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        logger.info(f"✓ 文件保存成功，大小：{len(content)} bytes")
        
        # 创建文档记录
        doc = Document.create(
            kb_id=kb_id,
            name=file.filename,
            file_path=file_path,
            file_type=os.path.splitext(file.filename)[1][1:],
            file_size=len(content),
            parse_status="processing"
        )
        logger.info(f"✓ 创建文档记录：doc_id={doc.id}")
        
        # 更新知识库统计
        kb.update_time = int(time.time() * 1000)
        kb.save()
        logger.info(f"✓ 更新知识库时间戳")
        
        logger.info(f"✅ 文件上传完成：{file.filename}")
        return {
            "code": 0, 
            "message": "文件上传成功，开始处理", 
            "data": {
                "document_id": doc.id,
                "filename": file.filename
            }
        }
    except Exception as e:
        logger.error(f"❌ 文件上传失败：kb_id={kb_id}, filename={file.filename}, error={str(e)}", exc_info=True)
        return {"code": 500, "message": str(e), "data": None}

@router.post("/process", response_model=ProcessResponse, summary="处理已上传的文档")
async def process_document(request: ProcessDocumentRequest, req: Request):
    """
    处理已上传的文档，包括解析、分块和向量化
    使用 LangChain 递归分块策略
    """
    logger.info(f"🚀 开始处理文档：document_id={request.document_id}, chunk_size={request.chunk_size}, overlap={request.chunk_overlap}")
    
    try:
        tenant_id = get_tenant_id(req)
        logger.info(f"✓ 获取租户 ID: {tenant_id}")
        
        # 验证文档是否存在且属于当前租户
        doc = Document.get_or_none(
            (Document.id == request.document_id) & 
            (Document.kb_id.in_(
                KnowledgeBase.select(KnowledgeBase.kb_id).where(
                    (KnowledgeBase.tenant_id == tenant_id) & 
                    (KnowledgeBase.is_deleted == False)
                )
            ))
        )
        if not doc:
            logger.warning(f"❌ 文档不存在或无权访问：doc_id={doc.id}")
            return {"code": 404, "message": "文档不存在或无权访问", "data": None}
        
        logger.info(f"✓ 文档验证通过：doc_id={doc.id}, name={doc.name}")
        
        # 获取知识库配置
        kb = KnowledgeBase.get_by_id(doc.kb_id)
        if not kb:
            logger.warning(f"❌ 知识库不存在：kb_id={doc.kb_id}")
            return {"code": 404, "message": "知识库不存在", "data": None}
        logger.info(f"✓ 获取知识库配置：kb_id={kb.kb_id}, name={kb.name}")
        
        # 初始化组件
        loader = DocumentLoader()
        chunker = LangChainChunker(chunk_size=request.chunk_size, chunk_overlap=request.chunk_overlap)
        vector_store = VectorStore(kb.kb_id)
        embedding_service = QwenEmbedding()
        logger.info(f"✓ 组件初始化完成")
        
        # 解析文档
        try:
            logger.info(f"📄 开始解析文档：{doc.file_path}")
            raw_chunks = loader.load_document(doc.file_path)
            logger.info(f"✓ 文档解析完成，原始片段数：{len(raw_chunks)},内容：{raw_chunks[0]['text'] if raw_chunks else ''}")
            # 分块处理（使用 LangChain）
            logger.info(f"✂️ 开始分块处理...")
            text_chunks = chunker.chunk_documents(raw_chunks)
            
            if not text_chunks:
                raise ValueError("文档分块结果为空")
            
            logger.info(f"✓ 分块完成，共 {len(text_chunks)} 个片段")
            
            # 生成嵌入向量
            logger.info(f"🔢 开始向量化...")
            texts = [chunk["text"] for chunk in text_chunks]
            embeddings = embedding_service.embed_documents(texts)
            
            logger.info(f"✓ 向量化完成，维度：{len(embeddings[0]) if embeddings else 0}")
            
            # 准备批量数据
            ids = []
            metadatas = []
            documents = []
            db_chunks = []
            
            for i, (chunk, embedding) in enumerate(zip(text_chunks, embeddings)):
                chunk_id = f"{doc.id}_{i}"
                ids.append(chunk_id)
                metadatas.append({
                    **{k: v for k, v in chunk.items() if k in ['page', 'source', 'start_index', 'end_index']},
                    "doc_id": doc.id,
                    "kb_id": kb.kb_id,
                    "chunk_index": i
                })
                documents.append(chunk["text"])
                
                # 准备数据库保存
                db_chunk = Chunk(
                    document_id=doc.id,
                    kb_id=kb.kb_id,
                    content=chunk["text"],
                    meta_info={
                        "page": chunk.get("page"),
                        "source": chunk.get("source"),
                        "start_index": chunk.get("start_index"),
                        "end_index": chunk.get("end_index"),
                        "chunk_index": i
                    },
                    vector=str(embedding)
                )
                db_chunks.append(db_chunk)
            
            # 批量保存到数据库
            logger.info(f"💾 批量保存到数据库...")
            Chunk.bulk_create(db_chunks)
            logger.info(f"✓ 数据库保存完成，共 {len(db_chunks)} 条记录")
            
            # 批量添加到向量存储
            logger.info(f"🗄️ 添加到向量存储...")
            vector_store.add_vectors(
                vectors=embeddings,
                documents=documents,
                ids=ids,
                metadatas=metadatas
            )
            logger.info(f"✓ 向量库存储完成，总数：{vector_store.count()}")
            
            # 更新文档状态
            doc.parse_status = "done"
            doc.chunk_count = len(text_chunks)
            doc.save()
            logger.info(f"✓ 更新文档状态：done")
            
            # 更新知识库统计
            kb.update_time = int(time.time() * 1000)
            kb.save()
            logger.info(f"✓ 更新知识库时间戳")
            
            logger.info(f"✅ 文档处理完成：doc_id={doc.id}, chunks={len(text_chunks)}")
            return {
                "code": 0, 
                "message": f"文档处理完成，共生成{len(text_chunks)}个文本片段", 
                "data": {
                    "chunk_count": len(text_chunks),
                    "vector_count": vector_store.count()
                }
            }
        except Exception as e:
            # 更新文档状态为失败
            logger.error(f"❌ 文档处理过程失败：doc_id={doc.id}, error={str(e)}", exc_info=True)
            doc.parse_status = "failed"
            doc.parse_msg = f"处理失败：{str(e)}"
            doc.save()
            raise
    except Exception as e:
        logger.error(f"❌ 文档处理失败：doc_id={doc.id if 'doc' in locals() else request.document_id}, error={str(e)}", exc_info=True)
        return {"code": 500, "message": str(e), "data": None}

@router.post("/query", response_model=QueryResponse, summary="基于知识库的问答")
async def rag_query(req: Request, request: QueryRequest):
    """
    基于知识库的问答，结合检索和生成
    支持多轮对话和历史记录
    """
    logger.info(f"💬 收到查询请求：kb_id={request.kb_id}, query={request.query[:50]}...")
    try:
        tenant_id = get_tenant_id(req)
        logger.info(f"✓ 获取租户 ID: {tenant_id}")
        
        # 验证知识库是否存在且属于当前租户
        kb = KnowledgeBase.select().where(
            (KnowledgeBase.kb_id == request.kb_id) &
            (KnowledgeBase.tenant_id == tenant_id) &
            (KnowledgeBase.is_deleted == False)
        ).first()
        if not kb:
            logger.warning(f"❌ 知识库不存在或无权访问：kb_id={request.kb_id}")
            return {"code": 404, "message": "知识库不存在或无权访问", "data": None}
        
        logger.info(f"✓ 知识库验证通过：kb_id={kb.kb_id}")
        
        # 获取对话历史（如果提供）
        history = []
        if request.conversation_id:
            logger.info(f"📜 加载对话历史：conversation_id={request.conversation_id}")
            messages = Message.select().where(
                (Message.conversation_id == request.conversation_id) & 
                (Message.is_deleted == False)
            ).order_by(Message.create_time.asc())
            
            for msg in messages:
                history.append({
                    "role": msg.role,
                    "content": msg.content
                })
            logger.info(f"✓ 加载 {len(history)} 条历史消息")
        
        # 初始化 RAG 组件
        vector_store = VectorStore(kb.kb_id)
        embedding_service = QwenEmbedding()
        retriever = Retriever(vector_store, embedding_service, top_k=5)
        generator = Generator(model_name="qwen-plus")
        logger.info(f"✓ RAG 组件初始化完成")
        
        # 检查知识库中是否有文档
        doc_count = Document.select().where(Document.kb_id == kb.kb_id).count()
        chunk_count = Chunk.select().where(Chunk.kb_id == kb.kb_id).count()
        vector_count = vector_store.count()
        logger.info(f"📊 知识库统计：文档数={doc_count}, 切片数={chunk_count}, 向量数={vector_count}")
        
        # 检索相关上下文（传递 use_knowledge_graph 参数）
        logger.info(f"🔍 开始检索：query={request.query[:50]}..., use_knowledge_graph={request.use_knowledge_graph}")
        context = retriever.retrieve(
            request.query, 
            top_k=5,
            use_knowledge_graph=request.use_knowledge_graph
        )
        
        if context:
            logger.info(f"✓ 检索到 {len(context)} 条相关结果")
        else:
            logger.warning("⚠️ 未检索到相关结果")
        
        # 生成最终回答
        logger.info(f"🤖 开始生成回答...")
        answer = generator.generate(
            query=request.query,
            context=context,
            history=history
        )
        logger.info(f"✓ 回答生成完成，长度：{len(answer)}")
        
        # 保存新的对话消息（如果有对话 ID）
        if request.conversation_id:
            # 检查是否是对话的第一条消息，如果是则创建对话记录
            conv = Conversation.get_or_none(Conversation.id == request.conversation_id)
            if not conv:
                logger.info(f"🆕 创建新对话：conversation_id={request.conversation_id}")
                Conversation.create(
                    id=request.conversation_id,
                    kb_id=kb.kb_id,
                    name=request.query[:50] + "..." if len(request.query) > 50 else request.query
                )
            
            logger.info(f"💾 保存用户消息...")
            Message.create(
                conversation_id=request.conversation_id,
                role="user",
                content=request.query
            )
            logger.info(f"💾 保存 AI 回复...")
            Message.create(
                conversation_id=request.conversation_id,
                role="assistant",
                content=answer,
                meta_info={
                    "context": [{
                        "text": c.get("text"),
                        "score": c.get("score"),
                        "source": c.get("metadata", {}).get("source", "unknown")
                    } for c in context],
                    "kb_id": kb.kb_id,
                    "model": "qwen-plus"
                }
            )
            logger.info(f"✓ 对话消息已保存")
        
        logger.info(f"✅ 问答处理完成：kb_id={request.kb_id}")
        return {
            "code": 0, 
            "message": "success", 
            "data": {
                "answer": answer,
                "context": [
                    {
                        "text": c.get("text"),
                        "score": round(c.get("score", 0), 4),
                        "source": c.get("metadata", {}).get("source", "unknown"),
                        "chunk_index": c.get("metadata", {}).get("chunk_index", -1)
                    }
                    for c in context
                ],
                "conversation_id": request.conversation_id,
                "model": "qwen-plus"
            }
        }
    except Exception as e:
        logger.error(f"❌ 问答处理失败：kb_id={request.kb_id}, query={request.query[:50]}, error={str(e)}", exc_info=True)
        return {"code": 500, "message": str(e), "data": None}


# ==================== 笔记本管理 ====================

from pydantic import BaseModel
from typing import List, Optional


class NotebookCreateRequest(BaseModel):
    """创建笔记本请求"""
    title: str
    description: Optional[str] = None
    kb_ids: Optional[List[str]] = None
    model_name: Optional[str] = "qwen-plus"
    system_prompt: Optional[str] = None


class NotebookResponse(BaseModel):
    """笔记本响应"""
    notebook_id: str
    title: str
    kb_ids: List[str] = []


@router.get("/notebook/list", response_model=NotebookCreateResponse, summary="获取笔记本列表")
async def list_notebooks(request: Request):
    """
    获取当前用户的笔记本列表
    """
    logger.info(f"📋 收到获取笔记本列表请求")
    
    try:
        tenant_id = get_tenant_id(request)
        logger.info(f"✓ 获取租户 ID: {tenant_id}")
        
        # 查询当前用户的所有对话（笔记本）
        conversations = Conversation.select().where(
            (Conversation.tenant_id == tenant_id) &
            (Conversation.is_deleted == False)
        ).order_by(Conversation.create_time.desc())
        
        notebooks = []
        for conv in conversations:
            kb_ids = []
            if conv.kb_ids:
                try:
                    kb_ids = json.loads(conv.kb_ids)
                except:
                    kb_ids = []
            
            notebooks.append({
                "notebook_id": str(conv.id),
                "title": conv.title,
                "kb_ids": kb_ids,
            })
        
        logger.info(f"✅ 获取笔记本列表成功，共 {len(notebooks)} 条")
        return {
            "code": 0,
            "message": "获取成功",
            "data": {
                "notebooks": notebooks
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 获取笔记本列表失败：error={str(e)}", exc_info=True)
        return {"code": 500, "message": str(e), "data": {"notebooks": []}}


@router.post("/notebook/create", response_model=NotebookCreateResponse, summary="创建笔记本")
async def create_notebook(request: Request, data: NotebookCreateRequest):
    """
    创建新的笔记本（实际是创建对话会话
    """
    logger.info(f"📝 收到创建笔记本请求：title={data.title}, kb_ids={data.kb_ids}")
    
    try:
        tenant_id = get_tenant_id(request)
        logger.info(f"✓ 获取租户 ID: {tenant_id}")
        
        # 验证知识库是否存在（如果指定了 kb_ids）
        if data.kb_ids and len(data.kb_ids) > 0:
            logger.info(f"🔍 验证知识库是否存在：kb_ids={data.kb_ids}")
            existing_kbs = KnowledgeBase.select().where(
                (KnowledgeBase.kb_id.in_(data.kb_ids)) &
                (KnowledgeBase.tenant_id == tenant_id) &
                (KnowledgeBase.is_deleted == False)
            )
            existing_kb_ids = [kb.kb_id for kb in existing_kbs]
            missing_kbs = set(data.kb_ids) - set(existing_kb_ids)
            
            if missing_kbs:
                logger.warning(f"❌ 以下知识库不存在：{missing_kbs}")
                return {"code": 404, "message": f"以下知识库不存在：{', '.join(missing_kbs)}", "data": None}
            
            logger.info(f"✓ 知识库验证通过")
        
        # 创建对话会话
        logger.info(f"🔄 开始创建对话会话...")
        import json
        conversation = Conversation.create(
            tenant_id=tenant_id,
            user_id=tenant_id,  # 暂时用 tenant_id 作为 user_id
            title=data.title,
            model_name=data.model_name or "qwen-plus",
            kb_ids=json.dumps(data.kb_ids) if data.kb_ids else None,
            system_prompt=data.system_prompt,
        )
        
        logger.info(f"✅ 笔记本创建成功：notebook_id={conversation.id}")
        return {
            "code": 0,
            "message": "创建成功",
            "data": {
                "notebook_id": str(conversation.id),
                "title": data.title,
                "kb_ids": data.kb_ids or [],
            }
        }
    except Exception as e:
        logger.error(f"❌ 创建笔记本失败：title={data.title}, error={str(e)}", exc_info=True)
        import traceback
        logger.error(f"📋 错误堆栈：{traceback.format_exc()}")
        return {"code": 500, "message": f"服务器内部错误：{str(e)}", "data": None}


@router.put("/notebook/{notebook_id}", response_model=NotebookCreateResponse, summary="更新笔记本")
async def update_notebook(request: Request, notebook_id: str, data: NotebookCreateRequest):
    """
    更新笔记本配置（修改关联的知识库、模型等）
    """
    logger.info(f"🔄 收到更新笔记本请求：notebook_id={notebook_id}")
    
    try:
        tenant_id = get_tenant_id(request)
        
        # 查找对话
        conversation = Conversation.get_or_none(
            (Conversation.id == notebook_id) &
            (Conversation.tenant_id == tenant_id) &
            (Conversation.is_deleted == False)
        )
        
        if not conversation:
            logger.warning(f"❌ 笔记本不存在：notebook_id={notebook_id}")
            raise HTTPException(status_code=404, detail="笔记本不存在")
        
        # 更新配置
        if data.kb_ids is not None:
            conversation.kb_ids = json.dumps(data.kb_ids) if data.kb_ids else None
        if data.model_name:
            conversation.model_name = data.model_name
        if data.system_prompt is not None:
            conversation.system_prompt = data.system_prompt
        if data.title:
            conversation.title = data.title
        
        conversation.save()
        
        logger.info(f"✅ 笔记本更新成功：notebook_id={notebook_id}")
        return {
            "code": 0,
            "message": "更新成功",
            "data": {
                "notebook_id": notebook_id,
                "title": conversation.title,
                "kb_ids": data.kb_ids or [],
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 更新笔记本失败：notebook_id={notebook_id}, error={str(e)}", exc_info=True)
        return {"code": 500, "message": str(e), "data": None}


@router.delete("/notebook/{notebook_id}/delete", response_model=NotebookCreateResponse, summary="删除笔记本")
async def delete_notebook(request: Request, notebook_id: str):
    """
    删除笔记本（硬删除）
    """
    logger.info(f"🗑️ 收到删除笔记本请求：notebook_id={notebook_id}")
    
    try:
        tenant_id = get_tenant_id(request)
        
        # 查找对话（Conversation 没有 is_deleted 字段）
        conversation = Conversation.get_or_none(
            (Conversation.id == notebook_id) &
            (Conversation.tenant_id == tenant_id)
        )
        
        if not conversation:
            logger.warning(f"❌ 笔记本不存在：notebook_id={notebook_id}")
            raise HTTPException(status_code=404, detail="笔记本不存在")
        
        # 硬删除 - 直接从数据库删除记录
        conversation.delete_instance()
        
        logger.info(f"✅ 笔记本删除成功：notebook_id={notebook_id}")
        return {
            "code": 0,
            "message": "删除成功",
            "data": {
                "notebook_id": notebook_id,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 删除笔记本失败：notebook_id={notebook_id}, error={str(e)}", exc_info=True)
        return {"code": 500, "message": str(e), "data": None}