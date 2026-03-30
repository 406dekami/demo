# Embedding 服务
# 使用 DashScope TextEmbedding API（同步批处理）
import dashscope
from http import HTTPStatus
import logging
import os
from dotenv import load_dotenv
from typing import List, Optional

# 确保加载环境变量
load_dotenv()

logger = logging.getLogger(__name__)

# 初始化时设置 API Key
dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")


class QwenEmbedding:
    """通义千问 Embedding 服务封装"""
    
    # 模型配置
    MODEL = "text-embedding-v4"  # 默认模型
    
    # 阈值配置
    MAX_BATCH_SIZE = 10  # DashScope 每批最大行数
    MAX_TOKENS_PER_TEXT = 2048  # 单行最大 Token 数
    
    def __init__(self, model_name: Optional[str] = None):
        """
        初始化 Embedding 服务
        
        Args:
            model_name: 模型名称，默认使用 text-embedding-v4
        """
        self.model_name = model_name or self.MODEL
    
    def _validate_texts(self, texts: List[str]) -> None:
        """验证输入文本"""
        if not texts:
            raise ValueError("输入文本列表不能为空")
        
        for i, text in enumerate(texts):
            if not isinstance(text, str):
                raise TypeError(f"第 {i} 条输入不是字符串类型")
            
            # 检查长度（粗略估算：1 个中文字符≈1.5 个 Token）
            if len(text) > self.MAX_TOKENS_PER_TEXT * 2:
                logger.warning(f"第 {i} 条文本过长，可能被截断")
    
    def embed_documents(self, texts: List[str], text_type: str = "document") -> List[List[float]]:
        """
        批量获取文档的向量表示
        
        Args:
            texts: 文档文本列表
            text_type: 文本类型（保留参数，当前接口不使用）
            
        Returns:
            向量列表，每个元素是一个 float 数组
            
        Raises:
            ValueError: 输入验证失败
            RuntimeError: API 调用失败
        """
        self._validate_texts(texts)
        
        try:
            logger.info(f"处理 {len(texts)} 条文本，使用模型：{self.model_name}")
            
            # 分批处理，每批最多 10 条（DashScope 限制）
            batch_size = self.MAX_BATCH_SIZE
            result = None
            batch_counter = 0
            
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                logger.debug(f"处理批次 {i // batch_size + 1}/{(len(texts) - 1) // batch_size + 1}")
                
                resp = dashscope.TextEmbedding.call(
                    model=self.model_name,
                    input=batch,
                    dimension=1024  # 指定向量维度
                )
                
                if resp.status_code == HTTPStatus.OK:
                    if result is None:
                        result = resp
                    else:
                        # 合并结果
                        for emb in resp.output['embeddings']:
                            emb['text_index'] += batch_counter
                            result.output['embeddings'].append(emb)
                        result.usage['total_tokens'] += resp.usage['total_tokens']
                else:
                    raise RuntimeError(f"Embedding API 错误：{resp.code} - {resp.message}")
                
                batch_counter += len(batch)
            
            # 提取向量结果
            if result and 'embeddings' in result.output:
                # 按 text_index 排序后提取
                sorted_embeddings = sorted(result.output['embeddings'], key=lambda x: x['text_index'])
                all_embeddings = [emb['embedding'] for emb in sorted_embeddings]
                return all_embeddings
            else:
                return []
                
        except Exception as e:
            logger.error(f"Embedding 失败：{e}")
            raise RuntimeError(f"向量化失败：{str(e)}")
    

    

    
    def embed_query(self, query: str) -> List[float]:
        """
        获取查询文本的向量（用于检索场景）
        
        Args:
            query: 查询文本
            
        Returns:
            单个向量
        """
        embeddings = self.embed_documents([query], text_type="query")
        return embeddings[0] if embeddings else []


def get_embedding_model(model_name: str = "text-embedding-v4"):
    """
    获取 embedding 模型实例
    
    Args:
        model_name: 模型名称
        
    Returns:
        QwenEmbedding 实例
    """
    return QwenEmbedding(model_name=model_name)
