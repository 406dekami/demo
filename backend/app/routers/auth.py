#!/usr/bin/env python3
"""
用户认证 API - 登录/注册/登出
"""
import logging
import time
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request, UploadFile, File

from ..core.config import settings
from ..db import User
from ..utils.api_response import success_response, error_response
from ..utils.token import generate_token, verify_token, invalidate_token

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/register", summary="用户注册", tags=["认证"])
async def register(req: dict):
    """
    用户注册接口
    
    - **phone**: 手机号（11位）
    - **password**: 密码（最少6位）
    - **confirm_password**: 确认密码
    
    返回用户信息和 Token
    """
    logger.info(f"📝 收到用户注册请求：phone={req.get('phone')}")

    existing_user = User.select().where(User.phone == req.get('phone')).first()
    if existing_user:
        logger.warning(f"⚠️ 手机号已被注册：phone={req.get('phone')}")
        return error_response("该手机号已被注册", code=409)

    try:
        user = User(
            phone=req.get('phone'),
            nickname=f"用户_{req.get('phone', '')[-4:]}",
        )
        user.set_password(req.get('password'))
        user.save(force_insert=True)
        logger.info(f"✓ 用户创建成功：user_id={user.id}")

        token = generate_token(str(user.id))
        logger.info(f"✅ 用户注册完成：user_id={user.id}, phone={user.phone}")

        return success_response({
            "user_id": str(user.id),
            "phone": user.phone,
            "nickname": user.nickname,
            "avatar": user.avatar,
            "token": token,
            "expires_in": 7200
        }, "注册成功")
    except Exception as e:
        logger.error(f"❌ 用户注册失败：phone={req.get('phone')}, error={str(e)}", exc_info=True)
        return error_response(f"注册失败：{str(e)}")


@router.post("/login", summary="用户登录", tags=["认证"])
async def login(req: dict):
    """
    用户登录接口
    
    - **phone**: 手机号
    - **password**: 密码
    - **remember_me**: 是否记住登录状态（30天）
    
    返回用户信息和 Token
    """
    logger.info(f"🔑 收到用户登录请求：phone={req.get('phone')}")

    user = User.select().where(User.phone == req.get('phone')).first()
    if not user or not user.check_password(req.get('password')):
        logger.warning(f"⚠️ 登录失败：phone={req.get('phone')}")
        return error_response("手机号或密码错误", code=401)

    if user.status != 1:
        logger.warning(f"⚠️ 登录失败 - 账号被禁用：phone={req.get('phone')}, status={user.status}")
        return error_response("账号已被禁用", code=403)

    user.last_login_time = int(time.time() * 1000)
    user.save()
    logger.info(f"✓ 更新最后登录时间：user_id={user.id}")

    token = generate_token(str(user.id), req.get('remember_me', False))
    expires_in = 2592000 if req.get('remember_me', False) else 7200
    logger.info(f"✅ 用户登录成功：user_id={user.id}, remember_me={req.get('remember_me', False)}")

    return success_response({
        "user_id": str(user.id),
        "phone": user.phone,
        "nickname": user.nickname,
        "avatar": user.avatar,
        "token": token,
        "expires_in": expires_in
    }, "登录成功")


@router.get("/userinfo", summary="获取用户信息")
async def get_user_info(request: Request):
    """获取当前登录用户信息"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        logger.warning("⚠️ 获取用户信息失败 - 未提供 token")
        return error_response("未登录", code=401)

    user_id = verify_token(token)
    if not user_id:
        logger.warning(f"⚠️ Token 验证失败：token={token[:20]}...")
        return error_response("登录已过期", code=401)

    user = User.get_by_id(int(user_id))
    if not user or user.is_deleted:
        logger.warning(f"⚠️ 用户不存在：user_id={user_id}")
        return error_response("用户不存在", code=404)

    return success_response({
        "user_id": str(user.id),
        "phone": user.phone,
        "nickname": user.nickname,
        "avatar": user.avatar,
        "email": user.email,
        "status": user.status
    })


@router.post("/logout", summary="用户登出")
async def logout(request: Request):
    """用户登出"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if invalidate_token(token):
        logger.info("✅ 用户登出成功")
    else:
        logger.warning(f"⚠️ Token 无效或已过期：token={token[:20]}...")

    return success_response(message="登出成功")


@router.put("/profile", summary="更新个人资料")
async def update_profile(req: dict, request: Request):
    """更新当前登录用户的个人资料（昵称、签名、头像）"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return error_response("未登录", code=401)

    user_id = verify_token(token)
    if not user_id:
        return error_response("登录已过期", code=401)

    user = User.get_by_id(int(user_id))
    if not user or user.is_deleted:
        return error_response("用户不存在", code=404)

    try:
        if req.get('nickname') is not None:
            user.nickname = req.get('nickname')
        if req.get('bio') is not None:
            user.email = req.get('bio')
        if req.get('avatar') is not None:
            user.avatar = req.get('avatar')
        user.save()

        return success_response({
            "user_id": str(user.id),
            "phone": user.phone,
            "nickname": user.nickname,
            "avatar": user.avatar,
            "email": user.email,
            "status": user.status
        }, "资料更新成功")
    except Exception as e:
        logger.error(f"❌ 更新用户资料失败：user_id={user_id}, error={str(e)}", exc_info=True)
        return error_response(f"更新失败：{str(e)}")


@router.post("/avatar", summary="上传头像")
async def upload_avatar(request: Request, file: UploadFile = File(...)):
    """上传头像到本地并返回可访问 URL"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return error_response("未登录", code=401)

    user_id = verify_token(token)
    if not user_id:
        return error_response("登录已过期", code=401)

    if not file.filename:
        return error_response("文件不能为空", code=400)

    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        return error_response("仅支持图片文件", code=400)

    ext = Path(file.filename).suffix.lower() or ".png"
    filename = f"user_{user_id}_{int(time.time())}{ext}"
    avatar_dir = settings.get_tenant_avatar_dir(str(user.tenant_id))
    save_path = avatar_dir / filename

    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        return error_response("图片大小不能超过 2MB", code=400)

    save_path.write_bytes(content)

    return success_response({
        "url": f"/api/v1/auth/avatar/{filename}"
    }, "上传成功")


@router.get("/avatar/{filename}", summary="获取头像文件")
async def get_avatar(filename: str, tenant_id: str = "1"):
    """返回头像文件"""
    from fastapi.responses import FileResponse

    # 从文件名解析 tenant_id（格式：user_{tenant_id}_{timestamp}.ext）
    parts = filename.split('_')
    if len(parts) >= 2:
        extracted_tenant_id = parts[1]
    else:
        extracted_tenant_id = tenant_id
    
    avatar_dir = settings.get_tenant_avatar_dir(extracted_tenant_id)
    file_path = avatar_dir / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="头像不存在")

    return FileResponse(file_path)
