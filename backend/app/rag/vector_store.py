# ChromaDB 封装
import logging
from typing import List, Dict, Any, Optional

import chromadb

logger = logging.getLogger(__name__)


class VectorStore:
    """向量数据库存储"""
    
    def __init__(self, kb_id: str):
        """
        初始化向量存储
        
        Args:
            kb_id: 知识库 ID
        """
        self.kb_id = kb_id
        # 使用配置化的存储路径
        from ..core.config import settings
        chroma_path = settings.STORAGE_DIR / 'chroma_db' / str(kb_id)
        chroma_path.mkdir(parents=True, exist_ok=True)
        self.client = chromadb.PersistentClient(path=str(chroma_path))
        self.collection = self.client.get_or_create_collection(
            name=f"kb_{kb_id}",
            metadata={"hnsw:space": "cosine"}  # 使用余弦相似度
        )
    
    def add_vectors(
        self,
        vectors: List[List[float]],
        documents: List[str],
        ids: Optional[List[str]] = None,
        metadatas: Optional[List[Dict[str, Any]]] = None
    ) -> None:
        """
        添加向量到数据库
        
        Args:
            vectors: 向量列表
            documents: 原始文档文本列表
            ids: 唯一 ID 列表（如果为 None，则自动生成）
            metadatas: 元数据列表
        """
        if len(vectors) != len(documents):
            raise ValueError("vectors 和 documents 长度必须一致")
        
        # 如果没有提供 IDs，自动生成
        if ids is None:
            ids = [f"doc_{i}" for i in range(len(vectors))]
        
        # 如果没有提供元数据，创建空列表
        if metadatas is None:
            metadatas = [{} for _ in range(len(vectors))]
        else:
            # 确保每个元数据都是字典
            metadatas = [{**m} if m else {} for m in metadatas]
        
        try:
            self.collection.add(
                embeddings=vectors,
                documents=documents,
                ids=ids,
                metadatas=metadatas
            )
            logger.info(f"成功添加 {len(vectors)} 条向量到知识库 {self.kb_id}")
        except Exception as e:
            logger.error(f"添加向量失败：{e}")
            raise
    
    def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        搜索相似向量
        
        Args:
            query_vector: 查询向量
            top_k: 返回最相似的 K 条结果
            filter_dict: 过滤条件
            
        Returns:
            搜索结果，包含 documents、metadatas、distances 等
        """
        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=top_k,
            where=filter_dict
        )
        
        # 格式化返回结果
        if results and results['documents']:
            formatted_results = []
            for i in range(len(results['documents'][0])):
                formatted_results.append({
                    'document': results['documents'][0][i],
                    'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                    'distance': results['distances'][0][i] if results['distances'] else None
                })
            return {'results': formatted_results}
        
        return {'results': []}
    
    def delete_by_ids(self, ids: List[str]) -> None:
        """
        根据 ID 删除向量
        
        Args:
            ids: 要删除的 ID 列表
        """
        if ids:
            self.collection.delete(ids=ids)
            logger.info(f"删除 {len(ids)} 条向量")
    
    def count(self) -> int:
        """
        获取向量总数
        
        Returns:
            向量数量
        """
        return self.collection.count()
    
    def clear(self) -> None:
        """
        清空集合
        """
        self.client.delete_collection(name=f"kb_{self.kb_id}")
        logger.info(f"清空知识库 {self.kb_id}")