#!/usr/bin/env python3
"""
初始化基础数据
"""
import logging

from .services import init_llm_factories


def init_data():
    """初始化基础数据"""
    try:
        logger = logging.getLogger(__name__)
        logger.info("🔄 开始初始化 LLM 厂商数据...")
        
        if init_llm_factories():
            logger.info("✅ LLM 厂商数据初始化成功")
        else:
            logger.warning("⚠️ LLM 厂商数据初始化失败")
        
        logger.info("✅ 基础数据已就绪")
    except Exception as e:
        logging.warning(f"基础数据初始化跳过：{e}")
