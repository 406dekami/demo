#!/usr/bin/env python3
"""
LLM 模型管理相关模型
"""
from peewee import CharField, TextField, IntegerField, FloatField, BooleanField, ForeignKeyField

from .base import BaseModel


class LLMFactory(BaseModel):
    """LLM 模型厂商（从 llm_factories.json 导入）"""
    name = CharField(max_length=64, unique=True, index=True, help_text="厂商标识，如 OpenAI")
    logo = TextField(null=True, help_text="Logo URL")
    tags = TextField(null=True, help_text="标签，如 LLM,TEXT EMBEDDING,TTS")
    status = CharField(max_length=1, default="1", help_text="状态：0-禁用 1-启用")
    rank = IntegerField(default=0, help_text="排序权重")

    class Meta:
        table_name = "llm_factory"
        indexes = (
            (("name",), True),  # 厂商名称唯一
        )

    def __str__(self):
        return f"{self.name}"


class LLMModel(BaseModel):
    """LLM 模型信息（从 llm_factories.json 导入）"""
    factory_id = ForeignKeyField(LLMFactory, field="id", backref="models", on_delete="CASCADE", help_text="所属厂商")
    llm_name = CharField(max_length=128, index=True, help_text="模型名称，如 gpt-4")
    tags = TextField(null=True, help_text="标签，如 LLM,CHAT,128K")
    max_tokens = IntegerField(default=4096, help_text="最大 token 数")
    model_type = CharField(max_length=32, index=True, help_text="类型：chat/embedding/tts/image2text/speech2text/rerank")
    is_tools = BooleanField(default=False, help_text="是否支持工具调用")

    class Meta:
        table_name = "llm_model"
        indexes = (
            (("factory_id", "llm_name"), True),  # 同一厂商下模型名唯一
            (("model_type",), False),  # 按类型查询
        )

    def __str__(self):
        return f"{self.factory_id.name}/{self.llm_name}"


class ModelConfig(BaseModel):
    """LLM 模型配置（一个租户可配多个模型）"""
    tenant_id = CharField(max_length=32, index=True, help_text="租户 ID")
    model_name = CharField(max_length=64, index=True, help_text="模型标识，如 gpt-4")
    model_type = CharField(max_length=32, index=True, help_text="类型：chat/embedding/rerank")
    provider = CharField(max_length=32, help_text="厂商：openai/anthropic/local")
    api_key = TextField(null=True, help_text="API Key（加密存储）")
    api_base = CharField(max_length=255, null=True, help_text="自定义接口地址")
    max_tokens = IntegerField(default=4096, help_text="最大输出长度")
    temperature = FloatField(default=0.7, help_text="采样温度")
    is_enabled = BooleanField(default=True, index=True, help_text="是否启用")

    class Meta:
        table_name = "model_config"
        # 联合主键：同一租户下模型名唯一
        primary_key = False
        indexes = (
            (("tenant_id", "model_name"), True),
        )

    def __str__(self):
        return f"{self.provider}/{self.model_name}"
