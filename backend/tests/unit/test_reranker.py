"""
测试 Reranker 模块
验证 DashScope qwen3-rerank API 的调用
"""
import os

from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

import pytest
from unittest.mock import Mock, patch
from app.rag.reranker import QwenReranker, get_reranker


class TestQwenReranker:
    """测试 QwenReranker 类"""

    def test_init_default(self):
        """测试默认初始化"""
        reranker = QwenReranker()
        assert reranker.model_name == "qwen3-rerank"

    def test_init_custom_model(self):
        """测试自定义模型名称"""
        reranker = QwenReranker(model_name="custom-rerank-model")
        assert reranker.model_name == "custom-rerank-model"

    @patch('app.rag.reranker.dashscope.TextReRank')
    def test_rerank_success(self, mock_text_rerank):
        """测试重排序成功"""
        # Mock API 响应
        mock_resp = Mock()
        mock_resp.status_code = 200
        mock_resp.output = {
            'results': [
                {'index': 2, 'relevance_score': 0.95},
                {'index': 0, 'relevance_score': 0.85},
                {'index': 1, 'relevance_score': 0.75}
            ]
        }
        mock_text_rerank.call.return_value = mock_resp

        reranker = QwenReranker()
        documents = [
            "量子计算是计算科学的一个前沿领域",
            "预训练语言模型的发展给文本排序模型带来了新的进展",
            "文本排序模型广泛用于搜索引擎和推荐系统中"
        ]
        
        result = reranker.rerank(
            query="什么是文本排序模型",
            documents=documents,
            top_n=10
        )

        assert len(result) == 3
        assert result[0]['index'] == 2
        assert result[0]['score'] == 0.95
        assert result[0]['text'] == documents[2]
        mock_text_rerank.call.assert_called_once()

    @patch('app.rag.reranker.dashscope.TextReRank')
    def test_rerank_with_instruct(self, mock_text_rerank):
        """测试带自定义指令的重排序"""
        mock_resp = Mock()
        mock_resp.status_code = 200
        mock_resp.output = {
            'results': [
                {'index': 0, 'relevance_score': 0.9}
            ]
        }
        mock_text_rerank.call.return_value = mock_resp

        reranker = QwenReranker()
        result = reranker.rerank(
            query="测试查询",
            documents=["测试文档"],
            instruct="自定义指令内容"
        )

        assert len(result) == 1
        # 验证调用了正确的参数
        call_kwargs = mock_text_rerank.call.call_args[1]
        assert call_kwargs['instruct'] == "自定义指令内容"

    @patch('app.rag.reranker.dashscope.TextReRank')
    def test_rerank_api_error(self, mock_text_rerank):
        """测试 API 错误处理"""
        mock_resp = Mock()
        mock_resp.status_code = 500
        mock_resp.code = "InvalidApiKey"
        mock_resp.message = "无效的 API Key"
        mock_text_rerank.call.return_value = mock_resp

        reranker = QwenReranker()
        with pytest.raises(RuntimeError, match="Rerank API 调用失败"):
            reranker.rerank(query="测试", documents=["文档"])

    def test_rerank_empty_documents(self):
        """测试空文档列表"""
        reranker = QwenReranker()
        result = reranker.rerank(query="测试", documents=[])
        assert result == []

    @patch('app.rag.reranker.dashscope.TextReRank')
    def test_rerank_chunks(self, mock_text_rerank):
        """测试 chunk 重排序（保留元数据）"""
        mock_resp = Mock()
        mock_resp.status_code = 200
        mock_resp.output = {
            'results': [
                {'index': 1, 'relevance_score': 0.9},
                {'index': 0, 'relevance_score': 0.8}
            ]
        }
        mock_text_rerank.call.return_value = mock_resp

        reranker = QwenReranker()
        chunks = [
            {
                "text": "文档1内容",
                "score": 0.7,
                "metadata": {"source": "file1.txt"}
            },
            {
                "text": "文档2内容",
                "score": 0.6,
                "metadata": {"source": "file2.txt"}
            }
        ]

        result = reranker.rerank_chunks(
            query="测试查询",
            chunks=chunks,
            top_n=2
        )

        assert len(result) == 2
        # 验证顺序已重排（索引1在前）
        assert result[0]['text'] == "文档2内容"
        assert result[0]['rerank_score'] == 0.9
        assert result[0]['score'] == 0.9  # score 被更新为 rerank_score
        # 验证元数据保留
        assert result[0]['metadata']['source'] == "file2.txt"

    @patch('app.rag.reranker.dashscope.TextReRank')
    def test_rerank_chunks_failure_fallback(self, mock_text_rerank):
        """测试 chunk 重排序失败时的降级策略"""
        mock_text_rerank.call.side_effect = Exception("API 调用失败")

        reranker = QwenReranker()
        chunks = [
            {"text": "文档1", "score": 0.7},
            {"text": "文档2", "score": 0.6}
        ]

        # 重排序失败时，应返回原始 chunks
        result = reranker.rerank_chunks(query="测试", chunks=chunks)
        assert len(result) == 2
        assert result[0]['text'] == "文档1"  # 保持原顺序


class TestGetReranker:
    """测试 get_reranker 工厂函数"""

    def test_get_reranker_default(self):
        """测试默认模型"""
        reranker = get_reranker()
        assert isinstance(reranker, QwenReranker)
        assert reranker.model_name == "qwen3-rerank"

    def test_get_reranker_custom(self):
        """测试自定义模型"""
        reranker = get_reranker(model_name="custom-model")
        assert isinstance(reranker, QwenReranker)
        assert reranker.model_name == "custom-model"


class TestIntegration:
    """集成测试（使用真实的 API Key）"""

    def test_real_rerank_call(self):
        """测试真实 API 调用"""
        api_key = os.getenv("DASHSCOPE_API_KEY")
        if not api_key or api_key.startswith('"'):
            pytest.skip("未正确配置 DASHSCOPE_API_KEY")

        reranker = get_reranker()
        query = "什么是文本排序模型"
        documents = [
            "文本排序模型广泛用于搜索引擎和推荐系统中，它们根据文本相关性对候选文本进行排序",
            "量子计算是计算科学的一个前沿领域",
            "预训练语言模型的发展给文本排序模型带来了新的进展"
        ]

        result = reranker.rerank(query=query, documents=documents, top_n=10)

        assert len(result) > 0
        # 验证结果按相关性分数降序排列
        for i in range(len(result) - 1):
            assert result[i]['score'] >= result[i + 1]['score']
        # 验证最相关的文档应该排在前面
        assert result[0]['text'].startswith("文本排序模型")
