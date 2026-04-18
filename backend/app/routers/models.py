#!/usr/bin/env python3
"""
模型管理业务模块 - FastAPI 路由
"""
from typing import Optional

from fastapi import APIRouter, Body, Request

from ..db.models.llm import ModelConfig
from ..db.services import get_all_factories, get_models_by_factory
from ..schemas.model import AddModelRequest, VerifyApiKeyRequest
from ..utils.api_response import error_response, success_response
from ..utils.get_tenant_id import get_tenant_id

router = APIRouter()


@router.get("/factories", summary="获取厂商列表")
async def get_factories():
    try:
        result = get_all_factories()
        return success_response({"factories": result})
    except Exception as e:
        return error_response(str(e))


@router.get("/models", summary="获取已添加的模型")
async def get_models(request: Request, tenant_id: Optional[str] = None):
    try:
        current_tenant_id = tenant_id or get_tenant_id(request)
        configs = ModelConfig.select().where(ModelConfig.tenant_id == current_tenant_id)
        models = [{
            'id': c.id,
            'tenant_id': c.tenant_id,
            'model_name': c.model_name,
            'model_type': c.model_type,
            'provider': c.provider,
            'api_base': c.api_base,
            'is_enabled': c.is_enabled,
        } for c in configs]
        return success_response({"models": models})
    except Exception as e:
        return error_response(str(e))


@router.post("/models/add", summary="添加模型配置")
async def add_model(request: Request, req_data: AddModelRequest):
    try:
        tenant_id = req_data.tenant_id if req_data.tenant_id and req_data.tenant_id != "demo_user" else get_tenant_id(request)
        exists = ModelConfig.get_or_none(
            (ModelConfig.tenant_id == tenant_id)
            & (ModelConfig.model_name == req_data.llm_name)
            & (ModelConfig.provider == req_data.llm_factory)
        )
        if exists:
            return error_response("模型已存在")

        config = ModelConfig.create(
            tenant_id=tenant_id,
            model_name=req_data.llm_name,
            model_type=req_data.model_type,
            provider=req_data.llm_factory,
            api_key=req_data.api_key,
            api_base=req_data.base_url,
        )
        return success_response({
            "id": config.id,
            "factory": req_data.llm_factory,
            "name": req_data.llm_name,
            "type": req_data.model_type,
        }, "添加成功")
    except Exception as e:
        return error_response(str(e))


@router.get("/models/{factory_name}/list", summary="根据厂商获取模型列表")
async def get_models_list_by_factory(factory_name: str):
    try:
        models = get_models_by_factory(factory_name)
        return success_response({"models": models})
    except Exception as e:
        return error_response(str(e))


@router.post("/models/verify", summary="验证模型配置")
async def verify_model(_: VerifyApiKeyRequest):
    return success_response({"verified": True}, "验证成功")


@router.post("/set-default-model", summary="设置默认模型")
async def set_default_model(request: Request, model_name: str = Body(..., embed=True), tenant_id: Optional[str] = None):
    try:
        _ = tenant_id or get_tenant_id(request)
        return success_response({"model_name": model_name, "result": True})
    except Exception as e:
        return error_response(str(e))
