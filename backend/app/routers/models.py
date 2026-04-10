#!/usr/bin/env python3
"""
模型管理业务模块 - FastAPI 路由
"""
from typing import Optional

from fastapi import APIRouter, Request, Body

from ..db.services import get_all_factories, get_models_by_factory
from ..schemas.model import AddModelRequest, ApiResponse
from ..utils.get_tenant_id import get_tenant_id

router = APIRouter()

# ============ API 接口 ============
@router.get("/factories", response_model=ApiResponse, summary="获取厂商列表")
async def get_factories():
    """
    获取所有支持的 LLM 厂商列表（从数据库读取）- 用于可选模型
    """
    try:
        result = get_all_factories()
        return {"code": 200, "message": "success", "data": {"factories": result}}
    except Exception as e:
        import traceback
        print(f"❌ 获取厂商列表失败：{e}")
        print(traceback.format_exc())
        return {"code": 500, "message": str(e), "data": None}


@router.get("/models", response_model=ApiResponse, summary="获取已添加的模型")
async def get_models(request: Request, tenant_id: Optional[str] = None):
    """
    获取租户的所有模型配置（从 ModelConfig 表读取）
    """
    try:
        # 如果没有提供 tenant_id，从认证信息获取
        if not tenant_id:
            tenant_id = get_tenant_id(request)
        
        configs = ModelConfig.select().where(ModelConfig.tenant_id == tenant_id)
        models = [{
            'id': c.id,
            'tenant_id': c.tenant_id,
            'model_name': c.model_name,
            'model_type': c.model_type,
            'provider': c.provider,
            'api_base': c.api_base,
            'is_enabled': c.is_enabled,
        } for c in configs]
        return {"code": 0, "message": "success", "data": {"models": models}}
    except Exception as e:
        return {"code": 500, "message": str(e), "data": None}


@router.post("/models/add", response_model=ApiResponse, summary="添加模型配置")
async def add_model(request: Request, req_data: AddModelRequest):
    """
    为租户添加新的 LLM 模型配置（保存到 ModelConfig 表）
    """
    try:
        # 如果没有提供 tenant_id，从认证信息获取
        tenant_id = req_data.tenant_id if req_data.tenant_id and req_data.tenant_id != "demo_user" else get_tenant_id(request)
        
        # 检查是否已存在
        exists = ModelConfig.get_or_none(
            ModelConfig.tenant_id == tenant_id,
            ModelConfig.model_name == req_data.llm_name,
            ModelConfig.provider == req_data.llm_factory
        )
        
        if exists:
            return {"code": 1, "message": "模型已存在", "data": None}
        
        # 创建配置
        config = ModelConfig.create(
            tenant_id=tenant_id,
            model_name=req_data.llm_name,
            model_type=req_data.model_type,
            provider=req_data.llm_factory,
            api_key=req_data.api_key,
            api_base=req_data.base_url,
        )
        
        result = {
            "id": config.id,
            "factory": request.llm_factory,
            "name": request.llm_name,
            "type": request.model_type,
        }
        return {"code": 0, "message": "添加成功", "data": result}
    except Exception as e:
        return {"code": 500, "message": str(e), "data": None}


@router.get("/models/{factory_name}/list", response_model=ApiResponse, summary="根据厂商获取模型列表")
async def get_models_by_factory(factory_name: str):
    """
    根据厂商名称获取该厂商的所有模型（从 LLMModel 表读取）
    """
    try:
        models = get_models_by_factory(factory_name)
        return {"code": 0, "message": "success", "data": {"models": models}}
    except Exception as e:
        return {"code": 500, "message": str(e), "data": None}


@router.post("/set-default-model", response_model=ApiResponse, summary="设置默认模型")
async def set_default_model(
    request: Request,
    model_name: str = Body(..., embed=True),
    tenant_id: Optional[str] = None
):
    """
    设置用户的默认模型
    """
    try:
        # 如果没有提供 tenant_id，从认证信息获取
        if not tenant_id or tenant_id == "demo_user":
            tenant_id = get_tenant_id(request)
        # 在实际应用中，这里应该调用核心业务逻辑来设置默认模型
        # 由于我们只是演示，直接返回成功
        return {"code": 0, "message": "success", "data": {"result": True}}
    except Exception as e:
        return {"code": 500, "message": str(e), "data": None}
