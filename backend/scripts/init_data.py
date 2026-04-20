#!/usr/bin/env python3
"""
数据初始化命令行工具
用于手动执行或调试数据初始化
"""
import argparse
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.init_data import (
    init_mind_map,
    init_knowledge_graph,
    init_neo4j_graph,
    get_init_status
)


def print_status():
    """打印初始化状态"""
    print("\n" + "="*60)
    print("📊 数据初始化状态")
    print("="*60)
    
    status = get_init_status()
    
    print(f"\n📝 MindMap 节点数: {status['mindmap_nodes']}")
    print(f"🕸️  KnowledgeNode 节点数: {status['knowledge_nodes']}")
    print(f"🔗 KnowledgeRelation 关系数: {status['knowledge_relations']}")
    print(f"🌐 Neo4j 可用: {'✅' if status['neo4j_available'] else '❌'}")
    if status['neo4j_available']:
        print(f"   Neo4j 节点数: {status['neo4j_nodes']}")
    
    all_ready = status['all_initialized']
    print(f"\n✨ 全部就绪: {'✅ 是' if all_ready else '❌ 否'}")
    print("="*60 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description='数据初始化工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python scripts/init_data.py --status              # 查看初始化状态
  python scripts/init_data.py --all                 # 初始化所有数据
  python scripts/init_data.py --mind-map            # 仅初始化思维导图
  python scripts/init_data.py --knowledge-graph     # 仅初始化知识图谱
  python scripts/init_data.py --neo4j               # 仅初始化 Neo4j
  python scripts/init_data.py --force --all         # 强制重新初始化所有
        """
    )
    
    parser.add_argument('--status', action='store_true', help='查看初始化状态')
    parser.add_argument('--all', action='store_true', help='初始化所有模块')
    parser.add_argument('--mind-map', action='store_true', help='初始化思维导图')
    parser.add_argument('--knowledge-graph', action='store_true', help='初始化知识图谱')
    parser.add_argument('--neo4j', action='store_true', help='初始化 Neo4j')
    parser.add_argument('--force', action='store_true', help='强制重新初始化（清空现有数据）')
    
    args = parser.parse_args()
    
    # 如果没有指定任何操作，显示帮助
    if not any([args.status, args.all, args.mind_map, args.knowledge_graph, args.neo4j]):
        parser.print_help()
        return
    
    # 显示状态
    if args.status:
        print_status()
        return
    
    # 执行初始化
    print("\n" + "="*60)
    print("🚀 开始数据初始化")
    print("="*60 + "\n")
    
    results = []
    
    if args.all or args.mind_map:
        print("📝 初始化思维导图...")
        result = init_mind_map(force=args.force)
        results.append(('MindMap', result))
        print(f"   {'✅' if result['success'] else '❌'} {result['message']}\n")
    
    if args.all or args.knowledge_graph:
        print("🕸️  初始化知识图谱...")
        result = init_knowledge_graph(force=args.force)
        results.append(('KnowledgeGraph', result))
        print(f"   {'✅' if result['success'] else '❌'} {result['message']}\n")
    
    if args.all or args.neo4j:
        print("🌐 初始化 Neo4j...")
        result = init_neo4j_graph(force=args.force)
        results.append(('Neo4j', result))
        print(f"   {'✅' if result['success'] else '❌'} {result['message']}\n")
    
    # 汇总结果
    print("="*60)
    print("📊 初始化结果汇总")
    print("="*60)
    
    all_success = all(r['success'] for _, r in results)
    
    for name, result in results:
        status_icon = '✅' if result['success'] else '❌'
        skip_icon = '⏭️ ' if result.get('skipped') else ''
        print(f"{status_icon} {skip_icon}{name}: {result['message']}")
    
    print("="*60)
    
    if all_success:
        print("\n🎉 所有模块初始化成功！\n")
    else:
        print("\n💥 部分模块初始化失败，请检查日志\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
