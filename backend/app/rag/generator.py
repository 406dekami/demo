"""
答案生成器模块
负责调用大模型生成最终回答
"""
from typing import List, Dict, Any, Optional, Generator as TypeGenerator
import logging
from dashscope import Generation
import os

logger = logging.getLogger(__name__)

class Generator:
    """
    答案生成器，负责调用大语言模型生成最终回答
    """
    
    # 默认模型配置
    DEFAULT_MODEL = "qwen-plus"
    MAX_TOKENS = 2048
    TEMPERATURE = 0.7
    
    def __init__(self, model_name: Optional[str] = None, api_key: Optional[str] = None):
        """
        初始化生成器
        
        Args:
            model_name: 模型名称，默认使用 qwen-plus
            api_key: API Key（可选，不传则从环境变量读取）
        """
        self.model_name = model_name or self.DEFAULT_MODEL
        
        # 设置 API Key
        if api_key:
            import dashscope
            dashscope.api_key = api_key
        else:
            import dashscope
            dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
    
    def generate(
        self, 
        query: str, 
        context: List[Dict[str, Any]], 
        history: Optional[List[Dict[str, str]]] = None,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        生成最终回答
            
        Args:
            query: 用户的原始查询
            context: 从知识库检索到的相关上下文
            history: 对话历史列表，每项包含 {"role": "user/assistant", "content": "..."}
            system_prompt: 自定义系统提示词（可选）
            temperature: 温度参数，控制随机性（0-1 之间）
            max_tokens: 最大生成长度
                
        Returns:
            生成的最终回答
        """
        try:
            logger.info(f"生成回答：query={query[:50]}..., context_count={len(context)}")
                
            # 构建系统提示词
            if not system_prompt:
                system_prompt = (
                    "你是一个智能助手，请根据提供的上下文信息准确回答问题。\n"
                    "要求：\n"
                    "1. 仅基于提供的上下文作答，不要编造信息\n"
                    "2. 如果上下文不足以回答问题，请如实告知用户\n"
                    "3. 回答应简洁明了、逻辑清晰\n"
                    "4. 如有必要，可以引用上下文中的具体内容"
                )
                
            # 构建上下文文本
            context_text = self._format_context(context)
                
            # 构建消息列表
            messages = []
                
            # 添加系统提示
            messages.append({
                "role": "system",
                "content": f"{system_prompt}\n\n【参考信息】\n{context_text}"
            })
                
            # 添加对话历史
            if history:
                messages.extend(history)
                
            # 添加当前查询
            messages.append({
                "role": "user",
                "content": query
            })
                
            # 调用 Qwen 模型生成回答
            response = Generation.call(
                model=self.model_name,
                messages=messages,
                result_format='message',
                temperature=temperature or self.TEMPERATURE,
                max_tokens=max_tokens or self.MAX_TOKENS
            )
                
            if response.status_code == 200:
                content = response.output.choices[0].message.content
                logger.info(f"生成成功，长度：{len(content)}")
                return content
            else:
                logger.error(f"调用 Qwen API 失败：{response.code}, {response.message}")
                return f"抱歉，我无法获取回答（错误码：{response.code}）。请稍后重试。"
                    
        except Exception as e:
            logger.error(f"生成回答时发生错误 {query}: {e}")
            return "抱歉，我在处理您的请求时遇到了一些问题。"
        
    def _format_context(self, context: List[Dict[str, Any]]) -> str:
        """
        格式化上下文为可读文本
            
        Args:
            context: 检索到的上下文片段
                
        Returns:
            格式化后的上下文字符串
        """
        if not context:
            return "无相关参考信息"
            
        formatted = []
        for i, chunk in enumerate(context, 1):
            text = chunk.get('text', '')
            score = chunk.get('score', 0)
            source = chunk.get('metadata', {}).get('source', '未知来源')
                
            formatted.append(
                f"[{i}] (相似度：{score:.2f}, 来源：{source})\n{text}"
            )
            
        return "\n\n".join(formatted)
        
    def generate_stream(
        self, 
        query: str, 
        context: List[Dict[str, Any]], 
        history: Optional[List[Dict[str, str]]] = None
    ) -> TypeGenerator[str]:
        """
        流式生成回答（逐步输出）
            
        Args:
            query: 用户查询
            context: 上下文
            history: 对话历史
                
        Yields:
            逐步生成的文本片段
        """
        # TODO: 实现流式生成
        # 目前 DashScope SDK 支持 stream=True 参数
        # 可以使用 Generation.stream_call 实现
        yield self.generate(query, context, history)
        
    def summarize(self, texts: List[str], prompt: Optional[str] = None) -> str:
        """
        总结多个文本片段
            
        Args:
            texts: 要总结的文本列表
            prompt: 自定义总结指令
                
        Returns:
            总结结果
        """
        default_prompt = (
            "请对以下多段文本进行总结，提取关键信息，\n"
            "形成一段简洁、连贯的摘要（200 字以内）："
        )
            
        combined_texts = "\n\n".join([f"文本{i+1}:\n{text}" for i, text in enumerate(texts)])
            
        return self.generate(
            query=f"{prompt or default_prompt}\n\n{combined_texts}",
            context=[]  # 不需要额外上下文
        )