"""
LLM 模型管理接口测试
"""
import pytest
from fastapi.testclient import TestClient


def test_get_factories(client: TestClient):
    """测试获取厂商列表"""
    response = client.get("/old_api/llm/factories")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 0
    assert "data" in data


def test_get_model_types(client: TestClient):
    """测试获取模型类型"""
    response = client.get("/old_api/llm/model-types")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 0
    assert isinstance(data["data"], list)


def test_get_models_by_type(client: TestClient):
    """测试根据类型获取模型"""
    response = client.get("/old_api/llm/models/chat")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 0
    assert isinstance(data["data"], list)


def test_get_models_with_factory_filter(client: TestClient):
    """测试带厂商筛选的模型查询"""
    response = client.get("/old_api/llm/models/chat?factory_name=Tongyi-Qianwen")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == 0
    
    # 验证筛选结果
    for model in data["data"]:
        assert model["factory_name"] == "Tongyi-Qianwen"
