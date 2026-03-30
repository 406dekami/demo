#!/usr/bin/env python3
"""
Neo4j 图数据库连接与配置
"""
import os
from neo4j import GraphDatabase, basic_auth
from neo4j.exceptions import ServiceUnavailable, AuthError
from loguru import logger


class Neo4jClient:
    """Neo4j 客户端单例类"""
    
    _instance = None
    _driver = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._driver is None:
            self._initialize_driver()
    
    def _initialize_driver(self):
        """初始化 Neo4j 驱动"""
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "DigitalLogic2024")
        
        try:
            self._driver = GraphDatabase.driver(
                uri,
                auth=basic_auth(user, password),
                max_connection_pool_size=50,
                connection_acquisition_timeout=30,
                connection_timeout=10,
            )
            # 验证连接
            self.verify_connectivity()
            logger.info(f"✅ Neo4j 连接成功：{uri}")
        except ServiceUnavailable as e:
            logger.error(f"❌ Neo4j 服务不可用：{e}")
            raise
        except AuthError as e:
            logger.error(f"❌ Neo4j 认证失败：{e}")
            raise
    
    def verify_connectivity(self):
        """验证 Neo4j 连接"""
        if self._driver:
            self._driver.verify_connectivity()
    
    def get_session(self):
        """获取 Neo4j 会话"""
        if not self._driver:
            raise RuntimeError("Neo4j 驱动未初始化")
        return self._driver.session(database="neo4j")
    
    def close(self):
        """关闭 Neo4j 连接"""
        if self._driver:
            self._driver.close()
            self._driver = None
            logger.info("🔒 Neo4j 连接已关闭")
    
    @property
    def driver(self):
        """获取驱动实例"""
        return self._driver


# 全局客户端实例（延迟初始化）
neo4j_client = None


def get_neo4j_client():
    """获取 Neo4j 客户端实例（延迟加载）"""
    global neo4j_client
    if neo4j_client is None:
        try:
            neo4j_client = Neo4jClient()
            logger.info("✅ Neo4j 初始化完成")
        except Exception as e:
            logger.warning(f"⚠️  Neo4j 初始化失败，将降级使用本地数据库：{e}")
            neo4j_client = None
    return neo4j_client


def get_neo4j_session():
    """获取 Neo4j 会话的便捷函数"""
    client = get_neo4j_client()
    if not client:
        raise RuntimeError("Neo4j 未初始化或不可用")
    return client.get_session()


def close_neo4j():
    """关闭 Neo4j 连接（供应用关闭时使用）"""
    global neo4j_client
    if neo4j_client:
        neo4j_client.close()
        neo4j_client = None
