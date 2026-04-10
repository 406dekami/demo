"""
重排序模块
使用 DashScope qwen3-rerank 模型对检索结果进行重排序
"""
import logging
import os
from http import HTTPStatus
from typing import List, Dict, Any, Optional

import dashscope
from dotenv import load_dotenv

# 确保加载环境变量
load_dotenv()

logger = logging.getLogger(__name__)

# 初始化时设置 API Key
dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")


class QwenReranker:
    """通义千问 Rerank 服务封装"""
    
    # 模型配置
    MODEL = "qwen3-rerank"
    
    def __init__(self, model_name: Optional[str] = None):
        """
        初始化 Rerank 服务
        
        Args:
            model_name: 模型名称，默认使用 qwen3-rerank
        """
        self.model_name = model_name or self.MODEL
    
    def rerank(
        self, 
        query: str, 
        documents: List[str], 
        top_n: Optional[int] = None,
        instruct: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        对文档列表进行重排序
        
        Args:
            query: 查询内容
            documents: 待排序的文档文本列表
            top_n: 返回前 N 个结果（可选，默认返回所有）
            instruct: 自定义指令（可选）
            
        Returns:
            重排序后的结果列表，每个元素包含：
            - index: 原始文档索引
            - text: 文档文本
            - score: 相关性分数
            
        Raises:
            RuntimeError: API 调用失败
        """
        if not documents:
            logger.warning("文档列表为空，无法进行重排序")
            return []
        
        try:
            logger.info(f"开始重排序：query='{query[:50]}...', documents_count={len(documents)}")
            
            # 构建调用参数
            call_params = {
                "model": self.model_name,
                "query": query,
                "documents": documents,
                "return_documents": True
            }
            
            # 添加可选参数
            if top_n is not None:
                call_params["top_n"] = top_n
            
            if instruct:
                call_params["instruct"] = instruct
            else:
                # 默认指令：用于知识检索场景
                call_params["instruct"] = "Given a web search query, retrieve relevant passages that answer the query."
            
            # 调用 DashScope Rerank API
            resp = dashscope.TextReRank.call(**call_params)
            
            if resp.status_code == HTTPStatus.OK:
                # 解析结果
                results = []
                output_data = resp.output
                
                # DashScope 返回格式：output.results 包含排序后的结果
                if 'results' in output_data:
                    for item in output_data['results']:
                        result_item = {
                            "index": item.get('index', 0),
                            "text": documents[item.get('index', 0)] if item.get('index') is not None and item.get('index') < len(documents) else "",
                            "score": item.get('relevance_score', 0.0)
                        }
                        results.append(result_item)
                    
                    logger.info(f"✅ 重排序完成，返回 {len(results)} 条结果")
                    return results
                else:
                    logger.warning("API 返回格式异常，未找到 results 字段")
                    return []
            else:
                error_msg = f"Rerank API 调用失败: status_code={resp.status_code}, code={resp.code}, message={resp.message}"
                logger.error(error_msg)
                raise RuntimeError(error_msg)
                
        except Exception as e:
            logger.error(f"重排序失败: {e}")
            raise
    
    def rerank_chunks(
        self, 
        query: str, 
        chunks: List[Dict[str, Any]], 
        top_n: Optional[int] = None,
        instruct: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        对检索到的 chunk 列表进行重排序（保留原始元数据）
        
        Args:
            query: 查询内容
            chunks: 检索到的 chunk 列表，每个元素包含 text 和 metadata
            top_n: 返回前 N 个结果
            instruct: 自定义指令
            
        Returns:
            重排序后的 chunk 列表（保留原始结构，新增 rerank_score 字段）
        """
        if not chunks:
            return []
        
        try:
            # 提取文本
            texts = [chunk.get('text', '') for chunk in chunks]
            
            # 执行重排序
            reranked_results = self.rerank(query, texts, top_n=top_n, instruct=instruct)
            
            # 重建 chunk 列表（保留原始元数据）
            reranked_chunks = []
            for result in reranked_results:
                original_index = result['index']
                if 0 <= original_index < len(chunks):
                    original_chunk = chunks[original_index].copy()
                    # 添加重排序分数
                    original_chunk['rerank_score'] = result['score']
                    # 更新相似度分数为重排序分数
                    original_chunk['score'] = result['score']
                    reranked_chunks.append(original_chunk)
            
            logger.info(f"✅ Chunk 重排序完成：{len(reranked_chunks)} 条结果")
            return reranked_chunks
            
        except Exception as e:
            logger.error(f"Chunk 重排序失败: {e}")
            # 如果重排序失败，返回原始 chunks 的前 top_n 条（保持原顺序）
            if top_n is not None:
                return chunks[:top_n]
            return chunks


def get_reranker(model_name: Optional[str] = None) -> QwenReranker:
    """
    工厂函数：获取 Reranker 实例
    
    Args:
        model_name: 模型名称
        
    Returns:
        QwenReranker 实例
    """
    return QwenReranker(model_name=model_name)
