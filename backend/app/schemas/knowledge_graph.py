#!/usr/bin/env python3
"""
知识图谱相关的 Pydantic Schema 定义
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class NodeCreateSchema(BaseModel):
    """创建节点请求"""
    id: str = Field(..., description="节点 ID，如 N001")
    name: str = Field(..., description="节点名称")
    level: int = Field(default=0, ge=0, le=4, description="知识层级：0-课程/1-概念/2-原理/3-电路/4-应用")
    node_type: str = Field(..., description="节点类型：Course/Concept/Principle/Circuit/Application")
    description: Optional[str] = Field(None, description="节点描述")
    parent_id: Optional[str] = Field(None, description="父节点 ID")
    module: Optional[str] = Field(None, description="所属模块")
    prerequisites: Optional[List[str]] = Field(None, description="前置知识 ID 列表")


class NodeUpdateSchema(BaseModel):
    """更新节点请求"""
    name: Optional[str] = None
    level: Optional[int] = None
    node_type: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[str] = None
    module: Optional[str] = None
    prerequisites: Optional[List[str]] = None


class RelationCreateSchema(BaseModel):
    """创建关系请求"""
    source_id: str = Field(..., description="源节点 ID")
    target_id: str = Field(..., description="目标节点 ID")
    relation_type: str = Field(..., description="关系类型：CONTAINS/PREREQUISITE/DERIVES")
    description: Optional[str] = Field(None, description="关系描述")
