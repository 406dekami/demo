#!/usr/bin/env python3
"""
Token 管理工具 - 使用数据库持久化
"""
import time
import uuid
from ..db import UserToken


def generate_token(user_id: str, remember_me: bool = False) -> str:
    """生成 token 并存储到数据库
    
    Args:
        user_id: 用户 ID
        remember_me: 是否记住我（30 天有效期，否则 2 小时）
    """
    # 使旧 token 失效（可选，如果需要单点登录）
    UserToken.update(is_active=False).where(
        (UserToken.user_id == user_id) & 
        (UserToken.is_active == True)
    ).execute()
    
    # 生成新 token
    token = f"token_{uuid.uuid4().hex}_{int(time.time())}"
    # 根据 remember_me 设置不同的过期时间
    expires_at = int(time.time()) + (2592000 if remember_me else 7200)  # 30 天或 2 小时
    
    # 存储到数据库
    UserToken.create(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    
    return token


def verify_token(token: str) -> str | None:
    """验证 token（从数据库查询）"""
    try:
        token_data = UserToken.get_or_none(
            (UserToken.token == token) & 
            (UserToken.is_active == True)
        )
        
        if not token_data:
            return None
        
        # 检查是否过期
        if time.time() > token_data.expires_at:
            # 标记为失效
            token_data.is_active = False
            token_data.save()
            return None
        
        return token_data.user_id
    except Exception:
        # 数据库查询失败
        return None


def invalidate_token(token: str) -> bool:
    """使 token 失效（用于登出）"""
    try:
        updated = UserToken.update(is_active=False).where(
            UserToken.token == token
        ).execute()
        return updated > 0
    except Exception:
        return False


def cleanup_expired_tokens():
    """清理过期的 token（定期调用）"""
    try:
        deleted = UserToken.delete().where(
            UserToken.expires_at < int(time.time())
        ).execute()
        return deleted
    except Exception:
        return 0