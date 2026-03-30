"""
测试 Embedding 服务模块
验证 DashScope TextEmbedding API 的调用
"""
import os
from dotenv import load_dotenv

# 在导入任何依赖 dashscope.api_key 的模块之前，先加载 .env 文件
load_dotenv()

import pytest
from unittest.mock import Mock, patch
from app.rag.embedding import QwenEmbedding, get_embedding_model


class TestQwenEmbedding:
    """测试 QwenEmbedding 类"""

    def test_init_default(self):
        """测试默认初始化"""
        embedding = QwenEmbedding()
        assert embedding.model_name == "text-embedding-v4"

    def test_init_custom_model(self):
        """测试自定义模型名称"""
        embedding = QwenEmbedding(model_name="text-embedding-v3")
        assert embedding.model_name == "text-embedding-v3"

    def test_validate_texts_empty_list(self):
        """测试空列表验证"""
        embedding = QwenEmbedding()
        with pytest.raises(ValueError, match="输入文本列表不能为空"):
            embedding._validate_texts([])

    def test_validate_texts_non_string(self):
        """测试非字符串类型验证"""
        embedding = QwenEmbedding()
        with pytest.raises(TypeError, match="第 1 条输入不是字符串类型"):
            embedding._validate_texts(["valid", 123, "another"])

    def test_validate_texts_too_long(self, caplog):
        """测试过长文本警告"""
        embedding = QwenEmbedding()
        long_text = "a" * 5000  # 超过 2048*2
        embedding._validate_texts([long_text])
        assert "文本过长，可能被截断" in caplog.text

    @patch('app.rag.embedding.dashscope.TextEmbedding')
    def test_embed_documents_single_batch(self, mock_text_embedding):
        """测试单批次向量化"""
        # Mock 响应
        mock_resp = Mock()
        mock_resp.status_code = 200
        mock_resp.output = {
            'embeddings': [
                {'text_index': 0, 'embedding': [0.1, 0.2, 0.3]},
                {'text_index': 1, 'embedding': [0.4, 0.5, 0.6]}
            ]
        }
        mock_text_embedding.call.return_value = mock_resp

        embedding = QwenEmbedding()
        texts = ["文本 1", "文本 2"]
        result = embedding.embed_documents(texts)

        # 验证结果
        assert len(result) == 2
        assert result[0] == [0.1, 0.2, 0.3]
        assert result[1] == [0.4, 0.5, 0.6]

        # 验证 API 调用
        mock_text_embedding.call.assert_called_once_with(
            model="text-embedding-v4",
            input=texts,
            dimension=1024
        )

    @patch('app.rag.embedding.dashscope.TextEmbedding')
    def test_embed_documents_multiple_batches(self, mock_text_embedding):
        """测试多批次向量化"""
        # Mock 两次响应
        mock_resp1 = Mock()
        mock_resp1.status_code = 200
        mock_resp1.output = {
            'embeddings': [
                {'text_index': 0, 'embedding': [0.1, 0.2]},
                {'text_index': 1, 'embedding': [0.3, 0.4]}
            ]
        }
        mock_resp1.usage = {'total_tokens': 10}

        mock_resp2 = Mock()
        mock_resp2.status_code = 200
        mock_resp2.output = {
            'embeddings': [
                {'text_index': 0, 'embedding': [0.5, 0.6]},
                {'text_index': 1, 'embedding': [0.7, 0.8]}
            ]
        }
        mock_resp2.usage = {'total_tokens': 8}

        mock_text_embedding.call.side_effect = [mock_resp1, mock_resp2]

        embedding = QwenEmbedding()
        embedding.MAX_BATCH_SIZE = 2  # 设置小批量大小以便测试
        texts = ["文本 1", "文本 2", "文本 3", "文本 4"]
        result = embedding.embed_documents(texts)

        # 验证结果顺序正确
        assert len(result) == 4
        assert result[0] == [0.1, 0.2]
        assert result[1] == [0.3, 0.4]
        assert result[2] == [0.5, 0.6]
        assert result[3] == [0.7, 0.8]

        # 验证调用了两次 API
        assert mock_text_embedding.call.call_count == 2

    @patch('app.rag.embedding.dashscope.TextEmbedding')
    def test_embed_documents_api_error(self, mock_text_embedding):
        """测试 API 错误处理"""
        mock_resp = Mock()
        mock_resp.status_code = 500
        mock_resp.code = "InvalidApiKey"
        mock_resp.message = "无效的 API Key"

        mock_text_embedding.call.return_value = mock_resp

        embedding = QwenEmbedding()
        with pytest.raises(RuntimeError, match="向量化失败"):
            embedding.embed_documents(["测试文本"])

    @patch('app.rag.embedding.dashscope.TextEmbedding')
    def test_embed_query(self, mock_text_embedding):
        """测试查询向量化"""
        mock_resp = Mock()
        mock_resp.status_code = 200
        mock_resp.output = {
            'embeddings': [
                {'text_index': 0, 'embedding': [0.1, 0.2, 0.3]}
            ]
        }
        mock_text_embedding.call.return_value = mock_resp

        embedding = QwenEmbedding()
        result = embedding.embed_query("查询文本")

        assert result == [0.1, 0.2, 0.3]
        mock_text_embedding.call.assert_called_once()

    @patch('app.rag.embedding.dashscope.TextEmbedding')
    def test_embed_documents_empty_result(self, mock_text_embedding):
        """测试空结果处理"""
        mock_resp = Mock()
        mock_resp.status_code = 200
        mock_resp.output = {}

        mock_text_embedding.call.return_value = mock_resp

        embedding = QwenEmbedding()
        result = embedding.embed_documents(["测试文本"])

        assert result == []


class TestGetEmbeddingModel:
    """测试 get_embedding_model 工厂函数"""

    def test_get_embedding_model_default(self):
        """测试默认模型"""
        model = get_embedding_model()
        assert isinstance(model, QwenEmbedding)
        assert model.model_name == "text-embedding-v4"

    def test_get_embedding_model_custom(self):
        """测试自定义模型"""
        model = get_embedding_model(model_name="text-embedding-v3")
        assert isinstance(model, QwenEmbedding)
        assert model.model_name == "text-embedding-v3"


class TestIntegration:
    """集成测试（使用真实的 API Key）"""

    def test_real_embedding_call(self):
        """测试真实 API 调用"""
        import os
        from dotenv import load_dotenv
        
        # 加载 .env 文件
        load_dotenv()
        
        api_key = os.getenv("DASHSCOPE_API_KEY")
        if not api_key or api_key.startswith('"'):
            pytest.skip("未正确配置 DASHSCOPE_API_KEY")

        embedding = get_embedding_model()
        texts = ["风急天高猿啸哀", "渚清沙白鸟飞回"]
        result = embedding.embed_documents(texts)

        assert len(result) == 2
        assert all(isinstance(vec, list) for vec in result)
        assert all(len(vec) > 0 for vec in result)
        print(f"\n成功获取向量，维度：{len(result[0])}")

    def test_real_batch_embedding(self):
        """测试大批量向量化（超过 10 条，自动分批）"""
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        
        if not os.getenv("DASHSCOPE_API_KEY"):
            pytest.skip("未配置 DASHSCOPE_API_KEY")

        embedding = get_embedding_model()
        
        # 生成 25 条文本，测试分批处理
        texts = [f"这是第 {i} 条测试文本" for i in range(25)]
        result = embedding.embed_documents(texts)

        assert len(result) == 25
        assert all(len(vec) > 0 for vec in result)
        print(f"\n成功处理 25 条文本，向量维度：{len(result[0])}")
