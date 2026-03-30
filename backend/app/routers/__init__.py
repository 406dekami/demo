from fastapi import APIRouter
from .health import router as health_router
from .auth import router as auth_router
from .knowledge import router as knowledge_router
from .rag import router as rag_router
from .mind_map import router as mind_map_router

# 创建主路由
api_router = APIRouter(prefix="/api/v1")

# 统一注册所有子路由（健康检查不需要前缀）
api_router.include_router(health_router, tags=["健康检查"])
api_router.include_router(auth_router, prefix="/auth", tags=["用户认证"])
api_router.include_router(knowledge_router, prefix="/knowledge", tags=["知识库管理"])
api_router.include_router(rag_router, prefix="/rag", tags=["RAG 核心"])
api_router.include_router(mind_map_router, prefix="/mind-map", tags=["思维导图"])

# 对外导出
__all__ = ["api_router"]