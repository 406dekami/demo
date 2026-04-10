#!/usr/bin/env python3
"""
初始化知识图谱数据（融合版）
从 JSON 文件读取思维导图内容，同步到知识图谱系统
支持四级知识层级和三类核心关系
"""
import json
import sys
import uuid
from pathlib import Path

# 添加项目根目录到 Python 路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.database import DB
from app.db.models import KnowledgeNode, KnowledgeRelation, MindMapNode
from app.db.neo4j_client import get_neo4j_client
from loguru import logger


def load_json_data(json_path: str) -> dict:
    """从 JSON 文件加载数据"""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        logger.info(f"✅ 成功加载 JSON 数据：{len(data.get('nodes', []))} 个节点，{len(data.get('relationships', []))} 个关系")
        return data
    except Exception as e:
        logger.error(f"❌ 加载 JSON 失败：{e}")
        raise


def init_mind_map_nodes(nodes: list) -> bool:
    """初始化 MindMapNode 表（思维导图用）"""
    try:
        with DB.atomic():
            existing_count = MindMapNode.select().count()
            if existing_count > 0:
                logger.warning(f"⚠️  MindMapNode 表中已有 {existing_count} 个节点")
                print(f"\n⚠️  MindMapNode 表中已有 {existing_count} 个节点")
                action = input("是否清空并重新初始化？(y/N): ").strip().lower()
                if action == 'y':
                    # 级联删除
                    def delete_children(parent_id: str):
                        children = MindMapNode.select().where(MindMapNode.parent_id == parent_id)
                        for child in children:
                            delete_children(child.id)
                            child.delete_instance()
                    roots = MindMapNode.select().where(MindMapNode.parent_id.is_null(True))
                    for root in roots:
                        delete_children(root.id)
                        root.delete_instance()
                    logger.info("🗑️  已清空 MindMapNode 旧数据")
                    print("✅ 已清空 MindMapNode 旧数据\n")
                else:
                    logger.info("💡 跳过 MindMapNode 初始化")
                    print("💡 跳过 MindMapNode 初始化\n")
                    return True
            
            # 插入节点（JSON 用 name，MindMapNode 需要 title）
            print(f"📝 正在插入 {len(nodes)} 个思维导图节点...")
            for i, node_data in enumerate(nodes, 1):
                import json as json_module
                MindMapNode.create(
                    id=node_data['id'],
                    parent_id=node_data.get('parent_id'),
                    title=node_data['name'],  # JSON 的 name -> MindMapNode 的 title
                    level=node_data['level'],
                    node_type=node_data['node_type'],
                    description=node_data.get('description', ''),
                    order_index=node_data.get('order_index', 0),
                    is_leaf=node_data.get('is_leaf', False),
                    color=node_data.get('color'),
                    # 知识图谱增强字段
                    tags=json_module.dumps(node_data.get('tags', []), ensure_ascii=False) if node_data.get('tags') else None,
                    content=node_data.get('content'),
                    examples=json_module.dumps(node_data.get('examples', []), ensure_ascii=False) if node_data.get('examples') else None,
                    related_questions=json_module.dumps(node_data.get('related_questions', []), ensure_ascii=False) if node_data.get('related_questions') else None,
                )
                if i % 20 == 0 or i == len(nodes):
                    print(f"   进度：{i}/{len(nodes)}")
            
            logger.info(f"✅ MindMapNode 初始化完成：{len(nodes)} 个节点")
            print(f"✅ 思维导图节点插入完成：{len(nodes)} 个\n")
            return True
    except Exception as e:
        logger.error(f"❌ MindMapNode 初始化失败：{e}")
        import traceback
        traceback.print_exc()
        return False


