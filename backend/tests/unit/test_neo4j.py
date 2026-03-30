#!/usr/bin/env python3
"""
测试 Neo4j 连接脚本
"""
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../..'))

from app.db.neo4j_client import Neo4jClient
from app.db.graph_service import GraphService
from loguru import logger


def test_neo4j_connection():
    """测试 Neo4j 连接"""
    print("\n" + "="*60)
    print("🧪 测试 Neo4j 连接")
    print("="*60 + "\n")
    
    try:
        # 1. 测试客户端初始化
        print("1️⃣  创建 Neo4j 客户端...")
        client = Neo4jClient()
        print("✅ 客户端创建成功")
        
        # 2. 测试连接
        print("\n2️⃣  测试连接...")
        client.verify_connectivity()
        print("✅ 连接验证成功")
        
        # 3. 测试会话
        print("\n3️⃣  测试会话...")
        with client.get_session() as session:
            result = session.run("RETURN 'Hello Neo4j' AS greeting")
            record = result.single()
            if record:
                print(f"✅ 查询成功：{record['greeting']}")
            else:
                print("❌ 查询失败")
        
        # 4. 测试 GraphService
        print("\n4️⃣  测试 GraphService...")
        with GraphService() as service:
            # 创建测试用户
            user_id = "test_user_001"
            user_data = {
                'id': user_id,
                'username': 'testuser',
                'email': 'test@example.com'
            }
            
            # 检查用户是否已存在
            existing = service.session.run(
                "MATCH (u:User {id: $id}) RETURN u",
                {'id': user_id}
            ).single()
            
            if not existing:
                print(f"   创建测试用户：{user_id}")
                service.create_knowledge_base({
                    'id': 'test_kb_001',
                    'name': '测试知识库',
                    'description': '用于测试的知识库'
                })
                
                service.create_document({
                    'id': 'test_doc_001',
                    'title': '测试文档.txt',
                    'file_type': 'txt',
                    'file_path': '/test/test_doc.txt',
                    'file_size': 1024,
                    'kb_id': 'test_kb_001'
                })
                
                service.create_chunk({
                    'id': 'test_chunk_001',
                    'content': '这是测试文本切片内容',
                    'chunk_index': 0,
                    'doc_id': 'test_doc_001'
                })
                
                service.create_notebook({
                    'id': 'test_notebook_001',
                    'title': '测试笔记本',
                    'description': '用于测试的笔记本',
                    'user_id': user_id
                })
                
                # 建立关系
                service.link_notebook_to_knowledge_base('test_notebook_001', 'test_kb_001')
                
                print("✅ 创建测试数据成功")
            else:
                print("ℹ️  测试数据已存在，跳过创建")
            
            # 查询图谱
            print("\n5️⃣  查询知识图谱...")
            graph = service.get_knowledge_graph('test_notebook_001', depth=3)
            print(f"   📊 节点数量：{len(graph['nodes'])}")
            print(f"   🔗 关系数量：{len(graph['relationships'])}")
            
            # 显示节点类型
            node_types = {}
            for node in graph['nodes']:
                labels = node.get('labels', [])
                for label in labels:
                    node_types[label] = node_types.get(label, 0) + 1
            
            print(f"   📋 节点类型分布：{node_types}")
            
            # 显示关系类型
            rel_types = {}
            for rel in graph['relationships']:
                rel_type = rel['type']
                rel_types[rel_type] = rel_types.get(rel_type, 0) + 1
            
            print(f"   🔗 关系类型分布：{rel_types}")
        
        print("\n" + "="*60)
        print("✅ 所有测试通过！Neo4j 工作正常")
        print("="*60 + "\n")
        return True
        
    except Exception as e:
        print(f"\n❌ 测试失败：{e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # 清理测试数据（自动清理，不需要用户输入）
        print("\n🗑️  清理测试数据...")
        try:
            with GraphService() as service:
                service.delete_notebook('test_notebook_001')
                service.delete_knowledge_base('test_kb_001')
                service.delete_document('test_doc_001')
                # 注意：Chunk 会在删除 Document 时自动删除
            print("✅ 测试数据已清理")
        except Exception as cleanup_error:
            print(f"⚠️  清理失败：{cleanup_error}")


if __name__ == "__main__":
    success = test_neo4j_connection()
    sys.exit(0 if success else 1)
