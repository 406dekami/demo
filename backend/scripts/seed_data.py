#!/usr/bin/env python3
"""
测试数据填充脚本（兼容旧版）
已迁移到 app.db.init_data 模块
使用方法：python scripts/seed_data.py
"""
import sys
from pathlib import Path

# 添加项目根目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.init_data import init_mind_map, init_knowledge_graph


def main():
    """主函数 - 调用新的初始化模块"""
    print("\n🌱 RAG Platform 测试数据填充脚本")
    print("=" * 60)
    print("⚠️  此脚本已迁移，建议使用: python scripts/init_data.py --all")
    print("=" * 60 + "\n")
    
    # 初始化思维导图
    print("📝 初始化思维导图...")
    mm_result = init_mind_map(force=False)
    if mm_result['success']:
        print(f"✅ {mm_result['message']}\n")
    else:
        print(f"❌ {mm_result['message']}\n")
    
    # 初始化知识图谱
    print("🕸️  初始化知识图谱...")
    kg_result = init_knowledge_graph(force=False)
    if kg_result['success']:
        print(f"✅ {kg_result['message']}\n")
    else:
        print(f"❌ {kg_result['message']}\n")
    
    print("=" * 60)
    print("🎉 数据填充完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()
