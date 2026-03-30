#!/usr/bin/env python3
"""
知识图谱向量化服务
将知识节点的 name 和 description 拼接，使用 Embedding 模型生成向量，存入 ChromaDB
"""
from typing import List, Dict, Any, Optional
from loguru import logger
from app.rag.embedding import get_embedding_model
from app.rag.vector_store import VectorStore
from app.db.models.knowledge_graph import KnowledgeNode


class GraphVectorService:
    """知识图谱向量化服务"""
    
    def __init__(self):
        """初始化向量化服务"""
        self.embedding_model = get_embedding_model("text-embedding-v4")
    
    def _generate_node_text(self, node: KnowledgeNode) -> str:
        """
        生成节点的向量化文本（name + description）
        
        Args:
            node: 知识节点对象
            
        Returns:
            拼接后的文本
        """
        name = node.name.strip()
        description = (node.description or "").strip()
        
        # 拼接策略：name + description
        if description:
            return f"{name} - {description}"
        else:
            return name
    
    def index_node(self, node_id: str, kb_id: str = "knowledge_graph") -> bool:
        """
        向量化单个节点并存储
        
        Args:
            node_id: 节点 ID
            kb_id: 向量库 ID（默认使用 knowledge_graph）
            
        Returns:
            是否成功
        """
        try:
            # 获取节点
            node = KnowledgeNode.get_or_none(KnowledgeNode.id == node_id)
            if not node:
                logger.error(f"❌ 节点不存在：{node_id}")
                return False
            
            # 生成向量化文本
            text = self._generate_node_text(node)
            
            # 生成向量
            embedding = self.embedding_model.embed_documents([text])
            if not embedding:
                logger.error(f"❌ 向量化失败：{node_id}")
                return False
            
            # 存入向量库
            vector_store = VectorStore(kb_id=kb_id)
            vector_store.add_vectors(
                vectors=embedding,
                documents=[text],
                ids=[node_id],
                metadatas=[{
                    "node_id": node_id,
                    "node_name": node.name,
                    "node_type": node.node_type,
                    "level": node.level,
                    "module": node.module or ""
                }]
            )
            
            logger.info(f"✅ 向量化节点：{node_id} - {node.name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ 向量化节点失败：{e}")
            return False
    
    def index_all_nodes(self, kb_id: str = "knowledge_graph", batch_size: int = 10) -> Dict[str, Any]:
        """
        向量化所有知识节点
        
        Args:
            kb_id: 向量库 ID
            batch_size: 批次大小
            
        Returns:
            处理结果统计
        """
        try:
            # 获取所有节点
            nodes = KnowledgeNode.select().order_by(KnowledgeNode.level, KnowledgeNode.name)
            total = nodes.count()
            
            logger.info(f"📊 开始向量化 {total} 个知识节点...")
            
            # 分批处理
            vector_store = VectorStore(kb_id=kb_id)
            success_count = 0
            failed_nodes = []
            
            for i in range(0, total, batch_size):
                batch_nodes = list(nodes[i:i + batch_size])
                
                # 准备批量数据
                texts = [self._generate_node_text(node) for node in batch_nodes]
                ids = [node.id for node in batch_nodes]
                metadatas = [{
                    "node_id": node.id,
                    "node_name": node.name,
                    "node_type": node.node_type,
                    "level": node.level,
                    "module": node.module or ""
                } for node in batch_nodes]
                
                # 生成向量
                logger.info(f"处理批次 {i // batch_size + 1}/{(total - 1) // batch_size + 1}")
                embeddings = self.embedding_model.embed_documents(texts)
                
                if embeddings:
                    # 存入向量库
                    vector_store.add_vectors(
                        vectors=embeddings,
                        documents=texts,
                        ids=ids,
                        metadatas=metadatas
                    )
                    success_count += len(ids)
                else:
                    failed_nodes.extend([node.id for node in batch_nodes])
            
            result = {
                "total": total,
                "success": success_count,
                "failed": len(failed_nodes),
                "failed_ids": failed_nodes
            }
            
            logger.info(f"✅ 向量化完成：成功 {success_count}/{total}, 失败 {len(failed_nodes)}")
            return result
            
        except Exception as e:
            logger.error(f"❌ 批量向量化失败：{e}")
            return {
                "total": 0,
                "success": 0,
                "failed": 0,
                "error": str(e)
            }
    
    def search_nodes(
        self,
        query: str,
        top_k: int = 5,
        kb_id: str = "knowledge_graph"
    ) -> List[Dict[str, Any]]:
        """
        语义搜索知识节点
        
        Args:
            query: 查询文本
            top_k: 返回结果数量
            kb_id: 向量库 ID
            
        Returns:
            搜索结果列表
        """
        try:
            # 生成查询向量
            query_vector = self.embedding_model.embed_query(query)
            if not query_vector:
                logger.error("❌ 查询向量化失败")
                return []
            
            # 搜索向量库
            vector_store = VectorStore(kb_id=kb_id)
            results = vector_store.search(
                query_vector=query_vector,
                top_k=top_k
            )
            
            # 格式化结果
            search_results = []
            for result in results.get('results', []):
                metadata = result.get('metadata', {})
                search_results.append({
                    'node_id': metadata.get('node_id'),
                    'node_name': metadata.get('node_name'),
                    'node_type': metadata.get('node_type'),
                    'level': metadata.get('level'),
                    'module': metadata.get('module'),
                    'similarity': 1 - result.get('distance', 1),  # 距离转相似度
                    'matched_text': result.get('document', '')
                })
            
            logger.info(f"🔍 搜索到 {len(search_results)} 个相关节点")
            return search_results
            
        except Exception as e:
            logger.error(f"❌ 搜索失败：{e}")
            return []
    
    def clear_vectors(self, kb_id: str = "knowledge_graph") -> bool:
        """
        清空向量库
        
        Args:
            kb_id: 向量库 ID
            
        Returns:
            是否清空成功
        """
        try:
            vector_store = VectorStore(kb_id=kb_id)
            vector_store.clear()
            logger.info(f"✅ 清空向量库：{kb_id}")
            return True
        except Exception as e:
            logger.error(f"❌ 清空向量库失败：{e}")
            return False


# 全局服务实例
graph_vector_service = GraphVectorService()


def get_graph_vector_service() -> GraphVectorService:
    """获取向量化服务实例"""
    return graph_vector_service
