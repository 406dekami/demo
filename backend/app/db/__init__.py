#!/usr/bin/env python3
"""
数据库层统一导出
"""

# 从 models/ 目录导入所有模型
from .models.base import BaseModel
from .models.user import User, UserToken
from .models.conversation import Conversation, Message
from .models.knowledge import KnowledgeBase, Document, Chunk
from .models.progress import UserNodeProgress
from .models import get_all_models

# 从 database.py 导入初始化函数
from .database import init_tables, get_database, DB

__all__ = [
    # 基类
    'BaseModel',
    
    # 用户
    'User', 'UserToken',
    
    # 对话
    'Conversation', 'Message',
    
    # 知识库
    'KnowledgeBase', 'Document', 'Chunk',
    
    # 思维导图
    'UserNodeProgress',
    
    # 工具函数
    'get_all_models',
    
    # 数据库
    'init_tables',
    'get_database',
    'DB',
]
