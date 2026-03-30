"""
知识库管理相关请求和响应模型
"""
from pydantic import BaseModel, Field
from typing import Optional


class KnowledgeBaseCreateRequest(BaseModel):
    """知识库创建请求"""
    name: str = Field(..., min_length=1, max_length=128, description="知识库名称")
    description: Optional[str] = Field(None, max_length=512, description="知识库描述")
    chunk_size: int = Field(512, ge=128, le=4096, description="切片长度")
    chunk_overlap: int = Field(50, ge=0, le=512, description="切片重叠")


class KnowledgeBaseResponse(BaseModel):
    """知识库响应"""
    id: str
    tenant_id: str
    name: str
    description: Optional[str]
    embd_model: str
    chunk_size: int
    chunk_overlap: int
    document_count: int
    chunk_count: int
    create_time: int
    update_time: int


class KnowledgeBaseListResponse(BaseModel):
    """知识库列表响应"""
    code: int = Field(0, description="状态码")
    message: Optional[str] = Field(None, description="提示信息")
    data: Optional[dict] = Field(None, description="响应数据")


class UploadFileResponse(BaseModel):
    """上传文件响应"""
    code: int = Field(0, description="状态码")
    message: Optional[str] = Field(None, description="提示信息")
    data: Optional[dict] = Field(None, description="响应数据")


class DeleteResponse(BaseModel):
    """删除操作响应"""
    code: int = Field(0, description="状态码")
    message: Optional[str] = Field(None, description="提示信息")
    data: Optional[dict] = Field(None, description="响应数据")
