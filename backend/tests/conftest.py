# tests/conftest.py
import pytest


@pytest.fixture(scope="module")
def client():
    """创建测试客户端 - 延迟导入"""
    # ✅ 只在 fixture 被使用时才导入
    from fastapi.testclient import TestClient
    from app.main import create_app
    
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def app():
    """创建应用实例 - 延迟导入"""
    from app.main import create_app
    return create_app()