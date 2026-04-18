#!/usr/bin/env python3
"""
数据库模型统一导出
"""
from .base import BaseModel
from .user import User, UserToken
from .conversation import Conversation, Message
from .knowledge import KnowledgeBase, Document, Chunk
from .knowledge_graph import KnowledgeNode, KnowledgeRelation
from .mind_map import MindMapNode
from .progress import UserNodeProgress
from .llm import LLMFactory, LLMModel, ModelConfig

__all__ = [
    # 基类
    'BaseModel',
    
    # 用户
    'User', 'UserToken',
    
    # 对话
    'Conversation', 'Message',
    
    # 知识库
    'KnowledgeBase', 'Document', 'Chunk',
    
    # 知识图谱
    'KnowledgeNode', 'KnowledgeRelation',
    
    # 思维导图
    'MindMapNode',
    
    # 学习进度
    'UserNodeProgress',
    
    # LLM 模型管理
    'LLMFactory', 'LLMModel', 'ModelConfig',
]


def get_all_models():
    """获取所有模型类列表（用于初始化）"""
    return [
        User, UserToken,
        Conversation, Message,
        KnowledgeBase, Document, Chunk,
        KnowledgeNode, KnowledgeRelation,
        MindMapNode,
        UserNodeProgress,
        LLMFactory, LLMModel, ModelConfig,
    ]
