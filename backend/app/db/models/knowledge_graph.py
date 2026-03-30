#!/usr/bin/env python3
"""
知识图谱数据模型
独立于现有的 Notebook/KnowledgeBase 系统
"""
from peewee import CharField, TextField, IntegerField, DateTimeField, ForeignKeyField, fn
from datetime import datetime
from .base import BaseModel


class KnowledgeNode(BaseModel):
    """
    知识节点
    
    四级知识体系：
    - Level 0: Course (课程)
    - Level 1: Concept (概念)
    - Level 2: Principle (原理)
    - Level 3: Circuit (电路)
    - Level 4: Application (应用)
    """
    id = CharField(max_length=32, primary_key=True, help_text="节点 ID，如 N001")
    name = CharField(max_length=255, index=True, help_text="节点名称")
    level = IntegerField(default=0, help_text="知识层级：0-课程/1-概念/2-原理/3-电路/4-应用")
    node_type = CharField(
        max_length=32, 
        index=True,
        help_text="节点类型：Course/Concept/Principle/Circuit/Application"
    )
    description = TextField(null=True, help_text="节点描述")
    parent_id = CharField(max_length=32, null=True, index=True, help_text="父节点 ID")
    
    # 扩展字段
    module = CharField(max_length=64, null=True, help_text="所属模块")
    prerequisites = TextField(null=True, help_text="前置知识 ID 列表，JSON 格式")
    
    class Meta:
        table_name = "knowledge_node"
        indexes = (
            (("level", "node_type"), False),
            (("parent_id",), False),
        )


class KnowledgeRelation(BaseModel):
    """
    知识关系
    
    三种关系类型：
    - CONTAINS: 层级包含关系（父->子）
    - PREREQUISITE: 先修依赖关系（前驱->后继）
    - DERIVES: 逻辑衍生关系（基础->扩展）
    """
    id = CharField(max_length=32, primary_key=True, help_text="关系 ID")
    source_id = CharField(max_length=32, index=True, help_text="源节点 ID")
    target_id = CharField(max_length=32, index=True, help_text="目标节点 ID")
    relation_type = CharField(
        max_length=32, 
        index=True,
        help_text="关系类型：CONTAINS/PREREQUISITE/DERIVES"
    )
    description = TextField(null=True, help_text="关系描述")
    
    class Meta:
        table_name = "knowledge_relation"
        indexes = (
            (("source_id", "target_id"), True),  # 唯一索引
            (("relation_type",), False),
        )
