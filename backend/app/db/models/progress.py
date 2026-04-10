#!/usr/bin/env python3
"""
用户思维导图学习进度模型
"""
from peewee import CharField, BooleanField

from .base import BaseModel


class UserNodeProgress(BaseModel):
    """用户节点学习进度"""
    user_id = CharField(max_length=32, index=True, help_text="用户 ID")
    node_id = CharField(max_length=64, index=True, help_text="思维导图节点 ID")
    is_completed = BooleanField(default=False, help_text="是否已完成学习")

    class Meta:
        table_name = "user_node_progress"
        indexes = (
            (("user_id", "node_id"), True),  # 唯一约束：一个用户对一个节点只有一条记录
        )
