#!/usr/bin/env python3
"""
数据库模型统一导出
"""
from .base import BaseModel
from .user import User, UserToken
from .llm import LLMFactory, LLMModel, ModelConfig
from .conversation import Conversation, Message
from .knowledge import KnowledgeBase, Document, Chunk
from .knowledge_graph import KnowledgeNode, KnowledgeRelation

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
    
    # 知识图谱
    'KnowledgeNode', 'KnowledgeRelation',
]


def get_all_models():
    """获取所有模型类列表（用于初始化）"""
    return [
        User, UserToken,
        LLMFactory, LLMModel, ModelConfig,
        Conversation, Message,
        KnowledgeBase, Document, Chunk,
        KnowledgeNode, KnowledgeRelation,
    ]
