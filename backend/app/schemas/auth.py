from pydantic import BaseModel, Field, field_validator
# ==================== 请求/响应模型 ====================
class RegisterRequest(BaseModel):
    """注册请求"""
    phone: str = Field(..., max_length=11, min_length=11, description="手机号")
    password: str = Field(..., min_length=6, max_length=32, description="密码")
    confirm_password: str = Field(..., description="确认密码")

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        """验证两次密码是否一致"""
        password = info.data.get('password')
        if password and v != password:
            raise ValueError('两次输入的密码不一致')
        return v

    @field_validator('phone')
    @classmethod
    def phone_valid(cls, v):
        """验证手机号格式"""
        if not v.startswith('1') or not v.isdigit():
            raise ValueError('请输入有效的手机号')
        return v



class LoginRequest(BaseModel):
    """登录请求"""
    phone: str = Field(..., max_length=11, min_length=11, description="手机号")
    password: str = Field(..., description="密码")
    remember_me: bool = Field(default=False, description="是否记住我（30 天有效期）")


class AuthResponse(BaseModel):
    """认证响应"""
    user_id: str
    phone: str
    nickname: str | None
    avatar: str | None
    token: str
    expires_in: int = 7200


class UserInfoResponse(BaseModel):
    """用户信息响应"""
    user_id: str
    phone: str
    nickname: str | None
    avatar: str | None
    email: str | None
    status: int

