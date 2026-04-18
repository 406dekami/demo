from fastapi import Request, HTTPException

from .token import verify_token


def get_tenant_id(request: Request, allow_query_token: bool = False) -> str:
    """从请求头获取当前登录用户的租户 ID
    
    Args:
        request: FastAPI 请求对象
        allow_query_token: 是否允许从 URL 查询参数读取 token（用于 iframe/embed 场景）
        
    Returns:
        str: 用户 ID
        
    Raises:
        HTTPException: 当未授权或 token 过期时
    """
    # 从 Authorization header 获取 token
    authorization = request.headers.get("Authorization", "")
    token = None
    
    if authorization:
        # 提取 token (格式：Bearer <token>)
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
    
    # 如果 header 中没有 token，且允许查询参数，则尝试从 URL 获取
    if not token and allow_query_token:
        token = request.query_params.get("token")
    
    if not token:
        raise HTTPException(status_code=401, detail="未授权访问")
    
    # 验证 token 并获取用户 ID
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="登录已过期或 token 无效")
    
    return user_id