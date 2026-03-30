#!/usr/bin/env python3
"""
Neo4j 数据迁移与初始化脚本

功能：
1. 从 SQLite 迁移现有数据到 Neo4j
2. 生成数字逻辑课程相关的测试数据
3. 在 Neo4j 中构建完整的知识图谱
"""
import sys
import os
import json
from datetime import datetime
from typing import List, Dict, Any

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from playhouse.shortcuts import model_to_dict
from app.db.database import get_database
from app.db.models.knowledge import KnowledgeBase, Document, Chunk
from app.db.models.conversation import Conversation, Message
from app.db.models.user import User
from app.db.graph_service import GraphService
from app.db.neo4j_client import Neo4jClient
from loguru import logger


def migrate_existing_data():
    """迁移现有的 SQLite 数据到 Neo4j"""
    print("\n" + "="*60)
    print("🔄 开始迁移现有数据到 Neo4j")
    print("="*60 + "\n")
    
    migrated_count = {
        'knowledge_bases': 0,
        'documents': 0,
        'chunks': 0,
        'notebooks': 0,
        'conversations': 0
    }
    
    try:
        with GraphService() as service:
            # 1. 迁移知识库
            print("📚 迁移知识库...")
            knowledge_bases = KnowledgeBase.select().where(KnowledgeBase.is_deleted == False)
            for kb in knowledge_bases:
                try:
                    # 检查是否已存在
                    existing = service.get_knowledge_base(kb.kb_id)
                    if not existing:
                        service.create_knowledge_base({
                            'id': kb.kb_id,
                            'name': kb.name,
                            'description': kb.description or '',
                            'tenant_id': kb.tenant_id or ''
                        })
                        migrated_count['knowledge_bases'] += 1
                        print(f"   ✅ 创建知识库：{kb.name}")
                    else:
                        print(f"   ℹ️  跳过已存在的知识库：{kb.name}")
                except Exception as e:
                    print(f"   ❌ 迁移知识库失败：{kb.name}, 错误：{e}")
            
            # 2. 迁移文档
            print("\n📄 迁移文档...")
            documents = Document.select().where(Document.is_deleted == False)
            for doc in documents:
                try:
                    existing = service.get_document(doc.id)
                    if not existing:
                        service.create_document({
                            'id': doc.id,
                            'title': doc.name,
                            'file_type': doc.file_type,
                            'file_path': doc.file_path,
                            'file_size': doc.file_size,
                            'kb_id': doc.kb_id
                        })
                        migrated_count['documents'] += 1
                        print(f"   ✅ 创建文档：{doc.name}")
                    else:
                        print(f"   ℹ️  跳过已存在的文档：{doc.name}")
                except Exception as e:
                    print(f"   ❌ 迁移文档失败：{doc.name}, 错误：{e}")
            
            # 3. 迁移切片（仅示例，避免数据量过大）
            print("\n✂️  迁移切片（前 100 条）...")
            chunks = Chunk.select().limit(100)
            for chunk in chunks:
                try:
                    service.create_chunk({
                        'id': f"chunk_{chunk.document_id}_{chunk.id}",
                        'content': chunk.content,
                        'chunk_index': 0,  # Chunk 模型没有 index 字段
                        'doc_id': chunk.document_id
                    })
                    migrated_count['chunks'] += 1
                except Exception as e:
                    print(f"   ❌ 迁移切片失败：{chunk.id}, 错误：{e}")
            
            # 4. 迁移笔记本（Conversation 当作 Notebook）
            print("\n📓 迁移笔记本...")
            conversations = Conversation.select().where(Conversation.is_deleted == False)
            for conv in conversations:
                try:
                    # 检查是否已存在
                    existing = service.get_notebook(conv.id)
                    if not existing:
                        service.create_notebook({
                            'id': conv.id,
                            'title': conv.title or '未命名笔记本',
                            'description': conv.system_prompt or '',
                            'user_id': conv.user_id
                        })
                        
                        # 关联知识库
                        if conv.kb_ids:
                            try:
                                kb_ids = json.loads(conv.kb_ids)
                                for kb_id in kb_ids:
                                    service.link_notebook_to_knowledge_base(conv.id, kb_id)
                            except json.JSONDecodeError:
                                pass
                        
                        migrated_count['notebooks'] += 1
                        print(f"   ✅ 创建笔记本：{conv.title or '未命名'}")
                    else:
                        print(f"   ℹ️  跳过已存在的笔记本：{conv.title or '未命名'}")
                except Exception as e:
                    print(f"   ❌ 迁移笔记本失败：{conv.title or '未命名'}, 错误：{e}")
        
        print("\n" + "="*60)
        print("✅ 数据迁移完成！")
        print(f"   - 知识库：{migrated_count['knowledge_bases']} 个")
        print(f"   - 文档：{migrated_count['documents']} 个")
        print(f"   - 切片：{migrated_count['chunks']} 个（限 100 条）")
        print(f"   - 笔记本：{migrated_count['notebooks']} 个")
        print("="*60 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ 迁移失败：{e}")
        import traceback
        traceback.print_exc()
        return False


def create_digital_logic_course_data():
    """创建数字逻辑课程的测试数据"""
    print("\n" + "="*60)
    print("🎓 创建数字逻辑课程数据")
    print("="*60 + "\n")
    
    # 定义课程结构
    course_data = {
        "knowledge_bases": [
            {
                "id": "dl_kb_001",
                "name": "数字逻辑基础 - 知识库",
                "description": "涵盖数字逻辑的基础概念、定理和分析方法",
                "tenant_id": "tenant_001"
            },
            {
                "id": "dl_kb_002",
                "name": "组合逻辑电路 - 知识库",
                "description": "组合逻辑电路的设计、分析和应用",
                "tenant_id": "tenant_001"
            },
            {
                "id": "dl_kb_003",
                "name": "时序逻辑电路 - 知识库",
                "description": "时序逻辑电路、触发器、计数器和寄存器",
                "tenant_id": "tenant_001"
            }
        ],
        
        "documents": [
            # 数字逻辑基础
            {
                "id": "dl_doc_001",
                "title": "数制与编码.pdf",
                "file_type": "pdf",
                "file_path": "/courses/digital_logic/数制与编码.pdf",
                "file_size": 2048576,
                "kb_id": "dl_kb_001"
            },
            {
                "id": "dl_doc_002",
                "title": "逻辑代数基础.txt",
                "file_type": "txt",
                "file_path": "/courses/digital_logic/逻辑代数基础.txt",
                "file_size": 102400,
                "kb_id": "dl_kb_001"
            },
            {
                "id": "dl_doc_003",
                "title": "卡诺图化简法.md",
                "file_type": "md",
                "file_path": "/courses/digital_logic/卡诺图化简法.md",
                "file_size": 51200,
                "kb_id": "dl_kb_001"
            },
            
            # 组合逻辑电路
            {
                "id": "dl_doc_004",
                "title": "组合电路分析与设计.pdf",
                "file_type": "pdf",
                "file_path": "/courses/digital_logic/组合电路分析与设计.pdf",
                "file_size": 3145728,
                "kb_id": "dl_kb_002"
            },
            {
                "id": "dl_doc_005",
                "title": "常用组合逻辑器件.docx",
                "file_type": "docx",
                "file_path": "/courses/digital_logic/常用组合逻辑器件.docx",
                "file_size": 524288,
                "kb_id": "dl_kb_002"
            },
            
            # 时序逻辑电路
            {
                "id": "dl_doc_006",
                "title": "触发器原理与应用.pdf",
                "file_type": "pdf",
                "file_path": "/courses/digital_logic/触发器原理与应用.pdf",
                "file_size": 2621440,
                "kb_id": "dl_kb_003"
            },
            {
                "id": "dl_doc_007",
                "title": "计数器设计详解.txt",
                "file_type": "txt",
                "file_path": "/courses/digital_logic/计数器设计详解.txt",
                "file_size": 153600,
                "kb_id": "dl_kb_003"
            }
        ],
        
        "chunks": [
            # 数制与编码
            {
                "id": "dl_chunk_001",
                "content": "二进制是数字系统中最基本的数制，它只使用两个数字：0 和 1。在数字电路中，二进制用高电平和低电平表示。",
                "chunk_index": 0,
                "doc_id": "dl_doc_001"
            },
            {
                "id": "dl_chunk_002",
                "content": "BCD 码（Binary-Coded Decimal）是用 4 位二进制数表示一位十进制数的编码方式。8421 码是最常用的 BCD 码。",
                "chunk_index": 1,
                "doc_id": "dl_doc_001"
            },
            
            # 逻辑代数基础
            {
                "id": "dl_chunk_003",
                "content": "摩根定理是逻辑代数中的重要定理，表达式为：¬(A∧B) = ¬A∨¬B 和 ¬(A∨B) = ¬A∧¬B。它在逻辑电路简化中有广泛应用。",
                "chunk_index": 0,
                "doc_id": "dl_doc_002"
            },
            {
                "id": "dl_chunk_004",
                "content": "真值表是描述逻辑函数输入输出关系的表格。对于 n 个输入变量，真值表有 2^n 行。",
                "chunk_index": 1,
                "doc_id": "dl_doc_002"
            },
            
            # 卡诺图化简法
            {
                "id": "dl_chunk_005",
                "content": "卡诺图是一种图形化的逻辑函数化简方法。它将真值表以二维表格的形式表示，相邻的最小项在几何位置上也相邻。",
                "chunk_index": 0,
                "doc_id": "dl_doc_003"
            },
            
            # 组合电路
            {
                "id": "dl_chunk_006",
                "content": "组合逻辑电路的输出只取决于当前的输入，与过去的状态无关。常见的组合逻辑器件有：加法器、编码器、译码器、数据选择器等。",
                "chunk_index": 0,
                "doc_id": "dl_doc_004"
            },
            {
                "id": "dl_chunk_007",
                "content": "全加器有三个输入：A、B 和进位输入 Ci；两个输出：和 S 与进位输出 Co。逻辑表达式为：S = A⊕B⊕Ci，Co = AB + (A⊕B)Ci。",
                "chunk_index": 1,
                "doc_id": "dl_doc_004"
            },
            
            # 时序电路
            {
                "id": "dl_chunk_008",
                "content": "D 触发器是最常用的触发器类型，它在时钟上升沿将输入 D 的值传送到输出 Q。特性方程：Q(n+1) = D。",
                "chunk_index": 0,
                "doc_id": "dl_doc_006"
            },
            {
                "id": "dl_chunk_009",
                "content": "计数器是用于计数脉冲个数的时序电路。按进制可分为二进制计数器、十进制计数器；按计数方向可分为加法计数器、减法计数器和可逆计数器。",
                "chunk_index": 0,
                "doc_id": "dl_doc_007"
            }
        ],
        
        "notebooks": [
            {
                "id": "dl_notebook_001",
                "title": "数字逻辑课程 - 学习笔记",
                "description": "系统学习数字逻辑课程的笔记和练习",
                "user_id": "user_001",
                "kb_ids": ["dl_kb_001", "dl_kb_002", "dl_kb_003"]
            },
            {
                "id": "dl_notebook_002",
                "title": "组合逻辑电路专题",
                "description": "专注于组合逻辑电路的学习和实验",
                "user_id": "user_001",
                "kb_ids": ["dl_kb_002"]
            },
            {
                "id": "dl_notebook_003",
                "title": "时序逻辑电路专题",
                "description": "时序逻辑电路的深入研究与实践",
                "user_id": "user_001",
                "kb_ids": ["dl_kb_003"]
            }
        ]
    }
    
    created_count = {
        'knowledge_bases': 0,
        'documents': 0,
        'chunks': 0,
        'notebooks': 0
    }
    
    try:
        with GraphService() as service:
            # 1. 创建知识库
            print("📚 创建知识库...")
            for kb_data in course_data['knowledge_bases']:
                try:
                    existing = service.get_knowledge_base(kb_data['id'])
                    if not existing:
                        service.create_knowledge_base(kb_data)
                        created_count['knowledge_bases'] += 1
                        print(f"   ✅ 创建知识库：{kb_data['name']}")
                    else:
                        print(f"   ℹ️  跳过已存在的知识库：{kb_data['name']}")
                except Exception as e:
                    print(f"   ❌ 创建知识库失败：{kb_data['name']}, 错误：{e}")
            
            # 2. 创建文档
            print("\n📄 创建文档...")
            for doc_data in course_data['documents']:
                try:
                    existing = service.get_document(doc_data['id'])
                    if not existing:
                        service.create_document(doc_data)
                        created_count['documents'] += 1
                        print(f"   ✅ 创建文档：{doc_data['title']}")
                    else:
                        print(f"   ℹ️  跳过已存在的文档：{doc_data['title']}")
                except Exception as e:
                    print(f"   ❌ 创建文档失败：{doc_data['title']}, 错误：{e}")
            
            # 3. 创建切片
            print("\n✂️  创建切片...")
            for chunk_data in course_data['chunks']:
                try:
                    # 使用更唯一的 ID
                    chunk_id = f"{chunk_data['doc_id']}_{chunk_data['id'].split('_')[-1]}"
                    chunk_data_copy = chunk_data.copy()
                    chunk_data_copy['id'] = chunk_id
                    
                    service.create_chunk(chunk_data_copy)
                    created_count['chunks'] += 1
                    print(f"   ✅ 创建切片：index={chunk_data['chunk_index']}")
                except Exception as e:
                    print(f"   ❌ 创建切片失败：{chunk_data['id']}, 错误：{e}")
            
            # 4. 创建笔记本
            print("\n📓 创建笔记本...")
            for notebook_data in course_data['notebooks']:
                try:
                    existing = service.get_notebook(notebook_data['id'])
                    if not existing:
                        service.create_notebook(notebook_data)
                        
                        # 关联知识库
                        if 'kb_ids' in notebook_data and notebook_data['kb_ids']:
                            for kb_id in notebook_data['kb_ids']:
                                service.link_notebook_to_knowledge_base(
                                    notebook_data['id'], 
                                    kb_id
                                )
                        
                        created_count['notebooks'] += 1
                        print(f"   ✅ 创建笔记本：{notebook_data['title']}")
                    else:
                        print(f"   ℹ️  跳过已存在的笔记本：{notebook_data['title']}")
                except Exception as e:
                    print(f"   ❌ 创建笔记本失败：{notebook_data['title']}, 错误：{e}")
        
        print("\n" + "="*60)
        print("✅ 数字逻辑课程数据创建完成！")
        print(f"   - 知识库：{created_count['knowledge_bases']} 个")
        print(f"   - 文档：{created_count['documents']} 个")
        print(f"   - 切片：{created_count['chunks']} 个")
        print(f"   - 笔记本：{created_count['notebooks']} 个")
        print("="*60 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ 创建课程数据失败：{e}")
        import traceback
        traceback.print_exc()
        return False


def verify_graph_data():
    """验证图谱数据"""
    print("\n" + "="*60)
    print("🔍 验证图谱数据")
    print("="*60 + "\n")
    
    try:
        with GraphService() as service:
            # 查询所有笔记本
            query = """
            MATCH (n:Notebook)
            OPTIONAL MATCH (n)-[r:USES_KNOWLEDGE_BASE]->(kb:KnowledgeBase)
            RETURN n.id AS id, n.title AS title, count(kb) AS kb_count
            """
            result = service.session.run(query)
            
            print("📓 笔记本及其关联的知识库:")
            for record in result:
                print(f"   - {record['title']} ({record['id']}): 关联 {record['kb_count']} 个知识库")
            
            # 查询知识库统计
            query = """
            MATCH (kb:KnowledgeBase)
            OPTIONAL MATCH (kb)-[:HAS_DOCUMENT]->(d:Document)
            OPTIONAL MATCH (d)-[:HAS_CHUNK]->(c:Chunk)
            RETURN kb.name AS name, count(distinct d) AS doc_count, count(distinct c) AS chunk_count
            """
            result = service.session.run(query)
            
            print("\n📚 知识库统计:")
            for record in result:
                print(f"   - {record['name']}: {record['doc_count']} 个文档，{record['chunk_count']} 个切片")
            
            # 查询完整图谱
            query = """
            MATCH (n)
            OPTIONAL MATCH (n)-[r]-(connected)
            RETURN count(n) AS nodes, count(r) AS relationships
            """
            result = result = service.session.run(query)
            record = result.single()
            
            print("\n📊 图谱总览:")
            print(f"   - 节点总数：{record['nodes']}")
            print(f"   - 关系总数：{record['relationships']}")
            
        print("\n" + "="*60)
        print("✅ 数据验证完成！")
        print("="*60 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ 验证失败：{e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n" + "="*70)
    print(" "*20 + "Neo4j 数据迁移与初始化")
    print("="*70 + "\n")
    
    # 步骤 1: 迁移现有数据
    migrate_result = migrate_existing_data()
    
    # 步骤 2: 创建课程数据
    create_result = create_digital_logic_course_data()
    
    # 步骤 3: 验证数据
    verify_result = verify_graph_data()
    
    print("\n" + "="*70)
    print("执行结果汇总:")
    print(f"  - 现有数据迁移：{'✅ 成功' if migrate_result else '❌ 失败'}")
    print(f"  - 课程数据创建：{'✅ 成功' if create_result else '❌ 失败'}")
    print(f"  - 数据验证：{'✅ 成功' if verify_result else '❌ 失败'}")
    print("="*70 + "\n")
