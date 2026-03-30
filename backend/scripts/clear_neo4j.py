#!/usr/bin/env python3
"""清空 Neo4j 中的所有数据"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.db.graph_service import GraphService

print("🗑️  正在清空 Neo4j...")

with GraphService() as service:
    result = service.session.run('MATCH (n) DETACH DELETE n')
    summary = result.consume()
    print(f"✅ 已删除 {summary.counters.nodes_deleted} 个节点")
    print(f"✅ 已删除 {summary.counters.relationships_deleted} 条关系")

print("✅ Neo4j 已清空！")
