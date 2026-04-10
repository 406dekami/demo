"""
测试 Retriever 与 Reranker 的集成
"""
from dotenv import load_dotenv

load_dotenv()

import pytest
from unittest.mock import Mock, patch
from app.rag.retriever import Retriever


class TestRetrieverWithRerank:
    """测试 Retriever 的 retrieve_with_rerank 方法"""

    @patch('app.rag.retriever.Retriever.retrieve')
    @patch('app.rag.reranker.dashscope.TextReRank')
    def test_retrieve_with_rerank_enabled(self, mock_text_rerank, mock_retrieve):
        """测试启用重排序的情况"""
        # Mock 初始检索结果（返回 10 条）
        mock_retrieve.return_value = [
            {"text": f"文档 {i}", "score": 0.5 + i * 0.05, "metadata": {}}
            for i in range(10)
        ]
        
        # Mock rerank 结果（返回前 5 条，重新排序）
        mock_resp = Mock()
        mock_resp.status_code = 200
        mock_resp.output = {
            'results': [
                {'index': 9, 'relevance_score': 0.95},
                {'index': 8, 'relevance_score': 0.90},
                {'index': 7, 'relevance_score': 0.85},
                {'index': 6, 'relevance_score': 0.80},
                {'index': 5, 'relevance_score': 0.75}
            ]
        }
        mock_text_rerank.call.return_value = mock_resp
        
        # 创建 Retriever 实例
        mock_vector_store = Mock()
        mock_embedding = Mock()
        retriever = Retriever(mock_vector_store, mock_embedding, top_k=5)
        
        # 调用 retrieve_with_rerank
        result = retriever.retrieve_with_rerank(
            query="测试查询",
            top_k=10,
            rerank_top_k=5,
            use_rerank=True
        )
        
        # 验证结果
        assert len(result) == 5
        # 验证最相关的是索引 9 的文档
        assert result[0]['text'] == "文档 9"
        assert result[0]['rerank_score'] == 0.95
        # 验证调用了 rerank API
        mock_text_rerank.call.assert_called_once()

    @patch('app.rag.retriever.Retriever.retrieve')
    def test_retrieve_with_rerank_disabled(self, mock_retrieve):
        """测试禁用重排序的情况"""
        mock_retrieve.return_value = [
            {"text": f"文档 {i}", "score": 0.5 + i * 0.05, "metadata": {}}
            for i in range(10)
        ]
        
        mock_vector_store = Mock()
        mock_embedding = Mock()
        retriever = Retriever(mock_vector_store, mock_embedding, top_k=5)
        
        result = retriever.retrieve_with_rerank(
            query="测试查询",
            top_k=10,
            rerank_top_k=5,
            use_rerank=False
        )
        
        # 应该直接返回前 5 条，不经过重排序
        assert len(result) == 5
        assert result[0]['text'] == "文档 0"  # 保持原顺序
        assert 'rerank_score' not in result[0]

    @patch('app.rag.retriever.Retriever.retrieve')
    def test_retrieve_with_rerank_insufficient_results(self, mock_retrieve):
        """测试结果数量不足时的情况"""
        # 只返回 3 条结果（少于 rerank_top_k=5）
        mock_retrieve.return_value = [
            {"text": f"文档 {i}", "score": 0.7, "metadata": {}}
            for i in range(3)
        ]
        
        mock_vector_store = Mock()
        mock_embedding = Mock()
        retriever = Retriever(mock_vector_store, mock_embedding, top_k=5)
        
        result = retriever.retrieve_with_rerank(
            query="测试查询",
            top_k=10,
            rerank_top_k=5,
            use_rerank=True
        )
        
        # 因为结果数量不足，不会触发重排序
        assert len(result) == 3
        assert result[0]['text'] == "文档 0"

    @patch('app.rag.retriever.Retriever.retrieve')
    @patch('app.rag.reranker.dashscope.TextReRank')
    def test_retrieve_with_rerank_failure_fallback(self, mock_text_rerank, mock_retrieve):
        """测试重排序失败时的降级策略"""
        mock_retrieve.return_value = [
            {"text": f"文档 {i}", "score": 0.5 + i * 0.05, "metadata": {}}
            for i in range(10)
        ]
        
        # Mock rerank 失败
        mock_text_rerank.call.side_effect = Exception("API 错误")
        
        mock_vector_store = Mock()
        mock_embedding = Mock()
        retriever = Retriever(mock_vector_store, mock_embedding, top_k=5)
        
        result = retriever.retrieve_with_rerank(
            query="测试查询",
            top_k=10,
            rerank_top_k=5,
            use_rerank=True
        )
        
        # 应该降级为直接截取前 5 条
        assert len(result) == 5
        assert result[0]['text'] == "文档 0"  # 保持原顺序
        assert 'rerank_score' not in result[0]

    @patch('app.rag.retriever.Retriever.retrieve')
    def test_retrieve_with_rerank_empty_results(self, mock_retrieve):
        """测试检索结果为空的情况"""
        mock_retrieve.return_value = []
        
        mock_vector_store = Mock()
        mock_embedding = Mock()
        retriever = Retriever(mock_vector_store, mock_embedding, top_k=5)
        
        result = retriever.retrieve_with_rerank(
            query="测试查询",
            top_k=10,
            rerank_top_k=5,
            use_rerank=True
        )
        
        assert result == []


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
