"""
Reranker 使用示例
演示如何使用 qwen3-rerank 模型对检索结果进行重排序
"""
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

from app.rag.reranker import QwenReranker


def basic_rerank_example():
    """基础重排序示例"""
    print("=" * 80)
    print("基础重排序示例")
    print("=" * 80)
    
    # 初始化 Reranker
    reranker = QwenReranker()
    
    # 查询和文档
    query = "什么是文本排序模型"
    documents = [
        "文本排序模型广泛用于搜索引擎和推荐系统中，它们根据文本相关性对候选文本进行排序",
        "量子计算是计算科学的一个前沿领域",
        "预训练语言模型的发展给文本排序模型带来了新的进展"
    ]
    
    print(f"\n查询: {query}\n")
    print("原始文档列表:")
    for i, doc in enumerate(documents):
        print(f"  [{i}] {doc}")
    
    # 执行重排序
    results = reranker.rerank(
        query=query,
        documents=documents,
        top_n=10
    )
    
    print("\n重排序结果（按相关性从高到低）:")
    for i, result in enumerate(results):
        print(f"  排名 {i+1}:")
        print(f"    原始索引: {result['index']}")
        print(f"    相关性分数: {result['score']:.4f}")
        print(f"    文档内容: {result['text']}")
        print()


def chunk_rerank_example():
    """Chunk 重排序示例（保留元数据）"""
    print("=" * 80)
    print("Chunk 重排序示例（保留元数据）")
    print("=" * 80)
    
    reranker = QwenReranker()
    
    # 模拟检索到的 chunks
    chunks = [
        {
            "text": "量子计算利用量子力学原理进行计算",
            "score": 0.65,
            "metadata": {"source": "quantum_physics.pdf", "page": 12}
        },
        {
            "text": "文本排序模型用于信息检索系统的相关性排序",
            "score": 0.72,
            "metadata": {"source": "ir_systems.pdf", "page": 45}
        },
        {
            "text": "深度学习中的注意力机制改进了序列建模",
            "score": 0.58,
            "metadata": {"source": "deep_learning.pdf", "page": 78}
        }
    ]
    
    query = "文本排序的应用场景"
    
    print(f"\n查询: {query}\n")
    print("原始 Chunks（按向量相似度排序）:")
    for i, chunk in enumerate(chunks):
        print(f"  [{i}] 相似度={chunk['score']:.2f}, 来源={chunk['metadata']['source']}")
        print(f"      {chunk['text'][:50]}...")
    
    # 执行重排序
    reranked_chunks = reranker.rerank_chunks(
        query=query,
        chunks=chunks,
        top_n=3
    )
    
    print("\n重排序后 Chunks（按相关性重新排序）:")
    for i, chunk in enumerate(reranked_chunks):
        print(f"  排名 {i+1}:")
        print(f"    原始相似度: {chunk.get('score', 'N/A'):.4f}")
        print(f"    Rerank 分数: {chunk.get('rerank_score', 'N/A'):.4f}")
        print(f"    来源: {chunk['metadata']['source']} (第{chunk['metadata']['page']}页)")
        print(f"    内容: {chunk['text']}")
        print()


def custom_instruct_example():
    """自定义指令示例"""
    print("=" * 80)
    print("自定义指令示例")
    print("=" * 80)
    
    reranker = QwenReranker()
    
    query = "Python 异步编程的最佳实践"
    documents = [
        "Python 的 asyncio 库提供了异步 I/O 支持",
        "使用 async/await 语法可以编写更清晰的异步代码",
        "异步编程可以提高高并发场景下的性能",
        "JavaScript 也支持异步编程模式"
    ]
    
    # 使用自定义指令
    custom_instruct = (
        "Given a technical question about Python programming, "
        "rank the passages by their relevance and practical value."
    )
    
    results = reranker.rerank(
        query=query,
        documents=documents,
        top_n=10,
        instruct=custom_instruct
    )
    
    print(f"\n查询: {query}\n")
    print(f"自定义指令: {custom_instruct}\n")
    print("重排序结果:")
    for i, result in enumerate(results):
        print(f"  {i+1}. [分数: {result['score']:.4f}] {result['text']}")
    print()


if __name__ == "__main__":
    # 检查 API Key
    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        print("❌ 错误: 未配置 DASHSCOPE_API_KEY 环境变量")
        print("请在 .env 文件中设置您的 DashScope API Key")
        exit(1)
    
    try:
        # 运行示例
        basic_rerank_example()
        print("\n")
        
        chunk_rerank_example()
        print("\n")
        
        custom_instruct_example()
        
        print("\n✅ 所有示例执行完成！")
        
    except Exception as e:
        print(f"\n❌ 执行失败: {e}")
        import traceback
        traceback.print_exc()
