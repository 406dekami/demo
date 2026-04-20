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
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
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
    SEEDS_DIR = BASE_DIR / "seeds"                    # 种子数据目录
    
    # 读取路径配置（支持相对路径和绝对路径）
    app_data_dir_env = os.getenv("APP_DATA_DIR")
    storage_dir_env = os.getenv("STORAGE_DIR")
    log_dir_env = os.getenv("LOG_DIR")
    
    # 如果是相对路径，则基于 BASE_DIR；如果是绝对路径，直接使用
    APP_DATA_DIR = Path(app_data_dir_env) if app_data_dir_env and Path(app_data_dir_env).is_absolute() else BASE_DIR / (app_data_dir_env or "app/data")
    STORAGE_DIR = Path(storage_dir_env) if storage_dir_env and Path(storage_dir_env).is_absolute() else BASE_DIR / (storage_dir_env or "storage")
    LOGS_DIR = Path(log_dir_env) if log_dir_env and Path(log_dir_env).is_absolute() else BASE_DIR / (log_dir_env or "logs")
    TEMP_DIR = APP_DATA_DIR / "temp"                  # 临时文件目录

    # 确保目录存在
    for directory in [SEEDS_DIR, APP_DATA_DIR, TEMP_DIR, STORAGE_DIR, LOGS_DIR]:
        directory.mkdir(parents=True, exist_ok=True)

    # 数据库路径
    db_path_env = os.getenv("DATABASE_PATH")
    if db_path_env:
        # 如果是绝对路径，直接使用；否则基于 STORAGE_DIR
        DB_PATH = Path(db_path_env) if Path(db_path_env).is_absolute() else STORAGE_DIR / db_path_env
    else:
        DB_PATH = STORAGE_DIR / "sqlite" / "demo.db"
    
    # 向量数据库路径
    chroma_path_env = os.getenv("CHROMA_PERSIST_DIRECTORY")
    CHROMA_PERSIST_DIRECTORY = Path(chroma_path_env) if chroma_path_env and Path(chroma_path_env).is_absolute() else STORAGE_DIR / (chroma_path_env or "chroma_db")
    
    # 租户数据目录辅助方法
    @staticmethod
    def get_tenant_dir(tenant_id: str) -> Path:
        """获取租户数据目录"""
        tenant_dir = Settings.APP_DATA_DIR / tenant_id
        tenant_dir.mkdir(parents=True, exist_ok=True)
        return tenant_dir
    
    @staticmethod
    def get_tenant_upload_dir(tenant_id: str) -> Path:
        """获取租户上传目录"""
        upload_dir = Settings.get_tenant_dir(tenant_id) / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)
        return upload_dir
    
    @staticmethod
    def get_tenant_avatar_dir(tenant_id: str) -> Path:
        """获取租户头像目录"""
        avatar_dir = Settings.get_tenant_dir(tenant_id) / "avatars"
        avatar_dir.mkdir(parents=True, exist_ok=True)
        return avatar_dir

    # 数据初始化配置
    AUTO_INIT_SEED_DATA = os.getenv("AUTO_INIT_SEED_DATA", "true").lower() in ("true", "1", "yes")
    FORCE_REINIT = os.getenv("FORCE_REINIT", "false").lower() in ("true", "1", "yes")


# 全局配置实例
settings = Settings()
