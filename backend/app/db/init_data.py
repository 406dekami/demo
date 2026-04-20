#!/usr/bin/env python3
"""
数据初始化核心模块
统一管理所有种子数据的初始化和状态检查
"""
import json
import uuid
from typing import Dict, Any

from loguru import logger
from peewee import IntegrityError

from .database import DB
from .models import MindMapNode, KnowledgeNode, KnowledgeRelation
from .neo4j_client import get_neo4j_client


def _load_seed_data() -> Dict[str, Any]:
    """加载种子数据文件"""
    from ..core.config import settings
    
    seed_path = settings.SEEDS_DIR / 'mind_map_data.json'
    
    if not seed_path.exists():
        logger.error(f"❌ 种子数据文件不存在: {seed_path}")
        raise FileNotFoundError(f"种子数据文件不存在: {seed_path}")
    
    try:
        with open(seed_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        nodes = data.get('nodes', [])
        relationships = data.get('relationships', [])
        
        logger.info(f"✅ 成功加载种子数据：{len(nodes)} 个节点，{len(relationships)} 个关系")
        return {'nodes': nodes, 'relationships': relationships}
    except Exception as e:
        logger.error(f"❌ 加载种子数据失败：{e}")
        raise


def _clear_mind_map_nodes():
    """级联删除思维导图节点"""
    def delete_children(parent_id: str):
        children = MindMapNode.select().where(MindMapNode.parent_id == parent_id)
        for child in children:
            delete_children(child.id)
            child.delete_instance()
    
    roots = MindMapNode.select().where(MindMapNode.parent_id.is_null(True))
    for root in roots:
        delete_children(root.id)
        root.delete_instance()


def init_mind_map(force: bool = False) -> Dict[str, Any]:
    """
    初始化思维导图数据
    
    Args:
        force: 是否强制重新初始化（清空现有数据）
    
    Returns:
        初始化结果字典
    """
    result = {
        'success': False,
        'message': '',
        'nodes_count': 0,
        'skipped': False
    }
    
    try:
        # 检查是否已有数据
        existing_count = MindMapNode.select().count()
        
        if existing_count > 0:
            if force:
                logger.info("🗑️  强制模式：清空现有思维导图数据")
                with DB.atomic():
                    _clear_mind_map_nodes()
                logger.info("✅ 已清空旧数据")
            else:
                logger.info(f"💡 MindMapNode 表已有 {existing_count} 个节点，跳过初始化")
                result['success'] = True
                result['message'] = f'已有 {existing_count} 个节点'
                result['skipped'] = True
                return result
        
        # 加载种子数据
        seed_data = _load_seed_data()
        nodes = seed_data['nodes']
        
        # 插入节点
        logger.info(f"📝 正在插入 {len(nodes)} 个思维导图节点...")
        
        with DB.atomic():
            for i, node_data in enumerate(nodes, 1):
                try:
                    MindMapNode.create(
                        id=node_data['id'],
                        parent_id=node_data.get('parent_id'),
                        title=node_data['name'],
                        level=node_data['level'],
                        node_type=node_data['node_type'],
                        description=node_data.get('description', ''),
                        order_index=node_data.get('order_index', 0),
                        is_leaf=node_data.get('is_leaf', False),
                        color=node_data.get('color'),
                        tags=json.dumps(node_data.get('tags', []), ensure_ascii=False) if node_data.get('tags') else None,
                        content=node_data.get('content'),
                        examples=json.dumps(node_data.get('examples', []), ensure_ascii=False) if node_data.get('examples') else None,
                        related_questions=json.dumps(node_data.get('related_questions', []), ensure_ascii=False) if node_data.get('related_questions') else None,
                    )
                except IntegrityError:
                    # 节点已存在，跳过
                    continue
                
                if i % 50 == 0 or i == len(nodes):
                    logger.info(f"   进度：{i}/{len(nodes)}")
        
        result['success'] = True
        result['message'] = f'成功初始化 {len(nodes)} 个节点'
        result['nodes_count'] = len(nodes)
        
        logger.info(f"✅ 思维导图初始化完成：{len(nodes)} 个节点")
        
    except Exception as e:
        logger.error(f"❌ 思维导图初始化失败：{e}")
        import traceback
        traceback.print_exc()
        result['message'] = str(e)
    
    return result


def init_knowledge_graph(force: bool = False) -> Dict[str, Any]:
    """
    初始化知识图谱数据（KnowledgeNode 和 KnowledgeRelation）
    
    Args:
        force: 是否强制重新初始化
    
    Returns:
        初始化结果字典
    """
    result = {
        'success': False,
        'message': '',
        'nodes_count': 0,
        'relations_count': 0,
        'skipped': False
    }
    
    try:
        existing_nodes = KnowledgeNode.select().count()
        existing_rels = KnowledgeRelation.select().count()
        
        if existing_nodes > 0 or existing_rels > 0:
            if force:
                logger.info("🗑️  强制模式：清空知识图谱数据")
                with DB.atomic():
                    KnowledgeRelation.delete().execute()
                    KnowledgeNode.delete().execute()
                logger.info("✅ 已清空旧数据")
            else:
                logger.info(f"💡 知识图谱已有 {existing_nodes} 个节点，{existing_rels} 个关系，跳过初始化")
                result['success'] = True
                result['message'] = f'已有 {existing_nodes} 个节点，{existing_rels} 个关系'
                result['skipped'] = True
                return result
        
        # 加载种子数据
        seed_data = _load_seed_data()
        nodes = seed_data['nodes']
        relationships = seed_data['relationships']
        
        # 插入节点
        logger.info(f"📝 正在插入 {len(nodes)} 个知识节点...")
        
        with DB.atomic():
            for i, node_data in enumerate(nodes, 1):
                try:
                    KnowledgeNode.create(
                        id=node_data['id'],
                        name=node_data['name'],
                        level=node_data['level'],
                        node_type=node_data['node_type'].title(),
                        description=node_data.get('description', ''),
                        parent_id=node_data.get('parent_id'),
                        tags=json.dumps(node_data.get('tags', []), ensure_ascii=False) if node_data.get('tags') else None,
                        content=node_data.get('content'),
                        examples=json.dumps(node_data.get('examples', []), ensure_ascii=False) if node_data.get('examples') else None,
                        related_questions=json.dumps(node_data.get('related_questions', []), ensure_ascii=False) if node_data.get('related_questions') else None,
                        color=node_data.get('color'),
                        is_leaf=1 if node_data.get('is_leaf', False) else 0,
                        order_index=node_data.get('order_index', 0),
                    )
                except IntegrityError:
                    continue
                
                if i % 50 == 0 or i == len(nodes):
                    logger.info(f"   节点进度：{i}/{len(nodes)}")
        
        result['nodes_count'] = len(nodes)
        logger.info(f"✅ KnowledgeNode 初始化完成：{len(nodes)} 个节点")
        
        # 插入关系
        logger.info(f"🔗 正在插入 {len(relationships)} 个知识关系...")
        
        with DB.atomic():
            for i, rel_data in enumerate(relationships, 1):
                try:
                    relation_id = f"R{uuid.uuid4().hex[:8]}"
                    KnowledgeRelation.create(
                        id=relation_id,
                        source_id=rel_data['source_id'],
                        target_id=rel_data['target_id'],
                        relation_type=rel_data['relation_type'].upper(),
                        description=rel_data.get('description', '')
                    )
                except IntegrityError:
                    continue
                
                if i % 50 == 0 or i == len(relationships):
                    logger.info(f"   关系进度：{i}/{len(relationships)}")
        
        result['relations_count'] = len(relationships)
        result['success'] = True
        result['message'] = f'成功初始化 {len(nodes)} 个节点，{len(relationships)} 个关系'
        
        logger.info(f"✅ 知识图谱初始化完成：{len(nodes)} 个节点，{len(relationships)} 个关系")
        
    except Exception as e:
        logger.error(f"❌ 知识图谱初始化失败：{e}")
        import traceback
        traceback.print_exc()
        result['message'] = str(e)
    
    return result


def init_neo4j_graph(force: bool = False) -> Dict[str, Any]:
    """
    初始化 Neo4j 图数据库
    
    Args:
        force: 是否强制重新初始化
    
    Returns:
        初始化结果字典
    """
    result = {
        'success': False,
        'message': '',
        'nodes_count': 0,
        'relations_count': 0,
        'skipped': False
    }
    
    try:
        client = get_neo4j_client()
        if not client:
            logger.warning("⚠️  Neo4j 未配置，跳过图数据库同步")
            result['success'] = True
            result['message'] = 'Neo4j 未配置'
            result['skipped'] = True
            return result
        
        # 检查 Neo4j 是否已有数据
        with client.get_session() as session:
            check_result = session.run("MATCH (n:KnowledgeNode) RETURN count(n) as count")
            existing_count = check_result.single()['count']
            
            if existing_count > 0:
                if force:
                    logger.info("🗑️  强制模式：清空 Neo4j 数据")
                    session.run("MATCH (n) DETACH DELETE n")
                    logger.info("✅ 已清空 Neo4j 旧数据")
                else:
                    logger.info(f"💡 Neo4j 已有 {existing_count} 个节点，跳过初始化")
                    result['success'] = True
                    result['message'] = f'Neo4j 已有 {existing_count} 个节点'
                    result['skipped'] = True
                    return result
        
        # 加载种子数据
        seed_data = _load_seed_data()
        nodes = seed_data['nodes']
        relationships = seed_data['relationships']
        
        logger.info(f"🌐 正在初始化 Neo4j 图数据库...")
        
        with client.get_session() as session:
            # 创建节点
            logger.info(f"   创建 {len(nodes)} 个 Neo4j 节点...")
            for node in nodes:
                session.run("""
                    CREATE (n:KnowledgeNode {
                        id: $id,
                        name: $name,
                        level: $level,
                        node_type: $node_type,
                        description: $description,
                        color: $color,
                        is_leaf: $is_leaf,
                        tags: $tags,
                        content: $content,
                        examples: $examples,
                        related_questions: $related_questions
                    })
                """, {
                    'id': node['id'],
                    'name': node['name'],
                    'level': node['level'],
                    'node_type': node['node_type'].title(),
                    'description': node.get('description', ''),
                    'color': node.get('color', '#ffffff'),
                    'is_leaf': node.get('is_leaf', False),
                    'tags': json.dumps(node.get('tags', []), ensure_ascii=False) if node.get('tags') else '',
                    'content': node.get('content', ''),
                    'examples': json.dumps(node.get('examples', []), ensure_ascii=False) if node.get('examples') else '',
                    'related_questions': json.dumps(node.get('related_questions', []), ensure_ascii=False) if node.get('related_questions') else ''
                })
            
            logger.info(f"   ✅ Neo4j 节点创建完成：{len(nodes)} 个")
            
            # 创建关系
            logger.info(f"   创建 {len(relationships)} 个 Neo4j 关系...")
            for rel in relationships:
                relation_type = rel['relation_type'].upper()
                session.run(f"""
                    MATCH (source:KnowledgeNode {{id: $source_id}})
                    MATCH (target:KnowledgeNode {{id: $target_id}})
                    CREATE (source)-[r:{relation_type} {{
                        description: $description
                    }}]->(target)
                """, {
                    'source_id': rel['source_id'],
                    'target_id': rel['target_id'],
                    'description': rel.get('description', '')
                })
            
            logger.info(f"   ✅ Neo4j 关系创建完成：{len(relationships)} 个")
            
            # 验证
            verify_result = session.run("MATCH (n:KnowledgeNode) RETURN count(n) as node_count")
            node_count = verify_result.single()['node_count']
            
            verify_result = session.run("MATCH ()-[r]->() RETURN count(r) as rel_count")
            rel_count = verify_result.single()['rel_count']
            
            result['success'] = True
            result['message'] = f'Neo4j 初始化完成：{node_count} 个节点，{rel_count} 个关系'
            result['nodes_count'] = node_count
            result['relations_count'] = rel_count
            
            logger.info(f"✅ Neo4j 数据初始化统计: {node_count} 个节点，{rel_count} 个关系")
        
    except Exception as e:
        logger.error(f"❌ Neo4j 初始化失败：{e}")
        import traceback
        traceback.print_exc()
        result['message'] = str(e)
    
    return result


def get_init_status() -> Dict[str, Any]:
    """获取所有模块的初始化状态"""
    try:
        mindmap_count = MindMapNode.select().count()
        kg_nodes = KnowledgeNode.select().count()
        kg_rels = KnowledgeRelation.select().count()
        
        # 检查 Neo4j
        neo4j_count = 0
        neo4j_available = False
        try:
            client = get_neo4j_client()
            if client:
                with client.get_session() as session:
                    result = session.run("MATCH (n:KnowledgeNode) RETURN count(n) as count")
                    neo4j_count = result.single()['count']
                    neo4j_available = True
        except Exception:
            pass
        
        return {
            'mindmap_nodes': mindmap_count,
            'knowledge_nodes': kg_nodes,
            'knowledge_relations': kg_rels,
            'neo4j_available': neo4j_available,
            'neo4j_nodes': neo4j_count,
            'all_initialized': mindmap_count > 0 and kg_nodes > 0
        }
    except Exception as e:
        logger.error(f"获取初始化状态失败：{e}")
        return {
            'mindmap_nodes': 0,
            'knowledge_nodes': 0,
            'knowledge_relations': 0,
            'neo4j_available': False,
            'neo4j_nodes': 0,
            'all_initialized': False,
            'error': str(e)
        }


def auto_init_on_startup():
    """
    应用启动时自动初始化（如果数据为空）
    仅在数据库为空时执行，避免重复初始化
    """
    from ..core.config import settings
    
    if not getattr(settings, 'AUTO_INIT_SEED_DATA', True):
        logger.info("⚙️  自动初始化已禁用（AUTO_INIT_SEED_DATA=false）")
        return
    
    logger.info("📊 检查种子数据初始化状态...")
    
    status = get_init_status()
    
    if status['all_initialized']:
        logger.info(f"✅ 种子数据已初始化（MindMap: {status['mindmap_nodes']} 节点, KG: {status['knowledge_nodes']} 节点）")
        return
    
    logger.info("🔄 开始自动初始化种子数据...")
    
    # 初始化思维导图
    mm_result = init_mind_map(force=False)
    if mm_result['success']:
        logger.info(f"✅ 思维导图: {mm_result['message']}")
    else:
        logger.error(f"❌ 思维导图初始化失败: {mm_result['message']}")
    
    # 初始化知识图谱
    kg_result = init_knowledge_graph(force=False)
    if kg_result['success']:
        logger.info(f"✅ 知识图谱: {kg_result['message']}")
    else:
        logger.error(f"❌ 知识图谱初始化失败: {kg_result['message']}")
    
    # Neo4j 可选
    if status['neo4j_available']:
        neo4j_result = init_neo4j_graph(force=False)
        if neo4j_result['success']:
            logger.info(f"✅ Neo4j: {neo4j_result['message']}")
        else:
            logger.warning(f"⚠️  Neo4j 初始化失败: {neo4j_result['message']}")
    
    logger.info("🎉 种子数据初始化完成")
