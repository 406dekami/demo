#!/usr/bin/env python3
"""
知识图谱缓存服务
基于 Redis 缓存知识图谱数据，减少 Neo4j 查询压力
"""
import json
import redis
from typing import Dict, Any, Optional, List
from datetime import timedelta
from loguru import logger


class GraphCache:
    """知识图谱缓存服务"""
    
    def __init__(self):
        """初始化 Redis 连接"""
        # 从环境变量读取 Redis 配置
        import os
        from dotenv import load_dotenv
        load_dotenv()
        
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", "6379"))
        redis_password = os.getenv("REDIS_PASSWORD")
        redis_db = int(os.getenv("REDIS_DB", "0"))
        
        try:
            self.redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                password=redis_password,
                db=redis_db,
                decode_responses=True,
                socket_connect_timeout=5,
            )
            # 测试连接
            self.redis_client.ping()
            logger.info(f"✅ Redis 连接成功：{redis_host}:{redis_port}")
        except Exception as e:
            logger.warning(f"⚠️  Redis 连接失败，缓存功能将不可用：{e}")
            self.redis_client = None
    
    def _is_available(self) -> bool:
        """检查 Redis 是否可用"""
        return self.redis_client is not None
    
    def cache_graph_data(self, node_id: str, nodes: List[Dict], relationships: List[Dict], ttl: int = 3600) -> bool:
        """
        缓存图谱数据（对应图示 4.2）
        
        Args:
            node_id: 节点 ID，如 N010
            nodes: 节点列表
            relationships: 关系列表
            ttl: 过期时间（秒），默认 1 小时
            
        Returns:
            是否缓存成功
        """
        if not self._is_available():
            return False
        
        try:
            key = f"graph:node:{node_id}"
            value = {
                "nodes": nodes,
                "relationships": relationships
            }
            
            # 序列化并缓存
            self.redis_client.setex(
                key,
                timedelta(seconds=ttl),
                json.dumps(value, ensure_ascii=False)
            )
            
            logger.info(f"✅ 缓存图谱数据：{key} (TTL: {ttl}s)")
            return True
        except Exception as e:
            logger.error(f"❌ 缓存图谱数据失败：{e}")
            return False
    
    def cache_graph_data_with_categories(self, node_id: str, nodes: List[Dict], links: List[Dict], categories: List[Dict], ttl: int = 3600) -> bool:
        """
        缓存图谱数据（包含 categories，用于 ECharts 可视化）
        
        Args:
            node_id: 节点 ID
            nodes: 节点列表
            links: 关系列表
            categories: 分类列表
            ttl: 过期时间（秒），默认 1 小时
            
        Returns:
            是否缓存成功
        """
        if not self._is_available():
            return False
        
        try:
            key = f"graph:node:{node_id}"
            value = {
                "nodes": nodes,
                "links": links,
                "categories": categories
            }
            
            # 序列化并缓存
            self.redis_client.setex(
                key,
                timedelta(seconds=ttl),
                json.dumps(value, ensure_ascii=False)
            )
            
            logger.info(f"✅ 缓存图谱数据（含 categories）: {key} (TTL: {ttl}s)")
            return True
        except Exception as e:
            logger.error(f"❌ 缓存图谱数据失败：{e}")
            return False
    
    def get_graph_data(self, node_id: str) -> Optional[Dict[str, Any]]:
        """
        获取缓存的图谱数据
        
        Args:
            node_id: 节点 ID
            
        Returns:
            图谱数据，如果不存在或已过期则返回 None
        """
        if not self._is_available():
            return None
        
        try:
            key = f"graph:node:{node_id}"
            value = self.redis_client.get(key)
            
            if value:
                logger.debug(f"✅ 命中图谱缓存：{key}")
                return json.loads(value)
            
            logger.debug(f"⚠️ 缓存未命中：{key}")
            return None
        except Exception as e:
            logger.error(f"❌ 获取图谱缓存失败：{e}")
            return None
    
    def cache_user_progress(self, user_id: str, current_node_id: str, ttl: int = 86400) -> bool:
        """
        缓存用户学习进度（对应图示 4.2）
        
        Args:
            user_id: 用户 ID
            current_node_id: 当前学习的节点 ID
            ttl: 过期时间（秒），默认 24 小时
            
        Returns:
            是否缓存成功
        """
        if not self._is_available():
            return False
        
        try:
            key = f"user:progress:{user_id}"
            value = {
                "currentNodeId": current_node_id,
                "updatedAt": str(__import__('datetime').datetime.now())
            }
            
            self.redis_client.setex(
                key,
                timedelta(seconds=ttl),
                json.dumps(value, ensure_ascii=False)
            )
            
            logger.info(f"✅ 缓存用户进度：{key}")
            return True
        except Exception as e:
            logger.error(f"❌ 缓存用户进度失败：{e}")
            return False
    
    def get_user_progress(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        获取用户学习进度
        
        Args:
            user_id: 用户 ID
            
        Returns:
            用户进度数据
        """
        if not self._is_available():
            return None
        
        try:
            key = f"user:progress:{user_id}"
            value = self.redis_client.get(key)
            
            if value:
                return json.loads(value)
            
            return None
        except Exception as e:
            logger.error(f"❌ 获取用户进度失败：{e}")
            return None
    
    def invalidate_cache(self, node_id: str) -> bool:
        """
        使节点缓存失效
        
        Args:
            node_id: 节点 ID
            
        Returns:
            是否删除成功
        """
        if not self._is_available():
            return False
        
        try:
            key = f"graph:node:{node_id}"
            self.redis_client.delete(key)
            logger.info(f"🗑️  删除缓存：{key}")
            return True
        except Exception as e:
            logger.error(f"❌ 删除缓存失败：{e}")
            return False
    
    def clear_all_cache(self) -> bool:
        """
        清空所有图谱缓存
        
        Returns:
            是否清空成功
        """
        if not self._is_available():
            return False
        
        try:
            keys = self.redis_client.keys("graph:node:*")
            if keys:
                self.redis_client.delete(*keys)
                logger.info(f"✅ 清空所有图谱缓存，共 {len(keys)} 条")
            return True
        except Exception as e:
            logger.error(f"❌ 清空缓存失败：{e}")
            return False


# 全局缓存实例
graph_cache = GraphCache()


def get_graph_cache() -> GraphCache:
    """获取缓存服务实例"""
    return graph_cache
