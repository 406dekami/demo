"""
RAG 相关请求模型

注意：响应已统一使用 success_response/error_response，不再定义 Response Schema
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List


class NotebookCreateRequest(BaseModel):
    """创建笔记本请求"""
    title: str
    description: Optional[str] = None
    kb_ids: Optional[List[str]] = None
    model_name: Optional[str] = "qwen-plus"
    system_prompt: Optional[str] = None

    @field_validator("kb_ids")
    @classmethod
    def validate_single_kb(cls, value: Optional[List[str]]):
        if value and len(value) > 1:
            raise ValueError("当前版本仅支持关联一个知识库")
        return value


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