def init_knowledge_graph(nodes: list, relationships: list) -> bool:
    """初始化 KnowledgeNode/KnowledgeRelation 表（知识图谱用）"""
    try:
        with DB.atomic():
            existing_nodes = KnowledgeNode.select().count()
            existing_rels = KnowledgeRelation.select().count()
            
            if existing_nodes > 0 or existing_rels > 0:
                logger.warning(f"⚠️  知识图谱表中已有 {existing_nodes} 个节点，{existing_rels} 个关系")
                print(f"\n⚠️  检测到已有数据：{existing_nodes} 个节点，{existing_rels} 个关系")
                # 自动清空
                print("🗑️  自动清空旧数据...")
                KnowledgeRelation.delete().execute()
                KnowledgeNode.delete().execute()
                logger.info("🗑️  已清空知识图谱旧数据")
                print("✅ 已清空旧数据\n")
            
            # 插入节点
            print(f"📝 正在插入 {len(nodes)} 个知识节点...")
            for i, node_data in enumerate(nodes, 1):
                import json as json_module
                KnowledgeNode.create(
                    id=node_data['id'],
                    name=node_data['name'],
                    level=node_data['level'],
                    node_type=node_data['node_type'].title(),  # course -> Course
                    description=node_data.get('description', ''),
                    parent_id=node_data.get('parent_id'),
                    # 思维导图增强字段
                    tags=json_module.dumps(node_data.get('tags', []), ensure_ascii=False) if node_data.get('tags') else None,
                    content=node_data.get('content'),
                    examples=json_module.dumps(node_data.get('examples', []), ensure_ascii=False) if node_data.get('examples') else None,
                    related_questions=json_module.dumps(node_data.get('related_questions', []), ensure_ascii=False) if node_data.get('related_questions') else None,
                    color=node_data.get('color'),
                    is_leaf=1 if node_data.get('is_leaf', False) else 0,
                    order_index=node_data.get('order_index', 0),
                )
                if i % 20 == 0 or i == len(nodes):
                    print(f"   进度：{i}/{len(nodes)}")
            
            logger.info(f"✅ KnowledgeNode 初始化完成：{len(nodes)} 个节点")
            print(f"✅ 节点插入完成：{len(nodes)} 个\n")
            
            # 插入关系
            print(f"🔗 正在插入 {len(relationships)} 个知识关系...")
            for i, rel_data in enumerate(relationships, 1):
                relation_id = f"R{uuid.uuid4().hex[:8]}"
                KnowledgeRelation.create(
                    id=relation_id,
                    source_id=rel_data['source_id'],
                    target_id=rel_data['target_id'],
                    relation_type=rel_data['relation_type'].upper(),
                    description=rel_data.get('description', '')
                )
                if i % 20 == 0 or i == len(relationships):
                    print(f"   进度：{i}/{len(relationships)}")
            
            logger.info(f"✅ KnowledgeRelation 初始化完成：{len(relationships)} 个关系")
            print(f"✅ 关系插入完成：{len(relationships)} 个\n")
            
            # 统计信息
            print("="*60)
            print("📊 SQLite 知识图谱数据统计:")
            print("="*60)
            
            node_type_names = {
                'Course': '课程',
                'Chapter': '章节',
                'Section': '小节',
                'Concept': '概念',
                'Principle': '原理',
                'Circuit': '电路',
                'Application': '应用'
            }
            
            for node_type in ['Course', 'Chapter', 'Section', 'Concept', 'Principle', 'Circuit', 'Application']:
                count = KnowledgeNode.select().where(KnowledgeNode.node_type == node_type).count()
                if count > 0:
                    print(f"  - {node_type_names.get(node_type, node_type)} ({node_type}): {count} 个")
            
            rel_type_names = {
                'CONTAINS': '包含关系',
                'PREREQUISITE': '先修关系',
                'DERIVES': '衍生关系'
            }
            
            print()
            for rel_type in ['CONTAINS', 'PREREQUISITE', 'DERIVES']:
                count = KnowledgeRelation.select().where(KnowledgeRelation.relation_type == rel_type).count()
                print(f"  - {rel_type_names.get(rel_type, rel_type)} ({rel_type}): {count} 条")
            
            print("="*60 + "\n")
            
            return True
    except Exception as e:
        logger.error(f"❌ 知识图谱初始化失败：{e}")
        import traceback
        traceback.print_exc()
        return False


