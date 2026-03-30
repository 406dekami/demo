"""
文本分块策略模块
将长文本分割成适合向量存储的片段
支持自定义分块器和 LangChain 分块器
"""
from typing import List, Dict, Any, Optional, Union
import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

class TextChunker:
    """
    文本分块器，负责将长文本分割成指定大小的片段
    """

    def __init__(self, chunk_size: int = 512, chunk_overlap: int = 50):
        if chunk_overlap >= chunk_size:
            raise ValueError(f"chunk_overlap ({chunk_overlap}) must be less than chunk_size ({chunk_size})")
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str, source_info: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        if not text or not text.strip():
            return []

        # 移除多余的空白字符
        text = ' '.join(text.split())

        chunks = []
        start = 0
        text_len = len(text)

        logger.debug(f"开始分块：text_len={text_len}, chunk_size={self.chunk_size}")

        while start < text_len:
            # 1. 计算理论结束位置
            end = start + self.chunk_size

            # 2. 确保不超过文本长度
            if end > text_len:
                end = text_len

            # 3. 如果不是最后一块，尝试在标点符号处断开
            # 注意：只有当 end < text_len 时才需要查找断点，最后一块直接取到末尾
            if end < text_len:
                search_start = max(start, end - 50)
                break_pos = -1

                # 查找合适的断点
                # 确保 pos 不会是负数，避免 Python 负数索引歧义
                for pos in range(end - 1, search_start - 1, -1):
                    if text[pos] in '.。！？!?\n':
                        break_pos = pos + 1
                        break

                if break_pos != -1 and break_pos > start:
                    end = break_pos

            # 4. 提取当前块
            chunk_text = text[start:end]

            # 5. 创建元信息
            chunk_info = {
                "text": chunk_text,
                "start_index": start,
                "end_index": end,
                "length": len(chunk_text)
            }

            if source_info:
                chunk_info.update(source_info)

            chunks.append(chunk_info)

            # 6. 【修复核心】计算下一块的起始位置
            # 如果是最后一块 (end == text_len)，直接退出循环，不再计算 overlap
            if end >= text_len:
                break

            # 计算新的 start，并确保不为负数
            start = end - self.chunk_overlap
            start = max(0, start)  # 防止负数索引

            # 7. 【安全兜底】防止极端情况下的死循环
            # 如果 start 没有前进，强制前进
            # 这里不需要 iteration_count，逻辑正确就不会死循环
            # 但为了安全，可以检查 chunk 是否为空
            if not chunk_text:
                # 如果提取出的文本为空，说明 start 和 end 重合，强制推进
                start = end

        return chunks

    def chunk_document(self, document_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        all_chunks = []

        for doc_chunk in document_chunks:
            text = doc_chunk.get("text", "")
            # 排除 text 字段，其他都作为源信息
            source_info = {k: v for k, v in doc_chunk.items() if k != "text"}

            chunks = self.chunk_text(text, source_info)
            all_chunks.extend(chunks)
        
        return all_chunks


class LangChainChunker:
    """
    基于 LangChain 的分块器
    支持多种文档格式和递归分块策略
    """
    
    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
        separators: Optional[List[str]] = None,
        keep_separator: bool = True,
        length_function: callable = len
    ):
        """
        初始化 LangChain 分块器
        
        Args:
            chunk_size: 每个块的最大大小
            chunk_overlap: 块之间的重叠大小
            separators: 分隔符列表，按优先级排序
            keep_separator: 是否保留分隔符
            length_function: 计算长度的函数
        """
        # 默认分隔符（针对中文优化）
        if separators is None:
            separators = [
                "\n\n",  # 段落
                "\n",    # 换行
                "。",    # 中文句号
                ".",     # 英文句号
                "！",    # 中文感叹号
                "!",     # 英文感叹号
                "？",    # 中文问号
                "?",     # 英文问号
                "；",    # 中文分号
                ";",     # 英文分号
                "，",    # 中文逗号
                ",",     # 英文逗号
                " ",     # 空格
                "",      # 字符级别
            ]
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=separators,
            keep_separator=keep_separator,
            length_function=length_function
        )
        
        logger.info(f"LangChainChunker 初始化：chunk_size={chunk_size}, chunk_overlap={chunk_overlap}")
    
    def chunk_text(self, text: str, source_info: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        使用 LangChain 分块器分割文本
        
        Args:
            text: 要分块的文本
            source_info: 源文件信息
            
        Returns:
            分块后的列表
        """
        if not text or not text.strip():
            return []
        
        try:
            # 使用 LangChain 分块
            docs = self.text_splitter.create_documents([text])
            
            # 转换为统一的字典格式
            chunks = []
            for i, doc in enumerate(docs):
                chunk_info = {
                    "text": doc.page_content,
                    "length": len(doc.page_content)
                }
                
                # 添加源信息
                if source_info:
                    chunk_info.update(source_info)
                
                # 添加 LangChain 的元数据
                if doc.metadata:
                    chunk_info["_langchain_metadata"] = doc.metadata
                
                chunks.append(chunk_info)
            
            logger.debug(f"LangChain 分块完成：{len(chunks)} 块")
            return chunks
            
        except Exception as e:
            logger.error(f"LangChain 分块失败：{e}")
            # 降级到基础分块器
            logger.info("降级到基础 TextChunker")
            fallback_chunker = TextChunker()
            return fallback_chunker.chunk_text(text, source_info)
    
    def chunk_documents(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        处理多个文档片段
        
        Args:
            documents: 文档列表
            
        Returns:
            分块后的完整列表
        """
        all_chunks = []
        
        for doc in documents:
            text = doc.get("text", "")
            source_info = {k: v for k, v in doc.items() if k != "text"}
            
            chunks = self.chunk_text(text, source_info)
            all_chunks.extend(chunks)
        
        return all_chunks
    
    @classmethod
    def from_tiktoken_encoder(
        cls,
        chunk_size: int = 512,
        chunk_overlap: int = 50,
        model_name: str = "gpt-3.5-turbo"
    ):
        """
        从 Tiktoken 编码器创建分块器（更精确的 Token 计数）
        
        Args:
            chunk_size: 每个块的最大 token 数
            chunk_overlap: 块之间的重叠 token 数
            model_name: 使用的模型名称
            
        Returns:
            LangChainChunker 实例
        """
        try:
            import tiktoken
            from langchain.text_splitter import TokenTextSplitter
            
            encoder = tiktoken.encoding_for_model(model_name)
            
            def count_tokens(text: str) -> int:
                return len(encoder.encode(text))
            
            return cls(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=count_tokens
            )
        except ImportError:
            logger.warning("tiktoken 未安装，使用默认长度函数")
            return cls(chunk_size=chunk_size, chunk_overlap=chunk_overlap)


def get_chunker(
    chunker_type: str = "custom",
    chunk_size: int = 512,
    chunk_overlap: int = 50,
    **kwargs
) -> Union[TextChunker, LangChainChunker]:
    """
    工厂函数：获取分块器实例
    
    Args:
        chunker_type: 分块器类型 ("custom" 或 "langchain")
        chunk_size: 块大小
        chunk_overlap: 块重叠大小
        **kwargs: 其他参数
        
    Returns:
        分块器实例
    """
    if chunker_type == "langchain":
        return LangChainChunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap, **kwargs)
    else:
        # 默认使用自定义分块器
        return TextChunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap)