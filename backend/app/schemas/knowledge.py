"""
知识库管理相关请求模型

注意：响应已统一使用 success_response/error_response，不再定义 Response Schema
"""
from pydantic import BaseModel, Field
from typing import Optional


class KnowledgeBaseCreateRequest(BaseModel):
    """知识库创建请求"""
    name: str = Field(..., min_length=1, max_length=128, description="知识库名称")
    description: Optional[str] = Field(None, max_length=512, description="知识库描述")
    chunk_size: int = Field(512, ge=128, le=4096, description="切片长度")
    chunk_overlap: int = Field(50, ge=0, le=512, description="切片重叠")
    cover_image: Optional[str] = Field(None, description="封面图片 URL（Base64）")
    cover_color: Optional[str] = Field(None, description="封面纯色（hex）")


class KnowledgeBaseUpdateRequest(BaseModel):
    """知识库更新请求"""
    name: str = Field(..., min_length=1, max_length=128, description="知识库名称")
    description: Optional[str] = Field(None, max_length=512, description="知识库描述")
    cover_image: Optional[str] = Field(None, description="封面图片 URL（Base64）")
    cover_color: Optional[str] = Field(None, description="封面纯色（hex）")
