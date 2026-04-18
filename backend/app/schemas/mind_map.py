#!/usr/bin/env python3
"""
思维导图 Schema 定义
"""
from datetime import datetime
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field


class MindMapNodeSchema(BaseModel):
    """思维导图节点 Schema"""
    id: str = Field(..., description="节点 ID")
    parent_id: Optional[str] = Field(None, description="父节点 ID")
    title: str = Field(..., description="节点标题")
    level: int = Field(default=0, description="节点层级")
    node_type: str = Field(default="concept", description="节点类型")
    description: Optional[str] = Field(None, description="节点描述")
    order_index: int = Field(default=0, description="排序索引")
    is_leaf: bool = Field(default=False, description="是否为叶子节点")
    icon: Optional[str] = Field(None, description="节点图标")
    color: Optional[str] = Field(None, description="节点颜色")
    created_at: Optional[datetime] = Field(None, description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间")
    
    class Config:
        from_attributes = True


# 请求模型

class CreateNodeRequest(BaseModel):
    """创建节点请求"""
    id: str = Field(..., description="节点 ID")
    parent_id: Optional[str] = Field(None, description="父节点 ID")
    title: str = Field(..., description="节点标题")
    level: int = Field(default=0, description="节点层级")
    node_type: str = Field(default="concept", description="节点类型")
    description: Optional[str] = Field(None, description="节点描述")
    order_index: int = Field(default=0, description="排序索引")
    is_leaf: bool = Field(default=False, description="是否为叶子节点")
    icon: Optional[str] = Field(None, description="节点图标")
    color: Optional[str] = Field(None, description="节点颜色")


class UpdateNodeRequest(BaseModel):
    """更新节点请求"""
    title: Optional[str] = Field(None, description="节点标题")
    node_type: Optional[str] = Field(None, description="节点类型")
    description: Optional[str] = Field(None, description="节点描述")
    order_index: Optional[int] = Field(None, description="排序索引")
    is_leaf: Optional[bool] = Field(None, description="是否为叶子节点")
    icon: Optional[str] = Field(None, description="节点图标")
    color: Optional[str] = Field(None, description="节点颜色")


class SearchNodesRequest(BaseModel):
    """搜索节点请求"""
    keyword: str = Field(..., description="搜索关键词")
    limit: int = Field(default=20, description="返回结果数量")


class ChatRequest(BaseModel):
    """聊天请求"""
    node_id: str = Field(..., description="节点 ID")
    question: str = Field(..., description="用户问题")
    conversation_id: Optional[str] = Field(None, description="会话 ID")