def init_neo4j(nodes: list, relationships: list) -> bool:
    """初始化 Neo4j 图数据库"""
    try:
        client = get_neo4j_client()
        if not client:
            logger.warning("⚠️  Neo4j 未初始化，跳过图数据库同步")
            print("⚠️  Neo4j 未初始化，跳过图数据库同步\n")
            return True
        
        print("🌐 正在初始化 Neo4j 图数据库...")
        
        with client.get_session() as session:
            # 清空旧数据
            print("   清空 Neo4j 旧数据...")
            session.run("MATCH (n) DETACH DELETE n")
            
            # 批量创建节点
            print(f"   创建 {len(nodes)} 个 Neo4j 节点...")
            for node in nodes:
                import json as json_module
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
                    'tags': json_module.dumps(node.get('tags', []), ensure_ascii=False) if node.get('tags') else '',
                    'content': node.get('content', ''),
                    'examples': json_module.dumps(node.get('examples', []), ensure_ascii=False) if node.get('examples') else '',
                    'related_questions': json_module.dumps(node.get('related_questions', []), ensure_ascii=False) if node.get('related_questions') else ''
                })
            
            print(f"   ✅ Neo4j 节点创建完成：{len(nodes)} 个")
            
            # 批量创建关系
            print(f"   创建 {len(relationships)} 个 Neo4j 关系...")
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
            
            print(f"   ✅ Neo4j 关系创建完成：{len(relationships)} 个")
            
            # 验证数据
            result = session.run("MATCH (n:KnowledgeNode) RETURN count(n) as node_count")
            node_count = result.single()['node_count']
            
            result = session.run("MATCH ()-[r]->() RETURN count(r) as rel_count")
            rel_count = result.single()['rel_count']
            
            print("\n" + "="*60)
            print("📊 Neo4j 数据初始化统计:")
            print("="*60)
            print(f"  - 节点总数：{node_count}")
            print(f"  - 关系总数：{rel_count}")
            print("="*60 + "\n")
            
            return True
    except Exception as e:
        logger.error(f"❌ Neo4j 初始化失败：{e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """主函数"""
    print("="*60)
    print("🚀 开始初始化知识图谱数据（融合版）...")
    print("="*60 + "\n")
    
    # 加载 JSON 数据
    json_path = Path(__file__).parent.parent / 'data' / 'seeds' / 'mind_map_data.json'
    logger.info(f"📂 数据文件路径：{json_path}")
    print(f"📂 数据文件：{json_path}\n")
    
    data = load_json_data(str(json_path))
    nodes = data.get('nodes', [])
    relationships = data.get('relationships', [])
    
    # 阶段 1: 初始化 MindMapNode（思维导图用）
    print("="*60)
    print("阶段 1/3：初始化 SQLite 思维导图")
    print("="*60 + "\n")
    mindmap_success = init_mind_map_nodes(nodes)
    
    if not mindmap_success:
        logger.error("❌ MindMapNode 初始化失败，中止流程")
        print("\n❌ MindMapNode 初始化失败！")
        return
    
    # 阶段 2: 初始化 KnowledgeNode/KnowledgeRelation（知识图谱用）
    print("="*60)
    print("阶段 2/3：初始化 SQLite 知识图谱")
    print("="*60 + "\n")
    kg_success = init_knowledge_graph(nodes, relationships)
    
    if not kg_success:
        logger.error("❌ 知识图谱初始化失败，中止流程")
        print("\n❌ 知识图谱初始化失败！")
        return
    
    # 阶段 3: 初始化 Neo4j
    print("="*60)
    print("阶段 3/3：初始化 Neo4j 图数据库")
    print("="*60 + "\n")
    neo4j_success = init_neo4j(nodes, relationships)
    
    # 最终结果
    print("\n" + "="*60)
    if mindmap_success and kg_success:
        print("🎉 知识图谱数据初始化完成！")
        print("\n✨ 功能特性:")
        print("  ✓ 四级知识层级：课程 → 章节 → 小节 → 知识点")
        print("  ✓ 七类节点类型：Course/Chapter/Section/Concept/Principle/Circuit/Application")
        print("  ✓ 三类核心关系：包含(CONTAINS)、先修(PREREQUISITE)、衍生(DERIVES)")
        print("  ✓ SQLite MindMapNode：支持思维导图渲染和展开/收起交互")
        print("  ✓ SQLite KnowledgeNode/Relation：支持知识图谱可视化和 RAG 问答")
        print("  ✓ Neo4j 图数据库：支持图遍历和关系查询")
        print("  ✓ 向量检索：支持语义搜索（需运行 POST /api/v1/knowledge-graph/vectorize/all）")
        print("  ✓ RAG 问答：基于节点上下文生成解答")
    else:
        print("💥 知识图谱数据初始化部分失败！")
        if not mindmap_success:
            print("  ❌ MindMapNode 初始化失败")
        if not kg_success:
            print("  ❌ KnowledgeNode 初始化失败")
        if not neo4j_success:
            print("  ⚠️  Neo4j 初始化失败（可后续重试）")
    print("="*60)


if __name__ == "__main__":
    main()
