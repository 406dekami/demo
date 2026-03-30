"""
RAG 相关请求和响应模型
"""
from pydantic import BaseModel, Field
from typing import Optional


class ProcessDocumentRequest(BaseModel):
    """文档处理请求"""
    document_id: str = Field(..., description="文档 ID")
    chunk_size: int = Field(512, ge=256, le=1024, description="切片长度")
    chunk_overlap: int = Field(50, ge=0, le=256, description="切片重叠")


class QueryRequest(BaseModel):
    """查询请求"""
    query: str = Field(..., min_length=1, description="查询内容")
    kb_id: str = Field(..., description="知识库 ID")
    conversation_id: Optional[str] = Field(None, description="对话 ID")
    use_knowledge_graph: bool = Field(True, description="是否使用知识图谱检索")


class UploadResponse(BaseModel):
    """上传响应"""
    code: int = Field(0, description="状态码")
    message: Optional[str] = Field(None, description="提示信息")
    data: Optional[dict] = Field(None, description="响应数据")


class ProcessResponse(BaseModel):
    """处理响应"""
    code: int = Field(0, description="状态码")
    message: Optional[str] = Field(None, description="提示信息")
    data: Optional[dict] = Field(None, description="响应数据")


class QueryResponse(BaseModel):
    """查询响应"""
    code: int = Field(0, description="状态码")
    message: Optional[str] = Field(None, description="提示信息")
    data: Optional[dict] = Field(None, description="响应数据")


class NotebookCreateResponse(BaseModel):
    """笔记本创建/更新响应"""
    code: int = Field(0, description="状态码")
    message: str = Field("", description="提示信息")
    data: dict = Field(..., description="响应数据")
