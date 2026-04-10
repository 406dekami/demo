#!/usr/bin/env python3
"""
模型管理相关的 Pydantic Schema 定义
"""
from typing import Optional

from pydantic import BaseModel, Field


class VerifyApiKeyRequest(BaseModel):
    """验证 API Key 请求"""
    llm_factory: str = Field(..., description="厂商名称，如：Qwen, OpenAI 等")
    api_key: str = Field(..., description="API 密钥")
    base_url: Optional[str] = Field(None, description="基础 URL（可选）")


class AddModelRequest(BaseModel):
    """添加模型请求"""
    tenant_id: Optional[str] = Field(default="demo_user", description="租户 ID")
    llm_factory: str = Field(..., description="厂商名称")
    llm_name: str = Field(..., description="模型名称")
    model_type: str = Field(..., description="模型类型")
    api_key: Optional[str] = Field(None, description="API 密钥")
    base_url: Optional[str] = Field(None, description="基础 URL")


class ApiResponse(BaseModel):
    """统一响应格式"""
    code: int = Field(0, description="状态码")
    message: Optional[str] = Field(None, description="提示信息")
    data: Optional[dict] = Field(None, description="响应数据")
