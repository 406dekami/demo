import logging
import os
import shutil
from typing import List, Dict, Any
from langchain_community.document_loaders import (
    PyPDFLoader, Docx2txtLoader, UnstructuredEPubLoader,
    UnstructuredHTMLLoader, UnstructuredPowerPointLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
import chromadb
from sentence_transformers import SentenceTransformer
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
from qwen_vl_utils import process_vision_info
from PIL import Image
import torch
import os

# 配置
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME")
QWEN_MODEL_NAME = os.getenv("QWEN_MODEL_NAME")
DB_PATH = os.getenv("DB_PATH")
chromadb_client = chromadb.PersistentClient(DB_PATH)
chromadb_collection = chromadb_client.get_or_create_collection(name="rag_collection")

def save_embeddings(chunks: List[Dict], collection: chromadb.Collection):
    """保存向量到数据库"""
    for chunk in chunks:
        collection.add(
            documents=[chunk['text']],
            metadatas=[chunk['metadata']],
            ids=[chunk['id']]
        )


class RAGEngine:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logging.info(f"Initializing RAG Engine with {self.device}...")

        # 1. 加载 Embedding 模型
        self.embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME, device=self.device)

        # 2. 加载 Qwen2-VL (用于看图)
        self.qwen_processor = AutoProcessor.from_pretrained(QWEN_MODEL_NAME)
        self.qwen_model = Qwen2VLForConditionalGeneration.from_pretrained(
            QWEN_MODEL_NAME, torch_dtype=torch.bfloat16 if self.device == "cuda" else torch.float32,
            device_map=self.device
        )

        # 3. 初始化向量库
        self.vector_store = Chroma(
            persist_directory=DB_PATH,
            embedding_function=self.embedding_model
        )
        self.text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        print("RAG Engine Ready.")

    def describe_image_with_qwen(self, image: Image.Image) -> str:
        """使用 Qwen2-VL 描述图片内容"""
        messages = [{
            "role": "user",
            "content": [{"type": "image", "image": image},
                        {"type": "text", "text": "请详细描述这张图表或图片的内容，提取关键数据。"}]
        }]
        text = self.qwen_processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        image_inputs, _ = process_vision_info(messages)
        inputs = self.qwen_processor(text=[text], images=image_inputs, padding=True, return_tensors="pt").to(
            self.device)

        generated_ids = self.qwen_model.generate(**inputs, max_new_tokens=128)
        description = self.qwen_processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        return description.strip()

    def process_file(self, file_path: str, filename: str):
        """解析文件，提取文本和图片，存入向量库"""
        print(f"Processing {filename}...")
        docs = []

        # 简单的格式路由 (实际生产建议用 Unstructured 统一处理)
        if filename.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
            # PyPDF 很难直接提取图片，这里主要提取文本。
            # 若要提取 PDF 图片，需用 pdf2image + Qwen-VL，代码会复杂很多，此处略过，仅做文本 RAG 演示
            docs.extend(loader.load())

        elif filename.endswith(".docx"):
            loader = Docx2txtLoader(file_path)
            docs.extend(loader.load())

        elif filename.endswith(".pptx"):
            # PPT 处理比较复杂，这里简化为提取文本
            # 高级做法：使用 python-pptx 提取每页图片，传给 Qwen-VL 描述
            loader = UnstructuredPowerPointLoader(file_path)
            docs.extend(loader.load())

        elif filename.endswith(".epub"):
            loader = UnstructuredEPubLoader(file_path)
            docs.extend(loader.load())

        elif filename.endswith(".html"):
            loader = UnstructuredHTMLLoader(file_path)
            docs.extend(loader.load())

        elif filename.endswith(".xlsx"):
            # Excel 转为 CSV 风格文本
            import pandas as pd
            df = pd.read_excel(file_path)
            text_content = df.to_string()
            from langchain.schema import Document
            docs.append(Document(page_content=text_content, metadata={"source": filename}))

        # 1. 文本分块
        splits = self.text_splitter.split_documents(docs)

        # 2. (可选) 这里可以加入逻辑：如果 split 里包含图片占位符，调用 self.describe_image_with_qwen

        # 3. 存入向量库
        # 给每个文档块加上文件名 metadata，方便溯源
        for doc in splits:
            doc.metadata["source"] = filename

        self.vector_store.add_documents(splits)
        print(f"Added {len(splits)} chunks from {filename} to vector store.")

    def search(self, query: str, k: int = 3) -> List[Dict]:
        """检索相关知识（集成知识图谱语义搜索 + Neo4j 上下文）"""
        # 1. 先从知识图谱中搜索相关节点
        kg_results = []
        try:
            from app.services.graph_vector_service import get_graph_vector_service
            from app.services.knowledge_graph_service import KnowledgeGraphService

            graph_vector_service = get_graph_vector_service()
            kg_results = graph_vector_service.search_nodes(query, top_k=k)

            if kg_results:
                logging.info(f"✅ 从知识图谱中找到 {len(kg_results)} 个相关节点")

                # 2. 根据节点 ID 从 Neo4j 获取详细信息和关联资料
                enriched_results = []
                for node_data in kg_results:
                    node_id = node_data['node_id']

                    # 获取节点详情
                    try:
                        node_detail = KnowledgeGraphService.get_node(node_id)
                        if node_detail:
                            # 组合节点的完整信息
                            content_parts = []
                            if node_detail.get('name'):
                                content_parts.append(f"【{node_detail['name']}】")
                            if node_detail.get('description'):
                                content_parts.append(node_detail['description'])
                            if node_detail.get('module'):
                                content_parts.append(f"所属模块：{node_detail['module']}")

                            enriched_results.append({
                                'content': ' | '.join(content_parts) if content_parts else node_data.get('matched_text', ''),
                                'source': f"知识图谱节点：{node_id}",
                                'node_id': node_id,
                                'node_type': node_data['node_type'],
                                'level': node_data['level'],
                                'similarity': node_data['similarity'],
                                'node_detail': node_detail  # 完整节点信息
                            })
                    except Exception as e:
                        logging.warning(f"获取节点 {node_id} 详情失败：{e}")
                        # 如果获取详情失败，至少返回基本信息
                        enriched_results.append(node_data)

                return enriched_results
        except Exception as e:
            logging.warning(f"知识图谱搜索失败，使用普通 RAG 搜索：{e}")

        # 3. 如果知识图谱没有找到，使用普通 RAG 搜索
        results = self.vector_store.similarity_search(query, k=k)
        return [{"content": doc.page_content, "source": doc.metadata.get("source")} for doc in results]


# 全局实例（延迟加载）
_engine_instance = None


def get_rag_engine():
    """获取 RAG 引擎实例（延迟加载）"""
    global _engine_instance
    if _engine_instance is None:
        print("\n⚙️  首次加载 RAG 引擎（这可能需要几秒钟）...")
        _engine_instance = RAGEngine()
        print("✅ RAG 引擎加载完成\n")
    return _engine_instance
