#!/usr/bin/env python3
"""
数据库配置和初始化
"""
import os
import logging
from peewee import SqliteDatabase

# ==================== 数据库配置 ====================
# 开发用 SQLite，生产改 MySQL
DB_PATH = os.path.join(
    os.path.dirname(__file__),  # app/db/
    '..', '..', 'storage', 'sqlite', 'demo.db'  # ../../storage/sqlite/demo.db
)
DB = SqliteDatabase(DB_PATH)

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

        for table in tables:
            try:
                if not table.table_exists():
                    table.create_table(safe=True)
                    logging.info(f"✅ 创建表：{table._meta.table_name}")
                else:
                    logging.info(f"⏭️  表已存在：{table._meta.table_name}")
            except Exception as e:
                logging.error(f"❌ 创建表 {table._meta.table_name} 失败：{e}")
                raise

        logging.info("🎉 数据库初始化完成")
    except Exception as e:
        logging.error(f"❌ 数据库初始化失败：{e}")
        raise
    finally:
        DB.close()
