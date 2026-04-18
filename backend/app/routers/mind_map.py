#!/usr/bin/env python3
"""
知识图谱路由（基于思维导图交互）
使用 MindMapNode 表存储知识图谱数据，支持四级层级和三类关系
"""
from fastapi import APIRouter, HTTPException, Query, Request

from ..db import UserNodeProgress
from ..schemas import mind_map as schemas
from ..services import mind_map_service as service
from ..services.graph_cache import get_graph_cache
from ..services.graph_vector_service import get_graph_vector_service
from ..utils.api_response import success_response, error_response
from ..utils.chat import chat_with_llm
from ..utils.token import verify_token

router = APIRouter()


@router.get("/tree")
async def get_mind_map_tree(
    root_id: str = Query(default="root", description="根节点 ID")
):
    """
    获取完整的思维导图树形结构
    
    返回从指定根节点开始的完整树形结构，用于前端渲染思维导图
    """
    tree = service.MindMapService.get_tree(root_id=root_id)
    
    if not tree:
        raise HTTPException(status_code=404, detail="根节点不存在")
    
    return success_response(tree)


@router.get("/node/{node_id}")
async def get_node(node_id: str):
    """
    获取单个节点详情
    
    返回指定节点的完整信息
    """
    node = service.MindMapService.get_node(node_id)
    
    if not node:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    return success_response(node.to_dict())


@router.get("/node/{node_id}/children")
async def get_node_children(node_id: str):
    """
    获取节点的所有子节点
    
    返回指定节点的所有直接子节点，用于懒加载展开
    """
    # 检查节点是否存在
    node = service.MindMapService.get_node(node_id)
    if not node:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    children = service.MindMapService.get_children(node_id)
    
    return success_response({
        "node_id": node_id,
        "children": children
    })


@router.get("/node/{node_id}/path")
async def get_node_path(node_id: str):
    """
    获取从根节点到当前节点的路径
    
    返回完整的祖先节点链，用于面包屑导航
    """
    path = service.MindMapService.get_node_path(node_id)
    
    if not path:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    return success_response(path)


@router.get("/node/{node_id}/questions")
async def get_node_questions(node_id: str):
    """
    获取节点的推荐问题
    
    根据节点类型（叶子/非叶子）返回不同的预设问题
    """
    node = service.MindMapService.get_node(node_id)
    if not node:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    questions = service.MindMapService.get_suggested_questions(node_id)
    
    return success_response(questions)


@router.post("/node")
async def create_node(node_data: schemas.CreateNodeRequest):
    """
    创建新节点
    
    用于动态添加新的知识节点
    """
    node = service.MindMapService.create_node(node_data.model_dump())
    
    if not node:
        raise HTTPException(status_code=500, detail="创建节点失败")
    
    return success_response(node.to_dict(), "节点创建成功")


@router.put("/node/{node_id}")
async def update_node(node_id: str, node_data: schemas.UpdateNodeRequest):
    """
    更新节点信息
    
    用于修改节点的标题、描述等属性
    """
    # 检查节点是否存在
    node = service.MindMapService.get_node(node_id)
    if not node:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    # 更新节点
    update_data = node_data.model_dump(exclude_unset=True)
    success = service.MindMapService.update_node(node_id, update_data)
    
    if not success:
        raise HTTPException(status_code=500, detail="更新节点失败")
    
    # 返回更新后的节点
    updated_node = service.MindMapService.get_node(node_id)
    
    return success_response(updated_node.to_dict(), "节点更新成功")


@router.delete("/node/{node_id}")
async def delete_node(
    node_id: str,
    cascade: bool = Query(default=False, description="是否级联删除子节点")
):
    """
    删除节点
    
    Args:
        node_id: 节点 ID
        cascade: 是否级联删除所有子节点
    """
    # 检查节点是否存在
    node = service.MindMapService.get_node(node_id)
    if not node:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    success = service.MindMapService.delete_node(node_id, cascade=cascade)
    
    if not success:
        raise HTTPException(status_code=500, detail="删除节点失败")
    
    return success_response({"node_id": node_id}, "节点删除成功")


@router.get("/search")
async def search_nodes(
    keyword: str = Query(..., description="搜索关键词"),
    limit: int = Query(default=20, description="返回结果数量")
):
    """
    语义搜索节点（向量检索）
    
    根据关键词在向量库中搜索匹配的节点
    """
    try:
        vector_service = get_graph_vector_service()
        results = vector_service.search_nodes(keyword, top_k=limit)
        
        # 转换格式以适配前端
        nodes_data = []
        for res in results:
            node = service.MindMapService.get_node(res['node_id'])
            if node:
                d = node.to_dict()
                d['similarity'] = res['similarity']
                nodes_data.append(d)
        
        return success_response({
            "keyword": keyword,
            "count": len(nodes_data),
            "nodes": nodes_data
        }, "搜索完成")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索失败：{str(e)}")

