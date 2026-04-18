#!/usr/bin/env python3
"""
用户认证相关模型
"""
import bcrypt
import hashlib
from peewee import CharField, IntegerField, BooleanField, BigIntegerField
from .base import BaseModel


class User(BaseModel):
    """用户表"""
    phone = CharField(max_length=11, unique=True, index=True, help_text="手机号（账号）")
    password_hash = CharField(max_length=255, help_text="密码哈希")
    nickname = CharField(max_length=64, null=True, help_text="昵称")
    avatar = CharField(max_length=255, null=True, help_text="头像 URL")
    email = CharField(max_length=128, null=True, help_text="邮箱")
    status = IntegerField(default=1, help_text="状态：0-禁用 1-正常")
    last_login_time = BigIntegerField(null=True, help_text="最后登录时间戳")
    last_login_ip = CharField(max_length=32, null=True, help_text="最后登录 IP")

    class Meta:
        table_name = "user"
        indexes = (
            (("phone",), True),
        )

    def __str__(self):
        return f"{self.phone}"

    def set_password(self, password: str):
        """设置密码（bcrypt）"""
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password: str) -> bool:
        """验证密码，兼容历史 SHA256 数据"""
        # 如果是 bcrypt 哈希（以 $2b$ 或 $2a$ 开头）
        if self.password_hash.startswith(("$2b$", "$2a$")):
            return bcrypt.checkpw(
                password.encode('utf-8'),
                self.password_hash.encode('utf-8')
            )

        # 兼容旧版 SHA256 哈希，验证通过后自动升级为 bcrypt
        import hashlib
        legacy_hash = hashlib.sha256(password.encode()).hexdigest()
        if self.password_hash == legacy_hash:
            self.set_password(password)
            self.save()
            return True

        return False

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
            (("token",), True),
            (("user_id", "is_active"), False),
        )

    def __str__(self):
        return f"Token for user {self.user_id}"
