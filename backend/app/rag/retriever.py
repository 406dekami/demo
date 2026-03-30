"""
检索器模块
负责从知识库中检索相关信息
"""
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class Retriever:
    """
    检索器，负责从向量存储中检索与查询相关的内容
    """
    
    def __init__(self, vector_store: 'VectorStore', embedding_service: 'QwenEmbedding', top_k: int = 5):
        """
        初始化检索器
        
        Args:
            vector_store: 向量存储实例
            embedding_service: Embedding 服务实例
            top_k: 返回最相关的 K 条结果
        """
        self.vector_store = vector_store
        self.embedding_service = embedding_service
        self.top_k = top_k
    
    def retrieve(self, query: str, top_k: Optional[int] = None, filter_dict: Optional[Dict[str, Any]] = None, use_knowledge_graph: bool = True) -> List[Dict[str, Any]]:
        """
        根据查询内容检索最相关的文本片段（集成知识图谱语义搜索）
        
        Args:
            query: 用户的查询内容
            top_k: 返回结果数量（可选，覆盖默认值）
            filter_dict: 过滤条件（可选），例如 {"source": "file1.txt"}
            use_knowledge_graph: 是否使用知识图谱搜索，默认 True
            
        Returns:
            包含相关文本片段和元信息的列表，每个元素包含：
            - text: 相关文本内容
            - score: 相似度分数（0-1 之间）
            - metadata: 元信息（来源、页码等）
        """
        try:
            k = top_k or self.top_k
            
            logger.info(f"检索查询：{query}, top_k={k}, use_knowledge_graph={use_knowledge_graph}")
            
            # 1. 优先从知识图谱中搜索（如果启用）
            if use_knowledge_graph:
                try:
                    from app.services.graph_vector_service import get_graph_vector_service
                    from app.services.knowledge_graph_service import KnowledgeGraphService
                    
                    graph_vector_service = get_graph_vector_service()
                    kg_results = graph_vector_service.search_nodes(query, top_k=k)
                    
                    if kg_results:
                        logger.info(f"✅ 从知识图谱中找到 {len(kg_results)} 个相关节点")
                        
                        # 构建增强结果
                        retrieved_chunks = []
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
                                    
                                    retrieved_chunks.append({
                                        "text": ' | '.join(content_parts) if content_parts else node_data.get('matched_text', ''),
                                        "score": node_data['similarity'],
                                        "metadata": {
                                            "source": f"知识图谱节点：{node_id}",
                                            "node_id": node_id,
                                            "node_type": node_data['node_type'],
                                            "level": node_data['level'],
                                            "node_detail": node_detail
                                        }
                                    })
                            except Exception as e:
                                logger.warning(f"获取节点 {node_id} 详情失败：{e}")
                                # 如果获取详情失败，至少返回基本信息
                                retrieved_chunks.append({
                                    "text": node_data.get('matched_text', ''),
                                    "score": node_data['similarity'],
                                    "metadata": {
                                        "source": f"知识图谱节点：{node_id}",
                                        "node_id": node_id,
                                        "node_type": node_data['node_type'],
                                        "level": node_data['level']
                                    }
                                })
                        
                        return retrieved_chunks
                    else:
                        logger.info("⚠️ 知识图谱中未找到相关节点，使用普通 RAG 检索")
                except Exception as e:
                    logger.warning(f"知识图谱搜索失败，使用普通 RAG 检索：{e}")
            
            # 2. 如果知识图谱没有找到或禁用，使用普通 RAG 检索
            query_embedding = self.embedding_service.embed_query(query)
            
            if not query_embedding:
                logger.warning("生成的查询向量为空")
                return []
            
            # 在向量数据库中搜索
            results = self.vector_store.search(
                query_vector=query_embedding,
                top_k=k,
                filter_dict=filter_dict
            )
            
            # 处理检索结果
            retrieved_chunks = []
            if results and results.get('results'):
                for item in results['results']:
                    chunk_info = {
                        "text": item.get('document', ''),
                        "score": 1.0 - (item.get('distance', 1.0) if item.get('distance') is not None else 0.0),  # 余弦距离转相似度
                        "metadata": item.get('metadata', {})
                    }
                    retrieved_chunks.append(chunk_info)
            
            logger.info(f"检索到 {len(retrieved_chunks)} 条相关结果")
            return retrieved_chunks
            
        except Exception as e:
            logger.error(f"检索失败 {query}: {e}")
            return []
    
    def retrieve_with_rerank(
        self, 
        query: str, 
        top_k: int = 5,
        rerank_top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        检索并重排序（Rerank）
        
        Args:
            query: 查询内容
            top_k: 初始检索数量
            rerank_top_k: 重排序后返回的数量
            
        Returns:
            重排序后的检索结果
        """
        # TODO: 实现 Rerank 逻辑
        # 可以先使用 DashScope 或其他 Rerank 模型对初筛结果进行重排序
        chunks = self.retrieve(query, top_k=top_k)
        
        # 当前简化版本：直接返回前 rerank_top_k 条
        return chunks[:rerank_top_k]
    
    def search_and_generate_context(
        self, 
        query: str, 
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        检索并生成上下文（用于 RAG 问答）
        
        Args:
            query: 查询内容
            top_k: 检索数量
            
        Returns:
            包含检索结果和上下文字典的字典：
            {
                "context": "拼接后的上下文字本",
                "chunks": [检索到的片段列表],
                "query": "原始查询"
            }
        """
        chunks = self.retrieve(query, top_k=top_k)
        
        # 拼接上下文
        context_texts = [chunk['text'] for chunk in chunks]
        context = "\n\n".join(context_texts)
        
        return {
            "context": context,
            "chunks": chunks,
            "query": query
        }