@router.post("/vectorize/all")
async def vectorize_all_nodes():
    """
    向量化所有思维导图节点
    """
    try:
        vector_service = get_graph_vector_service()
        result = vector_service.index_all_nodes(kb_id="mind_map_vectors")
        return success_response(result, "向量化完成")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cache/clear")
async def clear_cache():
    """
    清空思维导图缓存
    """
    try:
        cache = get_graph_cache()
        if cache and cache._is_available():
            cache.clear_all_cache()
            return success_response(None, "缓存已清空")
        else:
            raise HTTPException(status_code=503, detail="Redis 服务不可用")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 学习进度 API ====================

@router.get("/progress", summary="获取用户学习进度", tags=["思维导图"])
async def get_user_progress(request: Request):
    """获取当前用户的所有已完成节点 ID（只统计叶子节点）"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="未登录")
    
    user_id = verify_token(token)
    if not user_id:
        return error_response("token 无效", code=401)
    
    try:
        progress_records = UserNodeProgress.select().where(
            (UserNodeProgress.user_id == user_id) & 
            (UserNodeProgress.is_completed == True)
        )
        completed_ids = [record.node_id for record in progress_records]
        
        # 只统计叶子节点
        leaf_nodes = service.MindMapService.get_leaf_nodes()
        total_nodes = leaf_nodes.count()
        
        # 只统计已完成的叶子节点
        leaf_ids = {node.id for node in leaf_nodes}
        completed_leaf_count = len([cid for cid in completed_ids if cid in leaf_ids])
        
        return success_response({
            "completed_ids": completed_ids,
            "total_nodes": total_nodes,
            "completed_count": completed_leaf_count
        }, "获取成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/progress/toggle", summary="切换节点完成状态", tags=["思维导图"])
async def toggle_node_progress(data: dict, request: Request):
    """切换单个节点的完成状态，支持级联逻辑"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="未登录")
    
    user_id = verify_token(token)
    if not user_id:
        return error_response("token 无效", code=401)
    
    node_id = data.get("node_id")
    is_completed = data.get("is_completed", False)
    
    if not node_id:
        raise HTTPException(status_code=400, detail="缺少 node_id")
    
    try:
        # 获取当前所有已完成节点
        progress_records = UserNodeProgress.select().where(
            (UserNodeProgress.user_id == user_id) & 
            (UserNodeProgress.is_completed == True)
        )
        completed_ids = {record.node_id for record in progress_records}
        
        # 更新当前节点
        progress, created = UserNodeProgress.get_or_create(
            user_id=user_id,
            node_id=node_id,
            defaults={"is_completed": is_completed}
        )
        
        if not created:
            progress.is_completed = is_completed
            progress.save()
        
        if is_completed:
            completed_ids.add(node_id)
            # 级联向上：检查父节点是否应该自动完成
            current_node = service.MindMapService.get_node(node_id)
            if current_node and current_node.parent_id:
                parent_id = current_node.parent_id
                # 递归检查父节点
                while parent_id:
                    if service.MindMapService.are_all_siblings_completed(node_id, user_id, completed_ids):
                        # 所有兄弟节点都完成了，自动完成父节点
                        parent_progress, parent_created = UserNodeProgress.get_or_create(
                            user_id=user_id,
                            node_id=parent_id,
                            defaults={"is_completed": True}
                        )
                        if not parent_created:
                            parent_progress.is_completed = True
                            parent_progress.save()
                        completed_ids.add(parent_id)
                        # 继续向上检查
                        parent_node = service.MindMapService.get_node(parent_id)
                        parent_id = parent_node.parent_id if parent_node else None
                    else:
                        break
        else:
            # 取消完成：级联取消所有后代节点
            completed_ids.discard(node_id)
            descendants = service.MindMapService.get_all_descendants(node_id)
            if descendants:
                UserNodeProgress.update(is_completed=False).where(
                    (UserNodeProgress.user_id == user_id) &
                    (UserNodeProgress.node_id.in_(descendants))
                ).execute()
        
        return success_response({"node_id": node_id, "is_completed": is_completed}, "更新成功")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/progress/batch-sync", summary="批量同步进度", tags=["思维导图"])
