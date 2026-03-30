#!/usr/bin/env python3
"""
知识图谱服务层
提供知识节点的增删改查和图谱可视化功能
"""
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from playhouse.shortcuts import model_to_dict
from loguru import logger

from app.db.database import get_database
from app.db.models.knowledge_graph import KnowledgeNode, KnowledgeRelation
from app.services.graph_cache import get_graph_cache
from app.services.graph_vector_service import get_graph_vector_service


class KnowledgeGraphService:
    """知识图谱服务类"""
    
    @staticmethod
    def create_node(node_data: Dict[str, Any]) -> str:
        """创建知识节点"""
        try:
            node = KnowledgeNode.create(
                id=node_data['id'],
                name=node_data['name'],
                level=node_data.get('level', 0),
                node_type=node_data['node_type'],
                description=node_data.get('description', ''),
                parent_id=node_data.get('parent_id'),
                module=node_data.get('module'),
                prerequisites=json.dumps(node_data.get('prerequisites', [])) if node_data.get('prerequisites') else None
            )
            logger.info(f"✅ 创建知识节点：{node.name} ({node.id})")
            return node.id
        except Exception as e:
            logger.error(f"❌ 创建节点失败：{e}")
            raise
    
    @staticmethod
    def update_node(node_id: str, updates: Dict[str, Any]) -> bool:
        """更新知识节点"""
        try:
            query = KnowledgeNode.update(**updates).where(KnowledgeNode.id == node_id)
            result = query.execute()
            if result > 0:
                logger.info(f"✏️  更新节点：{node_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"❌ 更新节点失败：{e}")
            raise
    
    @staticmethod
    def get_node(node_id: str) -> Optional[Dict[str, Any]]:
        """获取单个节点"""
        try:
            node = KnowledgeNode.get_or_none(KnowledgeNode.id == node_id)
            if node:
                data = model_to_dict(node)
                if data.get('prerequisites'):
                    data['prerequisites'] = json.loads(data['prerequisites'])
                return data
            return None
        except Exception as e:
            logger.error(f"❌ 获取节点失败：{e}")
            raise
    
    @staticmethod
    def get_all_nodes() -> List[Dict[str, Any]]:
        """获取所有节点"""
        try:
            nodes = KnowledgeNode.select().order_by(KnowledgeNode.level, KnowledgeNode.name)
            result = []
            for node in nodes:
                data = model_to_dict(node)
                if data.get('prerequisites'):
                    data['prerequisites'] = json.loads(data['prerequisites'])
                result.append(data)
            return result
        except Exception as e:
            logger.error(f"❌ 获取所有节点失败：{e}")
            raise
    
    @staticmethod
    def delete_node(node_id: str) -> bool:
        """删除节点（包括相关关系）"""
        try:
            # 先删除相关关系
            KnowledgeRelation.delete().where(
                (KnowledgeRelation.source_id == node_id) | 
                (KnowledgeRelation.target_id == node_id)
            ).execute()
            
            # 删除节点
            query = KnowledgeNode.delete().where(KnowledgeNode.id == node_id)
            result = query.execute()
            logger.info(f"🗑️  删除节点：{node_id}")
            return result > 0
        except Exception as e:
            logger.error(f"❌ 删除节点失败：{e}")
            raise
    
    @staticmethod
    def create_relation(source_id: str, target_id: str, relation_type: str, description: str = None) -> str:
        """创建知识关系"""
        try:
            import uuid
            relation_id = f"R{uuid.uuid4().hex[:8]}"
            
            KnowledgeRelation.create(
                id=relation_id,
                source_id=source_id,
                target_id=target_id,
                relation_type=relation_type,
                description=description
            )
            logger.info(f"✅ 创建关系：{source_id} -[{relation_type}]-> {target_id}")
            return relation_id
        except Exception as e:
            logger.error(f"❌ 创建关系失败：{e}")
            raise
    
    @staticmethod
    def get_relations(node_id: str = None) -> List[Dict[str, Any]]:
        """获取关系列表"""
        try:
            query = KnowledgeRelation.select()
            if node_id:
                query = query.where(
                    (KnowledgeRelation.source_id == node_id) | 
                    (KnowledgeRelation.target_id == node_id)
                )
            
            relations = query.order_by(KnowledgeRelation.relation_type)
            return [model_to_dict(rel) for rel in relations]
        except Exception as e:
            logger.error(f"❌ 获取关系失败：{e}")
            raise
    
    @staticmethod
    def delete_relation(relation_id: str) -> bool:
        """删除关系"""
        try:
            query = KnowledgeRelation.delete().where(KnowledgeRelation.id == relation_id)
            result = query.execute()
            logger.info(f"🗑️  删除关系：{relation_id}")
            return result > 0
        except Exception as e:
            logger.error(f"❌ 删除关系失败：{e}")
            raise
    
    @staticmethod
    def get_tree_structure(root_id: str = "N001") -> Dict[str, Any]:
        """
        获取树形结构（递归查询子节点）
        
        Args:
            root_id: 根节点 ID
        
        Returns:
            树形结构的字典
        """
        def build_tree(node_id: str) -> Optional[Dict]:
            node = KnowledgeNode.get_or_none(KnowledgeNode.id == node_id)
            if not node:
                return None
            
            node_data = model_to_dict(node)
            if node_data.get('prerequisites'):
                node_data['prerequisites'] = json.loads(node_data['prerequisites'])
            
            # 查询直接子节点（通过 CONTAINS 关系）
            children_relations = KnowledgeRelation.select().where(
                (KnowledgeRelation.source_id == node_id) & 
                (KnowledgeRelation.relation_type == 'CONTAINS')
            )
            
            children = []
            for rel in children_relations:
                child_tree = build_tree(rel.target_id)
                if child_tree:
                    children.append(child_tree)
            
            node_data['children'] = children
            return node_data
        
        return build_tree(root_id)
    
    @staticmethod
    def get_visualization_data(use_cache: bool = True) -> Dict[str, Any]:
        """
        获取 ECharts 可视化数据（带缓存支持）
        
        Args:
            use_cache: 是否使用缓存，默认 True
        
        Returns:
            {
                nodes: [{id, name, value, category, symbolSize}],
                links: [{source, target, value}],
                categories: [{name}]
            }
        """
        try:
            # 尝试从缓存获取
            cache = get_graph_cache()
            if use_cache and cache:
                cached_data = cache.get_graph_data("all_nodes")
                if cached_data:
                    logger.info("✅ 命中图谱缓存")
                    # 检查缓存是否包含完整的三个字段
                    if 'categories' not in cached_data:
                        logger.warning("⚠️ 缓存缺少 categories 字段，重新从数据库加载")
                        # 缓存不完整，跳过缓存直接从数据库加载
                    else:
                        # 缓存中使用 relationships，但前端需要 links，需要转换
                        if 'relationships' in cached_data and 'links' not in cached_data:
                            cached_data['links'] = cached_data.pop('relationships')
                        return cached_data
            
            # 从数据库查询
            nodes = KnowledgeNode.select().order_by(KnowledgeNode.level)
            
            # 节点类型到分类的映射
            type_to_category = {
                'Course': 0,
                'Concept': 1,
                'Principle': 2,
                'Circuit': 3,
                'Application': 4
            }
            
            # 节点大小映射（层级越高，节点越大）
            level_to_size = {
                0: 40,  # Course
                1: 30,  # Concept
                2: 25,  # Principle
                3: 20,  # Circuit
                4: 18   # Application
            }
            
            # 转换节点格式
            echarts_nodes = []
            for node in nodes:
                echarts_nodes.append({
                    'id': node.id,
                    'name': node.name,
                    'value': node.level,
                    'category': type_to_category.get(node.node_type, 99),
                    'symbolSize': level_to_size.get(node.level, 15),
                    'draggable': True,
                    # 添加额外信息用于 tooltip 显示
                    'node_type': node.node_type,
                    'level': node.level,
                    'description': node.description or ''
                })
            
            # 获取所有关系
            relations = KnowledgeRelation.select()
            
            # 转换关系格式
            echarts_links = []
            for rel in relations:
                echarts_links.append({
                    'source': rel.source_id,
                    'target': rel.target_id,
                    'value': rel.relation_type,
                    'lineStyle': {
                        'curveness': 0.3
                    }
                })
            
            # 定义分类
            categories = [
                {'name': '课程'},
                {'name': '概念'},
                {'name': '原理'},
                {'name': '电路'},
                {'name': '应用'}
            ]
            
            result = {
                'nodes': echarts_nodes,
                'links': echarts_links,
                'categories': categories
            }
            
            logger.info(f"图谱数据：nodes={len(echarts_nodes)}, links={len(echarts_links)}, categories={len(categories)}")
            
            # 缓存结果 - 必须缓存完整的三个字段
            if cache:
                cache.cache_graph_data_with_categories(
                    "all_nodes",
                    echarts_nodes,
                    echarts_links,
                    categories,
                    ttl=3600  # 1 小时缓存
                )
            
            return result
            
        except Exception as e:
            logger.error(f"❌ 获取可视化数据失败：{e}")
            raise
    
    @staticmethod
    def get_node_path(node_id: str, root_id: str = "N001") -> List[Dict[str, Any]]:
        """
        获取从根节点到指定节点的路径
        
        Args:
            node_id: 目标节点 ID
            root_id: 根节点 ID
        
        Returns:
            路径上的节点列表
        """
        def find_path(current_id: str, target_id: str, path: List) -> bool:
            path.append(current_id)
            
            if current_id == target_id:
                return True
            
            # 查询子节点
            children_relations = KnowledgeRelation.select().where(
                (KnowledgeRelation.source_id == current_id) & 
                (KnowledgeRelation.relation_type == 'CONTAINS')
            )
            
            for rel in children_relations:
                if find_path(rel.target_id, target_id, path):
                    return True
            
            path.pop()
            return False
        
        path_ids = []
        find_path(root_id, node_id, path_ids)
        
        # 获取路径上的节点详情
        nodes = KnowledgeNode.select().where(KnowledgeNode.id.in_(path_ids))
        return [model_to_dict(node) for node in nodes]
