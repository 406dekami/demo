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
    # 启动时初始化
    from .db.database import init_tables
    from .db.init_data import init_data
    
    print("\n" + "="*60)
    print("🔄 初始化数据库表...")
    init_tables()
    
    print("🔄 初始化基础数据...")
    init_data()
    
    # Neo4j 改为延迟加载，不阻塞启动
    print("⚠️  Neo4j 将在首次使用时连接（加速启动）")
    
    print("\n" + "="*60)
    print("""
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     RAG Platform API 已启动                                 ║
║                                                            ║
║     API 文档：http://127.0.0.1:8000/docs                    ║
║     健康检查：http://127.0.0.1:8000/health                   ║
║                                                            ║
║     Neo4j Browser: http://localhost:7474                    ║
║     Redis: localhost:6379                                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    """)
    print("="*60 + "\n")
    
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
