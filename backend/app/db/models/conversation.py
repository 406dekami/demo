#!/usr/bin/env python3
"""
对话系统相关模型
"""
from peewee import CharField, TextField, IntegerField
from .base import BaseModel


class Conversation(BaseModel):
    """对话会话（一次聊天窗口）"""
    tenant_id = CharField(max_length=32, index=True, help_text="租户 ID")
    user_id = CharField(max_length=32, index=True, help_text="用户 ID")
    title = CharField(max_length=128, null=True, help_text="对话标题（可自动生成）")
    model_name = CharField(max_length=64, help_text="使用的模型")
    kb_ids = TextField(null=True, help_text="关联的知识库 ID 列表，JSON 格式")
    system_prompt = TextField(null=True, help_text="系统提示词")

    class Meta:
        table_name = "conversation"


class Message(BaseModel):
    """对话消息（一问一答）"""
    conversation_id = CharField(max_length=32, index=True, help_text="所属对话")
    role = CharField(max_length=16, index=True, help_text="user/assistant/system")
    content = TextField(help_text="消息内容")
    tokens = IntegerField(default=0, help_text="消耗的 token 数")
    meta_info = TextField(null=True, help_text="扩展信息：引用片段/耗时等，JSON 格式")

    class Meta:
        table_name = "message"
        indexes = (
            (("conversation_id", "create_time"), False),  # 按时间查消息
        )
