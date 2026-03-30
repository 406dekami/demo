#!/usr/bin/env python3
"""
数据库层统一导出
"""

# 从 models/ 目录导入所有模型
from .models.base import BaseModel
from .models.user import User, UserToken
from .models.llm import LLMFactory, LLMModel, ModelConfig
from .models.conversation import Conversation, Message
from .models.knowledge import KnowledgeBase, Document, Chunk
from .models import get_all_models

# 从 database.py 导入初始化函数
from .database import init_tables, get_database, DB

# 从 services.py 导入服务类（可选）
from .services import (
    LLMService,
    TenantLLMService,
    LLMFactoriesService,
    load_llm_factories_json,
    init_llm_factories,
)

__all__ = [
    # 基类
    'BaseModel',
    
    # 用户
    'User', 'UserToken',
    
    # LLM
    'LLMFactory', 'LLMModel', 'ModelConfig',
    
    # 对话
    'Conversation', 'Message',
    
    # 知识库
    'KnowledgeBase', 'Document', 'Chunk',
    
    # 工具函数
    'get_all_models',
    
    # 数据库
    'init_tables',
    'get_database',
    'DB',
    
    # 服务
    'LLMService',
    'TenantLLMService',
    'LLMFactoriesService',
    'load_llm_factories_json',
    'init_llm_factories',
]
