#!/usr/bin/env python3
"""
思维导图数据模型
"""
from datetime import datetime

from peewee import (
    CharField, IntegerField, TextField,
    BooleanField
)

from .base import BaseModel


class MindMapNode(BaseModel):
    """思维导图节点模型（知识图谱用）"""
    
    id = CharField(primary_key=True, max_length=64, help_text="节点 ID")
    parent_id = CharField(null=True, max_length=64, index=True, help_text="父节点 ID，根节点为 null")
    title = CharField(max_length=255, help_text="节点标题")
    level = IntegerField(default=0, help_text="层级：0-课程/1-章节/2-小节/3-原理/4-电路/5-应用")
    node_type = CharField(max_length=50, default="concept", help_text="节点类型：course/chapter/section/concept/principle/circuit/application")
    description = TextField(null=True, help_text="节点描述")
    order_index = IntegerField(default=0, help_text="同级节点排序索引")
    is_leaf = BooleanField(default=False, help_text="是否为叶子节点")
    icon = CharField(null=True, max_length=100, help_text="节点图标")
    color = CharField(null=True, max_length=20, help_text="节点颜色")
    
    # 知识图谱增强字段
    tags = TextField(null=True, help_text="标签列表，JSON 格式")
    content = TextField(null=True, help_text="详细内容/核心概念")
    examples = TextField(null=True, help_text="示例列表，JSON 格式")
    related_questions = TextField(null=True, help_text="相关问题列表，JSON 格式")
    
    class Meta:
        table_name = 'mind_map_nodes'
        indexes = (
            (('parent_id', 'order_index'), False),
            (('level', 'node_type'), False),
        )
        schema = None  # 不使用 schema
    
    def to_dict(self, include_children=False):
        """转换为字典"""
        import json as json_module
        
        data = {
            'id': self.id,
            'parent_id': self.parent_id,
            'title': self.title,
            'level': self.level,
            'node_type': self.node_type,
            'description': self.description,
            'order_index': self.order_index,
            'is_leaf': self.is_leaf,
            'icon': self.icon,
            'color': self.color,
            # 知识图谱增强字段
            'tags': json_module.loads(self.tags) if self.tags else [],
            'content': self.content,
            'examples': json_module.loads(self.examples) if self.examples else [],
            'related_questions': json_module.loads(self.related_questions) if self.related_questions else [],
            'created_at': datetime.fromtimestamp(self.create_time / 1000).isoformat() if self.create_time else None,
            'updated_at': datetime.fromtimestamp(self.update_time / 1000).isoformat() if self.update_time else None,
        }
        
        if include_children and hasattr(self, '_children'):
            data['children'] = [child.to_dict(include_children=True) for child in self._children]
        
        return data
