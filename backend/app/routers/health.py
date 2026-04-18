#!/usr/bin/env python3
"""
健康检查和根路径路由
"""
from fastapi import APIRouter

from ..utils.api_response import success_response

router = APIRouter()


@router.get("/health", summary="健康检查")
async def health_check():
    """服务健康状态检查"""
    return success_response({"status": "ok"}, "Service is running")


@router.get("/", summary="根路径")
async def root():
    """根路径欢迎信息"""
    return success_response({
        "docs": "/docs",
        "version": "1.0.0"
    }, "Welcome to RAG Platform API")
