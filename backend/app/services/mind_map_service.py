#!/usr/bin/env python3
"""
思维导图服务层
提供思维导图节点的查询、创建、更新等操作
"""
import logging
from typing import List, Dict, Optional

from ..db.database import DB
from ..db.models import MindMapNode

logger = logging.getLogger(__name__)


class MindMapService:
    """思维导图服务类"""
    
    @staticmethod
    def get_tree(root_id: str = "root", include_details: bool = True) -> Optional[Dict]:
        """
        获取完整的思维导图树形结构
        
        Args:
            root_id: 根节点 ID，默认为 "root"
            include_details: 是否包含详细信息
            
        Returns:
            树形结构的字典
        """
        try:
            root = MindMapNode.get_or_none(MindMapNode.id == root_id)
            if not root:
                return None
            
            # 递归获取子节点
            def get_children(parent_id: str) -> List[Dict]:
                children = MindMapNode.select().where(
                    MindMapNode.parent_id == parent_id
                ).order_by(MindMapNode.order_index)
                
                result = []
                for child in children:
                    child_dict = child.to_dict(include_children=False)
                    # 递归获取子节点
                    child_children = get_children(child.id)
                    if child_children:
                        child_dict['children'] = child_children
                    result.append(child_dict)
                
                return result
            
            tree = root.to_dict(include_children=False)
            tree['children'] = get_children(root.id)
            
            return tree
            
        except Exception as e:
            logger.error(f"获取思维导图树失败：{e}")
            return None
    
    @staticmethod
    def get_node(node_id: str) -> Optional[MindMapNode]:
        """获取单个节点"""
        try:
            return MindMapNode.get_or_none(MindMapNode.id == node_id)
        except Exception as e:
            logger.error(f"获取节点失败：{e}")
            return None
    
    @staticmethod
    def get_children(node_id: str) -> List[Dict]:
        """获取节点的所有子节点"""
        try:
            children = MindMapNode.select().where(
                MindMapNode.parent_id == node_id
            ).order_by(MindMapNode.order_index)
            
            return [child.to_dict() for child in children]
        except Exception as e:
            logger.error(f"获取子节点失败：{e}")
            return []
    
    @staticmethod
    def get_node_path(node_id: str) -> List[Dict]:
        """获取从根节点到当前节点的路径"""
        try:
            path = []
            current_id = node_id
            
            while current_id:
                node = MindMapNode.get_or_none(MindMapNode.id == current_id)
                if not node:
                    break
                
                path.insert(0, node.to_dict())
                current_id = node.parent_id
            
            return path
        except Exception as e:
            logger.error(f"获取节点路径失败：{e}")
            return []
    
    @staticmethod
    def get_siblings(node_id: str) -> List[Dict]:
        """获取兄弟节点（同一父节点下的其他子节点）"""
        try:
            node = MindMapNode.get_or_none(MindMapNode.id == node_id)
            if not node or not node.parent_id:
                return []
            
            siblings = MindMapNode.select().where(
                (MindMapNode.parent_id == node.parent_id) &
                (MindMapNode.id != node_id)
            ).order_by(MindMapNode.order_index)
            
            return [sib.to_dict() for sib in siblings]
        except Exception as e:
            logger.error(f"获取兄弟节点失败：{e}")
            return []
    
    @staticmethod
    def get_children_details(node_id: str) -> List[Dict]:
        """获取子节点的详细信息（用于上下文构建）"""
        try:
            children = MindMapNode.select().where(
                MindMapNode.parent_id == node_id
            ).order_by(MindMapNode.order_index)
            
            return [child.to_dict() for child in children]
        except Exception as e:
            logger.error(f"获取子节点详情失败：{e}")
            return []
    
    @staticmethod
    def create_node(node_data: Dict) -> Optional[MindMapNode]:
        """创建新节点"""
        try:
            with DB.atomic():
                node = MindMapNode.create(**node_data)
                logger.info(f"创建节点成功：{node.id}")
                return node
        except Exception as e:
            logger.error(f"创建节点失败：{e}")
            return None
    
    @staticmethod
    def update_node(node_id: str, update_data: Dict) -> bool:
        """更新节点"""
        try:
            with DB.atomic():
                updated = MindMapNode.update(**update_data).where(
                    MindMapNode.id == node_id
                ).execute()
                
                if updated > 0:
                    logger.info(f"更新节点成功：{node_id}")
                    return True
                return False
        except Exception as e:
            logger.error(f"更新节点失败：{e}")
            return False
    
    @staticmethod
    def delete_node(node_id: str, cascade: bool = False) -> bool:
        """
        删除节点
        
        Args:
            node_id: 节点 ID
            cascade: 是否级联删除子节点
            
        Returns:
            是否删除成功
        """
        try:
            with DB.atomic():
                if cascade:
                    # 递归删除所有子节点
                    def delete_children(parent_id: str):
                        children = MindMapNode.select().where(
                            MindMapNode.parent_id == parent_id
                        )
                        for child in children:
                            delete_children(child.id)
                            child.delete_instance()
                    
                    delete_children(node_id)
                
                deleted = MindMapNode.delete().where(
                    MindMapNode.id == node_id
                ).execute()
                
                if deleted > 0:
                    logger.info(f"删除节点成功：{node_id}")
                    return True
                return False
        except Exception as e:
            logger.error(f"删除节点失败：{e}")
            return False
    
    @staticmethod
    def get_suggested_questions(node_id: str) -> List[str]:
        """
        获取节点的推荐问题（优先使用 JSON 中的 related_questions）
        
        Args:
            node_id: 节点 ID
            
        Returns:
            推荐问题列表
        """
        try:
            import json as json_module
            node = MindMapNode.get_or_none(MindMapNode.id == node_id)
            if not node:
                return []
            
            # 优先使用 JSON 中定义的 related_questions
            if node.related_questions:
                try:
                    questions = json_module.loads(node.related_questions)
                    if questions:
                        return questions
                except:
                    pass
            
            # 如果没有定义，则使用默认问题
            questions = []
            
            if node.is_leaf:
                # 叶子节点：详细讲解类问题
                questions = [
                    f"请详细讲解{node.title}",
                    f"{node.title}有哪些典型例题？",
                    f"学习{node.title}需要掌握哪些前置知识？",
                    f"{node.title}在实际中有什么应用？",
                ]
            else:
                # 非叶子节点：概念理解类问题
                questions = [
                    f"{node.title}主要讲的是什么？",
                    f"展开下一级目录",
                    f"学习{node.title}需要知道什么？",
                    f"{node.title}包含哪些重要知识点？",
                ]
            
            return questions
        except Exception as e:
            logger.error(f"获取推荐问题失败：{e}")
            return []
    
    @staticmethod
    def search_nodes(keyword: str, limit: int = 20) -> List[Dict]:
        """
        搜索节点
        
        Args:
            keyword: 搜索关键词
            limit: 返回结果数量限制
            
        Returns:
            匹配的节点列表
        """
        try:
            nodes = MindMapNode.select().where(
                MindMapNode.title.contains(keyword) | 
                MindMapNode.description.contains(keyword)
            ).limit(limit)
            
            return [node.to_dict() for node in nodes]
        except Exception as e:
            logger.error(f"搜索节点失败：{e}")
            return []

    @staticmethod
    def get_all_nodes():
        """获取所有节点（用于统计）"""
        return MindMapNode.select()

    @staticmethod
    def get_leaf_nodes():
        """获取所有叶子节点（用于进度统计）"""
        return MindMapNode.select().where(MindMapNode.is_leaf == True)

    @staticmethod
    def get_all_descendants(node_id: str) -> List[str]:
        """
        获取节点的所有后代节点 ID（递归）
        
        Returns:
            后代节点 ID 列表
        """
        descendants = []
        
        def _collect(parent_id: str):
            children = MindMapNode.select().where(MindMapNode.parent_id == parent_id)
            for child in children:
                descendants.append(child.id)
                _collect(child.id)
        
        _collect(node_id)
        return descendants

    @staticmethod
    def are_all_siblings_completed(node_id: str, user_id: str, completed_ids: set) -> bool:
        """
        检查某节点的所有兄弟节点是否都已完成
        
        Args:
            node_id: 当前节点 ID（用于获取父节点）
            user_id: 用户 ID
            completed_ids: 已完成的节点 ID 集合
            
        Returns:
            是否所有兄弟节点都已完成
        """
        try:
            node = MindMapNode.get_or_none(MindMapNode.id == node_id)
            if not node or not node.parent_id:
                return False
            
            # 获取所有兄弟节点（包括自己）
            siblings = MindMapNode.select().where(
                MindMapNode.parent_id == node.parent_id
            )
            
            # 检查是否全部完成
            for sibling in siblings:
                if sibling.id not in completed_ids:
                    return False
            
            return True
        except Exception as e:
            logger.error(f"检查兄弟节点完成状态失败：{e}")
            return False
