#!/usr/bin/env python3
"""
健康检查和根路径路由
"""
from fastapi import APIRouter

router = APIRouter()

@router.get("/health", summary="健康检查")
async def health_check():
    """服务健康状态检查"""
    return {"status": "ok", "message": "Service is running"}


@router.get("/", summary="根路径")
async def root():
    """根路径欢迎信息"""
    return {
        "message": "Welcome to RAG Platform API",
        "docs": "/docs",
        "version": "1.0.0"
    }
