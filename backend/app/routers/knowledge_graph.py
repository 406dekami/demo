#!/usr/bin/env python3
"""
知识图谱 API 路由
独立于 Notebook/KnowledgeBase 系统
"""
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, HTTPException, Query
from loguru import logger

from ..schemas.knowledge_graph import NodeCreateSchema, NodeUpdateSchema, RelationCreateSchema
from ..services.knowledge_graph_service import KnowledgeGraphService

router = APIRouter(tags=["知识图谱"])


# ==================== API 接口 ====================

@router.get("/nodes", response_model=List[Dict[str, Any]])
async def get_all_nodes():
    """
    获取所有知识节点
    
    返回完整的节点列表，按层级和名称排序
    """
    try:
        nodes = KnowledgeGraphService.get_all_nodes()
        return nodes
    except Exception as e:
        logger.error(f"获取节点列表失败：{e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nodes/{node_id}", response_model=Dict[str, Any])
async def get_node(node_id: str):
    """
    获取单个节点详情
    
    Args:
        node_id: 节点 ID
    """
    try:
        node = KnowledgeGraphService.get_node(node_id)
        if not node:
            raise HTTPException(status_code=404, detail="节点不存在")
        return node
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取节点失败：{e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/nodes", status_code=201)
async def create_node(node_data: NodeCreateSchema):
    """
    创建知识节点
    
    Args:
        node_data: 节点数据
    """
    try:
        # 检查节点是否已存在
        existing = KnowledgeGraphService.get_node(node_data.id)
        if existing:
            raise HTTPException(status_code=400, detail="节点已存在")
        
        node_id = KnowledgeGraphService.create_node(node_data.dict())
        logger.info(f"✅ 创建节点成功：{node_data.name} ({node_id})")
        
        return {
            "id": node_id,
            "message": "节点创建成功",
            "data": KnowledgeGraphService.get_node(node_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建节点失败：{e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/nodes/{node_id}")
async def update_node(node_id: str, updates: NodeUpdateSchema):
    """
    更新知识节点
    
    Args:
        node_id: 节点 ID
        updates: 更新数据
    """
    try:
        # 检查节点是否存在
        existing = KnowledgeGraphService.get_node(node_id)
        if not existing:
            raise HTTPException(status_code=404, detail="节点不存在")
        
        # 过滤空值
        update_data = {k: v for k, v in updates.dict(exclude_unset=True).items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="没有提供更新数据")
        
        KnowledgeGraphService.update_node(node_id, update_data)
        logger.info(f"✏️  更新节点成功：{node_id}")
        
        return {
            "message": "节点更新成功",
            "data": KnowledgeGraphService.get_node(node_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新节点失败：{e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/nodes/{node_id}")
async def delete_node(node_id: str):
    """
    删除知识节点（包括相关关系）
    
    Args:
        node_id: 节点 ID
    """
    try:
        # 检查节点是否存在
        existing = KnowledgeGraphService.get_node(node_id)
        if not existing:
            raise HTTPException(status_code=404, detail="节点不存在")
        
        success = KnowledgeGraphService.delete_node(node_id)
        if success:
            return {"message": "节点删除成功"}
        else:
            raise HTTPException(status_code=500, detail="删除失败")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除节点失败：{e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/relations", status_code=201)
async def create_relation(relation_data: RelationCreateSchema):
    """
    创建知识关系
    
    Args:
        relation_data: 关系数据
    """
    try:
        # 检查节点是否存在
        source = KnowledgeGraphService.get_node(relation_data.source_id)
        target = KnowledgeGraphService.get_node(relation_data.target_id)
        
        if not source or not target:
            raise HTTPException(status_code=404, detail="源节点或目标节点不存在")
        
        # 检查关系是否已存在
        existing_relations = KnowledgeGraphService.get_relations(relation_data.source_id)
        for rel in existing_relations:
            if (rel['target_id'] == relation_data.target_id and 
                rel['relation_type'] == relation_data.relation_type):
                raise HTTPException(status_code=400, detail="关系已存在")
        
        relation_id = KnowledgeGraphService.create_relation(
            relation_data.source_id,
            relation_data.target_id,
            relation_data.relation_type,
            relation_data.description
        )
        
        logger.info(f"✅ 创建关系成功：{relation_id}")
        
        return {
            "id": relation_id,
            "message": "关系创建成功",
            "data": KnowledgeGraphService.get_relations(relation_data.source_id)[-1]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建关系失败：{e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/relations", response_model=List[Dict[str, Any]])
async def get_relations(node_id: Optional[str] = Query(None, description="节点 ID，用于过滤关系")):
    """
    获取知识关系列表
    
    Args:
        node_id: 可选，只返回与该节点相关的关系
    """
    try:
        relations = KnowledgeGraphService.get_relations(node_id)
        return relations
    except Exception as e:
        logger.error(f"获取关系列表失败：{e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/relations/{relation_id}")
async def delete_relation(relation_id: str):
    """
    删除知识关系
    
    Args:
        relation_id: 关系 ID
    """
    try:
        # 检查关系是否存在
        existing_relations = KnowledgeGraphService.get_relations()
        relation_exists = any(rel['id'] == relation_id for rel in existing_relations)
        
        if not relation_exists:
            raise HTTPException(status_code=404, detail="关系不存在")
        
        success = KnowledgeGraphService.delete_relation(relation_id)
        if success:
            return {"message": "关系删除成功"}
        else:
            raise HTTPException(status_code=500, detail="删除失败")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除关系失败：{e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tree", response_model=Dict[str, Any])
async def get_tree(root_id: str = Query("N001", description="根节点 ID")):
    """
    获取知识树形结构
    
    Args:
        root_id: 根节点 ID，默认 N001
    """
    try:
        tree = KnowledgeGraphService.get_tree_structure(root_id)
        if not tree:
            raise HTTPException(status_code=404, detail="根节点不存在")
        return tree
    except Exception as e:
        logger.error(f"获取树形结构失败：{e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/visualization", response_model=Dict[str, Any])
async def get_visualization():
    """
    获取 ECharts 可视化数据
    
    返回适合 ECharts Graph 使用的数据格式：
    - nodes: 节点列表（包含位置、大小、分类信息）
    - links: 关系列表（包含源、目标、关系类型）
    - categories: 分类列表（用于图例）
    """
    try:
        data = KnowledgeGraphService.get_visualization_data()
        return data
    except Exception as e:
        logger.error(f"获取可视化数据失败：{e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/path/{node_id}", response_model=List[Dict[str, Any]])
async def get_node_path(
    node_id: str,
    root_id: str = Query("N001", description="根节点 ID")
):
    """
    获取从根节点到指定节点的学习路径
    
    Args:
        node_id: 目标节点 ID
        root_id: 根节点 ID，默认 N001
    """
    try:
        path = KnowledgeGraphService.get_node_path(node_id, root_id)
        if not path:
            raise HTTPException(status_code=404, detail="路径不存在")
        return path
    except Exception as e:
        logger.error(f"获取学习路径失败：{e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vectorize/all")
async def vectorize_all_nodes():
    """
    向量化所有知识节点（用于语义搜索）
    
    将节点的 name 和 description 拼接，生成向量存入 ChromaDB
    """
    try:
        from app.services.graph_vector_service import get_graph_vector_service
        vector_service = get_graph_vector_service()
        
        result = vector_service.index_all_nodes()
        
        logger.info(f"✅ 向量化完成：{result}")
        return {
            "message": "向量化完成",
            "result": result
        }
    except Exception as e:
        logger.error(f"向量化失败：{e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search", response_model=List[Dict[str, Any]])
async def search_nodes(
    query: str = Query(..., description="搜索查询"),
    top_k: int = Query(5, ge=1, le=20, description="返回结果数量")
):
    """
    语义搜索知识节点
    
    使用向量相似度搜索，返回与查询语义最相关的节点
    
    Args:
        query: 搜索查询文本
        top_k: 返回最相关的 K 个节点
    """
    try:
        from app.services.graph_vector_service import get_graph_vector_service
        vector_service = get_graph_vector_service()
        
        results = vector_service.search_nodes(query, top_k=top_k)
        
        return results
    except Exception as e:
        logger.error(f"搜索失败：{e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cache/clear")
async def clear_cache():
    """
    清空知识图谱缓存
    
    当节点数据更新时，需要清空缓存
    """
    try:
        from app.services.graph_cache import get_graph_cache
        cache = get_graph_cache()
        
        if cache:
            cache.clear_all_cache()
            return {"message": "缓存已清空"}
        else:
            raise HTTPException(status_code=503, detail="Redis 服务不可用")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"清空缓存失败：{e}")
        raise HTTPException(status_code=500, detail=str(e))
