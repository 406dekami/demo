#!/usr/bin/env python3
"""
用户认证 API - 登录/注册/登出
"""
import hashlib
from fastapi import APIRouter, HTTPException, Request
import time
import logging
from ..db import User, DB
from ..schemas.auth import RegisterRequest,AuthResponse,LoginRequest,UserInfoResponse,UpdateProfileRequest
from ..utils.token import generate_token, verify_token, invalidate_token

# 获取模块 logger
logger = logging.getLogger(__name__)

router = APIRouter()


# ==================== API 接口 ====================
@router.post("/register", response_model=AuthResponse, summary="用户注册")
async def register(req: RegisterRequest):
    """用户注册"""
    logger.info(f"📝 收到用户注册请求：phone={req.phone}")
    
    # 检查手机号是否已存在
    existing_user = User.select().where(User.phone == req.phone).first()
    if existing_user:
        logger.warning(f"⚠️ 手机号已被注册：phone={req.phone}")
        raise HTTPException(status_code=400, detail="该手机号已被注册")

    try:
        # 创建用户并设置密码
        user = User.create(
            phone=req.phone,
            nickname=f"用户_{req.phone[-4:]}",
            password_hash=hashlib.sha256(req.password.encode()).hexdigest(),
        )
        logger.info(f"✓ 用户创建成功：user_id={user.id}")

        token = generate_token(str(user.id))
        logger.info(f"✅ 用户注册完成：user_id={user.id}, phone={req.phone}")

        return AuthResponse(
            user_id=str(user.id),
            phone=user.phone,
            nickname=user.nickname,
            avatar=user.avatar,
            token=token,
            expires_in=7200
        )
    except Exception as e:
        logger.error(f"❌ 用户注册失败：phone={req.phone}, error={str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"注册失败：{str(e)}")


@router.post("/login", response_model=AuthResponse, summary="用户登录")
async def login(req: LoginRequest):
    """用户登录"""
    logger.info(f"🔑 收到用户登录请求：phone={req.phone}")
    
    user = User.select().where(User.phone == req.phone).first()
    if not user:
        logger.warning(f"⚠️ 登录失败 - 用户不存在：phone={req.phone}")
        raise HTTPException(status_code=401, detail="手机号或密码错误")

    if not user.check_password(req.password):
        logger.warning(f"⚠️ 登录失败 - 密码错误：phone={req.phone}")
        raise HTTPException(status_code=401, detail="手机号或密码错误")

    if user.status != 1:
        logger.warning(f"⚠️ 登录失败 - 账号被禁用：phone={req.phone}, status={user.status}")
        raise HTTPException(status_code=403, detail="账号已被禁用")

    # 更新最后登录时间
    user.last_login_time = int(time.time() * 1000)
    user.save()
    logger.info(f"✓ 更新最后登录时间：user_id={user.id}")

    # 根据是否记住我生成不同有效期的 token
    token = generate_token(str(user.id), req.remember_me)
    expires_in = 2592000 if req.remember_me else 7200  # 30 天或 2 小时
    logger.info(f"✅ 用户登录成功：user_id={user.id}, remember_me={req.remember_me}")

    return AuthResponse(
        user_id=str(user.id),
        phone=user.phone,
        nickname=user.nickname,
        avatar=user.avatar,
        token=token,
        expires_in=expires_in
    )


@router.get("/userinfo", response_model=UserInfoResponse, summary="获取用户信息")
async def get_user_info(request: Request):
    """获取当前登录用户信息"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        logger.warning("⚠️ 获取用户信息失败 - 未提供 token")
        raise HTTPException(status_code=401, detail="未登录")

    logger.info(f"📋 收到获取用户信息请求：token={token[:20]}...")
    
    user_id = verify_token(token)
    if not user_id:
        logger.warning(f"⚠️ Token 验证失败：token={token[:20]}...")
        raise HTTPException(status_code=401, detail="登录已过期")

    user = User.get_by_id(int(user_id))
    if not user or user.is_deleted:
        logger.warning(f"⚠️ 用户不存在：user_id={user_id}")
        raise HTTPException(status_code=404, detail="用户不存在")

    logger.info(f"✅ 获取用户信息成功：user_id={user_id}")
    return UserInfoResponse(
        user_id=str(user.id),
        phone=user.phone,
        nickname=user.nickname,
        avatar=user.avatar,
        email=user.email,
        status=user.status
    )


@router.post("/logout", summary="用户登出")
async def logout(request: Request):
    """用户登出"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    logger.info(f"🚪 收到用户登出请求：token={token[:20]}...")
    
    # 使用数据库方法使 token 失效
    if invalidate_token(token):
        logger.info(f"✅ 用户登出成功")
    else:
        logger.warning(f"⚠️ Token 无效或已过期：token={token[:20]}...")
    
    return {"message": "登出成功"}


@router.put("/profile", response_model=UserInfoResponse, summary="更新个人资料")
async def update_profile(req: UpdateProfileRequest, request: Request):
    """更新当前登录用户的个人资料（昵称、签名、头像）"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        logger.warning("⚠️ 更新资料失败 - 未提供 token")
        raise HTTPException(status_code=401, detail="未登录")

    logger.info(f"📝 收到更新资料请求：token={token[:20]}...")
    
    user_id = verify_token(token)
    if not user_id:
        logger.warning(f"⚠️ Token 验证失败：token={token[:20]}...")
        raise HTTPException(status_code=401, detail="登录已过期")

    user = User.get_by_id(int(user_id))
    if not user or user.is_deleted:
        logger.warning(f"⚠️ 用户不存在：user_id={user_id}")
        raise HTTPException(status_code=404, detail="用户不存在")

    try:
        # 更新字段（只更新提供的字段）
        updated_fields = []
        if req.nickname is not None:
            user.nickname = req.nickname
            updated_fields.append("nickname")
        
        if req.bio is not None:
            # bio 存储在 email 字段中（临时方案，后续可添加 bio 字段到数据库）
            user.email = req.bio
            updated_fields.append("bio")
        
        if req.avatar is not None:
            user.avatar = req.avatar
            updated_fields.append("avatar")
        
        if updated_fields:
            user.save()
            logger.info(f"✅ 用户资料更新成功：user_id={user_id}, fields={updated_fields}")
        else:
            logger.info(f"ℹ️ 无字段需要更新：user_id={user_id}")

        return UserInfoResponse(
            user_id=str(user.id),
            phone=user.phone,
            nickname=user.nickname,
            avatar=user.avatar,
            email=user.email,
            status=user.status
        )
    except Exception as e:
        logger.error(f"❌ 更新用户资料失败：user_id={user_id}, error={str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"更新失败：{str(e)}")
