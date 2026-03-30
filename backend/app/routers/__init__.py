from fastapi import APIRouter
from .health import router as health_router
from .auth import router as auth_router
from .models import router as models_router
from .knowledge import router as knowledge_router
from .rag import router as rag_router
from .knowledge_graph import router as knowledge_graph_router

# 创建主路由
api_router = APIRouter()

# 统一注册所有子路由（健康检查不需要前缀）
api_router.include_router(health_router, tags=["健康检查"])
api_router.include_router(auth_router, prefix="/api/v1/auth", tags=["用户认证"])
api_router.include_router(models_router, prefix="/api/v1/model", tags=["模型管理"])
api_router.include_router(knowledge_router, prefix="/api/v1/knowledge", tags=["知识库管理"])
api_router.include_router(rag_router, prefix="/api/v1/rag", tags=["RAG 核心"])
# api_router.include_router(graph_router, prefix="/api/v1/graph", tags=["知识图谱"])
api_router.include_router(knowledge_graph_router, prefix="/api/v1/knowledge-graph", tags=["独立知识图谱"])

# 对外导出
__all__ = ["api_router"]