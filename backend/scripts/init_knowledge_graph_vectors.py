#!/usr/bin/env python3
"""
初始化知识图谱向量化
将所有知识节点的 name 和 description 生成向量，存入 ChromaDB
"""
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.graph_vector_service import get_graph_vector_service
from loguru import logger


def main():
    """主函数"""
    print("\n" + "="*60)
    print("📊 开始向量化知识图谱节点")
    print("="*60 + "\n")
    
    try:
        # 获取向量化服务
        vector_service = get_graph_vector_service()
        
        # 向量化所有节点
        result = vector_service.index_all_nodes(
            kb_id="knowledge_graph",
            batch_size=10
        )
        
        print("\n" + "="*60)
        print("✅ 向量化完成！")
        print("="*60)
        print(f"总节点数：{result.get('total', 0)}")
        print(f"成功：{result.get('success', 0)}")
        print(f"失败：{result.get('failed', 0)}")
        
        if result.get('failed_ids'):
            print(f"\n失败的节点 ID: {result['failed_ids']}")
        
        print("\n" + "="*60)
        print("💡 提示：现在可以使用语义搜索功能了")
        print("示例：搜索 '怎么设计计数器' 会找到 N023 任意进制设计 和 N021 计数器")
        print("="*60 + "\n")
        
    except Exception as e:
        logger.error(f"❌ 向量化失败：{e}")
        print(f"\n❌ 错误：{e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
