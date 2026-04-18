#!/usr/bin/env python3
"""
数据库配置和初始化
"""
import os
import logging
from pathlib import Path
from peewee import SqliteDatabase
from playhouse.pool import PooledSqliteDatabase

# 导入配置
from ..core.config import settings

# ==================== 数据库配置 ====================
# 开发用 SQLite，生产改 MySQL
DB_PATH = str(settings.DB_PATH)

# 确保数据库目录存在
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

# 使用连接池优化性能
# max_connections: 最大连接数
# stale_timeout: 连接超时时间（秒）
# timeout: 获取连接的超时时间（秒）
DB = PooledSqliteDatabase(
    DB_PATH,
    max_connections=10,
    stale_timeout=300,
    timeout=30,
    check_same_thread=False,
)

# MySQL 配置示例（生产环境使用）
# from playhouse.pool import PooledMySQLDatabase
# DB = PooledMySQLDatabase(
#     "rag_demo",
#     host="localhost",
#     user="root",
#     password="your_password",
#     port=3306,
#     max_connections=10
# )


def get_database():
    """获取数据库实例"""
    return DB


def init_tables():
    """一键创建所有表（生产环境建议用迁移工具）"""
    from .models import get_all_models
    
    logging.basicConfig(level=logging.INFO)
    try:
        DB.connect(reuse_if_open=True)
        logging.info("✅ 数据库连接成功")

        tables = get_all_models()
        created_count = 0

        for table in tables:
            try:
                if not table.table_exists():
                    table.create_table(safe=True)
                    logging.info(f"✅ 创建表：{table._meta.table_name}")
                    created_count += 1
                # 表存在时不打印日志，保持静默
            except Exception as e:
                logging.error(f"❌ 创建表 {table._meta.table_name} 失败：{e}")
                raise

        if created_count > 0:
            logging.info(f"🎉 数据库初始化完成，新建 {created_count} 张表")
        else:
            logging.info("🎉 数据库初始化完成，所有表已存在")
    except Exception as e:
        logging.error(f"❌ 数据库初始化失败：{e}")
        raise
    finally:
        DB.close()
