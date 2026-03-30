#!/usr/bin/env python3
"""
用户认证相关模型
"""
import hashlib
from peewee import CharField, IntegerField, BooleanField, BigIntegerField
from .base import BaseModel


class User(BaseModel):
    """用户表"""
    phone = CharField(max_length=11, unique=True, index=True, help_text="手机号（账号）")
    password_hash = CharField(max_length=64, help_text="密码哈希（SHA256）")
    nickname = CharField(max_length=64, null=True, help_text="昵称")
    avatar = CharField(max_length=255, null=True, help_text="头像 URL")
    email = CharField(max_length=128, null=True, help_text="邮箱")
    status = IntegerField(default=1, help_text="状态：0-禁用 1-正常")
    last_login_time = BigIntegerField(null=True, help_text="最后登录时间戳")
    last_login_ip = CharField(max_length=32, null=True, help_text="最后登录 IP")

    class Meta:
        table_name = "user"
        indexes = (
            (("phone",), True),  # 手机号唯一
        )

    def __str__(self):
        return f"{self.phone}"

    def set_password(self, password: str):
        """设置密码（哈希）"""
        self.password_hash = hashlib.sha256(password.encode()).hexdigest()

    def check_password(self, password: str) -> bool:
        """验证密码"""
        return self.password_hash == hashlib.sha256(password.encode()).hexdigest()

    def to_dict(self, exclude_password: bool = True):
        """转字典（默认排除密码）"""
        data = super().to_dict()
        if exclude_password:
            data.pop("password_hash", None)
        return data


class UserToken(BaseModel):
    """用户 Token 表（用于持久化登录状态）"""
    user_id = CharField(max_length=32, index=True, help_text="用户 ID")
    token = CharField(max_length=128, unique=True, index=True, help_text="Token 值")
    expires_at = BigIntegerField(help_text="过期时间戳")
    is_active = BooleanField(default=True, index=True, help_text="是否有效")

    class Meta:
        table_name = "user_token"
        indexes = (
            (("token",), True),  # token 唯一
            (("user_id", "is_active"), False),  # 按用户查询有效 token
        )

    def __str__(self):
        return f"Token for user {self.user_id}"
