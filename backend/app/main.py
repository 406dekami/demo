#!/usr/bin/env python3
"""
FastAPI 应用工厂 - 负责创建和配置 app 实例
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .routers import api_router
import logging
from dotenv import load_dotenv
import os

# 加载环境变量（从 .env 文件）
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# 配置日志格式
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# 使用 loguru 统一日志
from loguru import logger
import sys

# 配置 loguru
logger.remove()  # 移除默认的 handler
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
    
    # 先显示启动横幅，再开始计时（这样计的是实际初始化的耗时）
    print("\n" + "="*60)
    print(" RAG Platform API 启动中...")
    print("="*60)
    
    # 开始计时（从显示完启动信息后开始）
    start_time = time.perf_counter()
    
    # 只初始化数据库表结构
    print("\n📊 [1/1] 初始化数据库表...")
    step_start = time.perf_counter()
    init_tables()
    step_elapsed = time.perf_counter() - step_start
    print(f"✅ 数据库表初始化完成 (耗时：{step_elapsed:.3f}s)")
    
    # 完全移除 LLM 初始化，改为首次访问时懒加载
    print("⚡ LLM 数据将在首次访问模型管理时加载")
    print("⚠️  Neo4j 将在首次使用时连接")
    
    total_elapsed = time.perf_counter() - start_time
    
    print("\n🚀 RAG Platform API 已启动")
    print(f"📚 API 文档：http://127.0.0.1:8000/docs  |  健康检查：http://127.0.0.1:8000/health")
    print(f"🗃️  Neo4j Browser：http://localhost:7474  |  Redis：localhost:6379")
    print("="*60)
    
    yield
    
    # 关闭时清理资源
    from .db.neo4j_client import close_neo4j
    print("\n🔄 关闭 Neo4j 连接...")
    close_neo4j()


def create_app() -> FastAPI:
    """创建并配置 FastAPI 应用"""
    app = FastAPI(
        title="RAG Platform API",
        version="1.0.0",
        description="数字逻辑学习助手 - RAG 平台接口",
        docs_url="/docs",
        lifespan=lifespan
    )

    # CORS 配置
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 生产环境应该限制具体域名
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 注册主路由
    app.include_router(api_router)

    return app


# 创建全局 app 实例
app = create_app()
