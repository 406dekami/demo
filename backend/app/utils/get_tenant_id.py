from fastapi import Request, HTTPException
from .token import verify_token


def get_tenant_id(request: Request) -> str:
    """从请求头获取当前登录用户的租户 ID
    
    Args:
        request: FastAPI 请求对象
        
    Returns:
        str: 用户 ID
        
    Raises:
        HTTPException: 当未授权或 token 过期时
    """
    # 从 Authorization header 获取 token
    authorization = request.headers.get("Authorization", "")
    if not authorization:
        raise HTTPException(status_code=401, detail="未授权访问")
    
    # 提取 token (格式：Bearer <token>)
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authorization 格式错误")
    
    token = parts[1]
    
    # 验证 token 并获取用户 ID
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="登录已过期或 token 无效")
    
    return user_id