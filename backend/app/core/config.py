#!/usr/bin/env python3
"""
应用配置管理
"""
import os
from pathlib import Path


class Settings:
    """应用配置"""
    
    # 基础配置
    DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    ENV = os.getenv("ENV", "development")
    
    # 服务配置
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", "8000"))
    
    # 数据库配置
    DATABASE_URL = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./demo.db"
    )
    
    # CORS 配置
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    
    # API 版本
    API_VERSION = os.getenv("API_VERSION", "v1")
    
    # 超时配置（秒）
    RESPONSE_TIMEOUT = int(os.getenv("RESPONSE_TIMEOUT", "600"))
    BODY_TIMEOUT = int(os.getenv("BODY_TIMEOUT", "600"))
    
    # 日志配置
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # 路径配置
    BASE_DIR = Path(__file__).parent.parent.parent
    CONF_DIR = BASE_DIR / "conf"
    DATA_DIR = BASE_DIR / "data"
    LOGS_DIR = BASE_DIR / "logs"
    
    # 确保目录存在
    for directory in [DATA_DIR, LOGS_DIR]:
        directory.mkdir(parents=True, exist_ok=True)


# 全局配置实例
settings = Settings()
