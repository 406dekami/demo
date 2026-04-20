#!/usr/bin/env python3
"""
FastAPI 应用工厂 - 负责创建和配置 app 实例
"""
import logging
import os
import sys
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from .core.config import settings
from .routers import api_router

# 加载环境变量（从 .env 文件）
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# 配置日志格式
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# 配置 loguru
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO",
)
logger.add(
    "logs/backend_{time:YYYY-MM-DD}.log",
    rotation="00:00",
    retention="30 days",
    level="DEBUG",
    encoding="utf-8",
)


@asynccontextmanager
async def lifespan(application: FastAPI):
    """应用生命周期管理"""
    from .db.database import init_tables
    import time

    print("\n" + "=" * 60)
    print(" RAG Platform API 启动中...")
    print("=" * 60)

    start_time = time.perf_counter()

    print("\n📊 [1/2] 初始化数据库表...")
    step_start = time.perf_counter()
    init_tables()
    step_elapsed = time.perf_counter() - step_start
    print(f"✅ 数据库表初始化完成 (耗时：{step_elapsed:.3f}s)")

    print("\n📊 [2/2] 检查并初始化种子数据...")
    step_start = time.perf_counter()
    from .db.init_data import auto_init_on_startup
    auto_init_on_startup()
    step_elapsed = time.perf_counter() - step_start
    print(f"✅ 种子数据检查完成 (耗时：{step_elapsed:.3f}s)")

    print("⚡ LLM 数据将在首次访问模型管理时加载")
    print("⚠️  Neo4j 将在首次使用时连接")

    _ = time.perf_counter() - start_time

    print("\n🚀 RAG Platform API 已启动")
    print(f"📚 API 文档：http://127.0.0.1:8000/docs  |  健康检查：http://127.0.0.1:8000/health")
    print(f"🗃️  Neo4j Browser：http://localhost:7474  |  Redis：localhost:6379")
    print("=" * 60)

    yield

    from .db.neo4j_client import close_neo4j
    print("\n🔄 关闭 Neo4j 连接...")
    close_neo4j()


def create_app() -> FastAPI:
    """创建并配置 FastAPI 应用"""
    app = FastAPI(
        title="RAG 数字逻辑学习助手 API",
        version="1.0.0",
        description="""
# RAG 数字逻辑学习助手 - API 文档

## 📚 功能模块

- **用户认证**: 登录、注册、个人信息管理
- **知识库管理**: 创建、上传、处理文档
- **RAG 问答**: 基于知识库的智能问答
- **思维导图**: 学习路径可视化与进度追踪
- **模型管理**: LLM 厂商与模型配置

## 🔑 认证方式

所有需要认证的接口都需要在 Header 中携带 Token：
```
Authorization: Bearer <your_token>
```

## 📊 响应格式

所有接口统一返回以下格式：
```json
{
  "code": 0,
  "message": "success",
  "data": {...}
}
```

**错误码说明：**
- `0`: 成功
- `401`: 未授权/Token 无效
- `403`: 账号被禁用
- `404`: 资源不存在
- `409`: 冲突（如名称重复）
- `500`: 服务器内部错误

## 🚀 快速开始

1. 注册用户: `POST /api/v1/auth/register`
2. 登录获取 Token: `POST /api/v1/auth/login`
3. 创建知识库: `POST /api/v1/knowledge/create`
4. 上传文档: `POST /api/v1/knowledge/{kb_id}/upload`
5. 开始问答: `POST /api/v1/rag/query`
        """,
        docs_url="/docs",           # Swagger UI
        redoc_url="/redoc",         # ReDoc
        openapi_url="/openapi.json", # OpenAPI JSON
        lifespan=lifespan,
        contact={
            "name": "技术支持",
            "email": "support@example.com",
        },
        license_info={
            "name": "MIT License",
            "url": "https://opensource.org/licenses/MIT",
        },
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    return app


app = create_app()