async def batch_sync_progress(data: dict, request: Request):
    """批量同步进度（从 localStorage 迁移到后端）"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="未登录")
    
    user_id = verify_token(token)
    if not user_id:
        return error_response("token 无效", code=401)
    
    node_ids = data.get("node_ids", [])
    if not isinstance(node_ids, list):
        raise HTTPException(status_code=400, detail="node_ids 必须是数组")
    
    try:
        # 先标记所有现有记录为未完成
        UserNodeProgress.update(is_completed=False).where(
            UserNodeProgress.user_id == user_id
        ).execute()
        
        # 批量插入或更新
        for node_id in node_ids:
            progress, created = UserNodeProgress.get_or_create(
                user_id=user_id,
                node_id=node_id,
                defaults={"is_completed": True}
            )
            if not created:
                progress.is_completed = True
                progress.save()
        
        return success_response({"synced_count": len(node_ids)}, f"已同步 {len(node_ids)} 个节点")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/progress/reset", summary="重置学习进度", tags=["思维导图"])
async def reset_progress(request: Request):
    """重置当前用户的所有学习进度"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="未登录")
    
    user_id = verify_token(token)
    if not user_id:
        return error_response("token 无效", code=401)
    
    try:
        deleted = UserNodeProgress.delete().where(
            UserNodeProgress.user_id == user_id
        ).execute()
        
        return success_response({"deleted_count": deleted}, "进度已重置")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat")
async def chat_with_node(data: schemas.ChatRequest):
    """
    与节点对话
    
    基于节点内容向用户提问，返回 LLM 生成的答案
    上下文包含：父节点路径 + 兄弟节点 + 子节点
    """
    # 获取节点信息
    node = service.MindMapService.get_node(data.node_id)
    if not node:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    # 获取节点路径（用于上下文）
    path = service.MindMapService.get_node_path(data.node_id)
    # path 是字典列表，需要访问字典的 'title' 键
    context_path = " > ".join([n['title'] for n in path]) if path else node.title
    
    # 获取兄弟节点（同级上下文）
    siblings = service.MindMapService.get_siblings(data.node_id)
    siblings_context = ""
    if siblings:
        siblings_titles = [s['title'] for s in siblings]
        siblings_context = f"\n- 同级知识点：{', '.join(siblings_titles)}"
    
    # 获取子节点（下级上下文）
    children = service.MindMapService.get_children_details(data.node_id)
    children_context = ""
    if children:
        children_titles = [c['title'] for c in children]
        children_context = f"\n- 下属知识点：{', '.join(children_titles)}"
    
    # 构建系统提示词（使用知识图谱的丰富字段）
    tags_str = ', '.join(node.to_dict().get('tags', [])) if hasattr(node, 'to_dict') else ''
    content_str = node.to_dict().get('content', '') if hasattr(node, 'to_dict') else ''
    examples_str = '\n'.join(node.to_dict().get('examples', [])) if hasattr(node, 'to_dict') and node.to_dict().get('examples') else ''
    
    system_prompt = f"""你是一个数字逻辑课程辅导助手。当前正在讲解的知识点是：{context_path}

节点信息：
- 标题：{node.title}
- 类型：{'叶子节点（具体知识点）' if node.is_leaf else '章节节点（包含多个子知识点）'}
- 描述：{node.description or '暂无描述'}
- 标签：{tags_str}
- 核心内容：{content_str}
- 示例：{examples_str}
- 知识图谱上下文：{siblings_context}{children_context}

请根据用户的问题，提供清晰、准确、易懂的解答。如果是叶子节点，要提供详细的讲解和实例；如果是章节节点，要从宏观角度概述该章节的内容结构。结合上下文中的相关知识点来解释，帮助用户建立完整的知识体系。"""
    
    try:
        # 调用 LLM API
        answer = await chat_with_llm(
            system_prompt=system_prompt,
            user_question=data.question,
            conversation_id=data.conversation_id
        )
        
        return success_response({
            "answer": answer["answer"],
            "conversation_id": answer["conversation_id"],
            "references": answer.get("references", [])
        }, "回答成功")
    except Exception as e:
        # 如果 LLM 调用失败，返回友好的错误信息
        return {
            "code": 500,
            "message": "LLM 服务不可用",
            "data": {
                "answer": f"抱歉，暂时无法回答这个问题。错误信息：{str(e)}",
                "conversation_id": data.conversation_id or "",
                "references": []
            }
        }
