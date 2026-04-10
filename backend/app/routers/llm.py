"""
LLM 模型管理 API
"""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from ..db.services import get_models_by_factory, LLMService

# router = APIRouter(prefix="/api/v1/llm", tags=["LLM 模型管理"])
router = APIRouter()

@router.get("/factories")
def get_factories():
    """
    获取所有模型厂商及其模型列表
    """
    try:
        result = get_models_by_factory()
        return {
            "code": 0,
            "message": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models/{model_type}")
def get_models_by_type_api(
    model_type: str,
    factory_name: Optional[str] = Query(None, description="厂商名称筛选")
):
    """
    根据模型类型获取模型列表
    
    Args:
        model_type: 模型类型 (chat, embedding, tts, image2text, speech2text, rerank)
        factory_name: 可选，厂商名称筛选
    """
    try:
        models = LLMService.get_models_by_type(model_type, factory_name)
        return {
            "code": 0,
            "message": "success",
            "data": models
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/init")
def init_factories():
    """
    手动触发初始化 LLM 厂商数据（用于调试或重新导入）
    """
    from ..db.services.llm_factory_service import init_llm_factories
    try:
        success = init_llm_factories()
        if success:
            return {
                "code": 0,
                "message": "初始化成功"
            }
        else:
            return {
                "code": 1,
                "message": "初始化失败或已初始化"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model-types")
def get_model_types():
    """
    获取所有支持的模型类型
    """
    return {
        "code": 0,
        "message": "success",
        "data": LLMService.get_model_types()
    }
