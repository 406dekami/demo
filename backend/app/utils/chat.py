#!/usr/bin/env python3
"""
LLM 对话工具函数
用于思维导图节点对话和其他场景的 LLM 调用
"""
import logging
from typing import Dict, Any, Optional
from ..rag.generator import Generator
from ..db import Conversation, Message

logger = logging.getLogger(__name__)


async def chat_with_llm(
    system_prompt: str,
    user_question: str,
    conversation_id: Optional[str] = None,
    model_name: str = "qwen-plus",
) -> Dict[str, Any]:
    """
    与 LLM 进行对话
    
    Args:
        system_prompt: 系统提示词
        user_question: 用户问题
        conversation_id: 对话 ID（可选，用于多轮对话上下文）
        model_name: 使用的模型名称
        
    Returns:
        {
            "answer": str,  # LLM 生成的回答
            "conversation_id": str,  # 对话 ID
            "references": list  # 引用来源（思维导图场景为空）
        }
    """
    try:
        logger.info(f"LLM 对话：question={user_question[:50]}..., conversation_id={conversation_id}")
        
        # 初始化生成器
        generator = Generator(model_name=model_name)
        
        # 获取对话历史
        history = []
        if conversation_id:
            messages = Message.select().where(
                Message.conversation_id == conversation_id
            ).order_by(Message.create_time)
            
            for msg in messages:
                history.append({
                    "role": msg.role,
                    "content": msg.content,
                })
            
            # 如果对话不存在，创建它
            conv = Conversation.get_or_none(Conversation.id == conversation_id)
            if not conv:
                logger.info(f"创建新对话：conversation_id={conversation_id}")
                Conversation.create(
                    id=conversation_id,
                    tenant_id="default",
                    user_id="anonymous",
                    model_name=model_name,
                    title=user_question[:50] + "..." if len(user_question) > 50 else user_question,
                )
        else:
            import uuid
            conversation_id = str(uuid.uuid4())
            logger.info(f"生成新对话 ID：{conversation_id}")
            Conversation.create(
                id=conversation_id,
                tenant_id="default",
                user_id="anonymous",
                model_name=model_name,
                title=user_question[:50] + "..." if len(user_question) > 50 else user_question,
            )
        
        # 构建消息列表
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_question})
        
        # 调用 LLM 生成回答
        response = generator.generate(
            query=user_question,
            context=[],  # 思维导图场景不使用向量检索上下文
            history=history,
            system_prompt=system_prompt,
        )
        
        # 保存消息到数据库
        if conversation_id:
            Message.create(
                conversation_id=conversation_id,
                role="user",
                content=user_question,
            )
            Message.create(
                conversation_id=conversation_id,
                role="assistant",
                content=response,
                meta_info={"model": model_name},
            )
        
        return {
            "answer": response,
            "conversation_id": conversation_id,
            "references": [],
        }
        
    except Exception as e:
        logger.error(f"LLM 对话失败：{e}", exc_info=True)
        raise
