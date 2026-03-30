"""
RAG 全流程集成测试
测试从文档加载 → 分块 → 向量化 → 存储 → 检索 → 生成的完整流程
"""
import os
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv

# 加载环境变量（从 backend/.env 加载）
load_dotenv(dotenv_path=project_root / ".env")

from app.rag.document_loader import DocumentLoader
from app.rag.chunking import LangChainChunker
from app.rag.embedding import get_embedding_model
from app.rag.vector_store import VectorStore
from app.rag.retriever import Retriever
from app.rag.generator import Generator


def test_rag_pipeline():
    """测试完整的 RAG 流程"""

    print("=" * 60)
    print("🚀 RAG 全流程测试开始")
    print("=" * 60)

    # 配置参数
    kb_id = "test_kb_001"
    data_file = project_root / "data.txt"
    chunk_size = 512
    chunk_overlap = 50
    top_k = 3

    try:
        # ========== 步骤 1: 加载文档 ==========
        print("\n📄 步骤 1: 加载文档...")
        loader = DocumentLoader()

        if not data_file.exists():
            print(f"❌ 错误：数据文件不存在 - {data_file}")
            return False

        documents = loader.load_document(str(data_file))
        print(f"✓ 加载完成，共 {len(documents)} 个文档")
        for i, doc in enumerate(documents):
            print(f"  - 文档{i+1}: {len(doc['text'])} 字符，来源：{doc.get('source', 'unknown')}")

        # ========== 步骤 2: 文本分块 ==========
        print("\n✂️  步骤 2: 文本分块 (LangChain)...")
        chunker = LangChainChunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        chunks = chunker.chunk_documents(documents)
        print(f"✓ 分块完成，共 {len(chunks)} 个片段")
        for i, chunk in enumerate(chunks[:3]):  # 只显示前 3 个
            print(f"  - 片段{i+1}: {chunk.get('length', len(chunk['text']))} 字符")
        if len(chunks) > 3:
            print(f"  ... 还有 {len(chunks) - 3} 个片段")

        # ========== 步骤 3: 向量化 ==========
        print("\n🔢 步骤 3: 向量化...")
        embedding = get_embedding_model()
        texts = [chunk["text"] for chunk in chunks]

        try:
            vectors = embedding.embed_documents(texts)
            print(f"✓ 向量化完成，共 {len(vectors)} 个向量，维度：{len(vectors[0]) if vectors else 0}")
        except Exception as e:
            print(f"❌ 向量化失败：{e}")
            return False

        # ========== 步骤 4: 存储到向量数据库 ==========
        print("\n💾 步骤 4: 存储到 ChromaDB...")
        vector_store = VectorStore(kb_id=kb_id)

        # 生成 IDs 和元数据
        ids = [f"chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "source": chunk.get("source", "unknown"),
                "chunk_index": i,
                "start_index": chunk.get("start_index", 0),
                "end_index": chunk.get("end_index", 0)
            }
            for i, chunk in enumerate(chunks)
        ]

        vector_store.add_vectors(
            vectors=vectors,
            documents=texts,
            ids=ids,
            metadatas=metadatas
        )
        print(f"✓ 存储完成，当前知识库总数：{vector_store.count()}")

        # ========== 步骤 5: 检索测试 ==========
        print("\n🔍 步骤 5: 检索测试...")
        retriever = Retriever(vector_store, embedding, top_k=top_k)

        test_queries = [
            "什么是机器学习？",
            "深度学习有哪些应用场景？",
            "自然语言处理可以用来做什么？"
        ]

        for query in test_queries:
            print(f"\n  查询：{query}")
            results = retriever.retrieve(query, top_k=top_k)

            if results:
                print(f"  ✓ 检索到 {len(results)} 条相关结果")
                for i, result in enumerate(results, 1):
                    score = result.get('score', 0)
                    text_preview = result.get('text', '')[:80]
                    source = result.get('metadata', {}).get('source', '未知')
                    print(f"    [{i}] 相似度：{score:.4f}, 来源：{source}")
                    print(f"        内容：{text_preview}...")
            else:
                print(f"  ⚠️  未检索到相关结果")

        # ========== 步骤 6: 生成回答 ==========
        print("\n🤖 步骤 6: 生成回答测试...")
        generator = Generator(model_name="qwen-plus")

        test_query = "请简要介绍机器学习和深度学习的区别"
        print(f"  问题：{test_query}")

        # 检索上下文
        context_chunks = retriever.retrieve(test_query, top_k=3)

        if context_chunks:
            # 生成回答
            response = generator.generate(
                query=test_query,
                context=context_chunks
            )

            print(f"\n  生成的回答：\n{'-' * 60}")
            print(response)
            print(f"{'-' * 60}")
        else:
            print("  ⚠️  无法获取上下文，跳过生成测试")

        # ========== 测试完成 ==========
        print("\n" + "=" * 60)
        print("✅ RAG 全流程测试完成！")
        print("=" * 60)

        return True

    except Exception as e:
        print(f"\n❌ 测试过程中发生错误：{e}")
        import traceback
        traceback.print_exc()
        return False


def test_qa_pipeline():
    """测试问答流程"""

    print("\n" + "=" * 60)
    print("💬 RAG 问答流程测试")
    print("=" * 60)

    kb_id = "test_kb_001"

    try:
        # 初始化组件
        embedding = get_embedding_model()
        vector_store = VectorStore(kb_id=kb_id)
        retriever = Retriever(vector_store, embedding, top_k=3)
        generator = Generator(model_name="qwen-plus")

        # 多轮对话测试
        questions = [
            "人工智能包括哪些主要研究领域？",
            "机器学习中常用的算法有哪些？",
            "深度学习和传统机器学习有什么区别？"
        ]

        history = []

        for i, question in enumerate(questions, 1):
            print(f"\n【第{i}轮】")
            print(f"问：{question}")

            # 检索
            context_chunks = retriever.retrieve(question, top_k=3)

            if not context_chunks:
                print("答：抱歉，没有找到相关信息。\n")
                continue

            # 生成
            answer = generator.generate(
                query=question,
                context=context_chunks,
                history=history
            )

            print(f"答：{answer}\n")

            # 添加到历史
            history.append({"role": "user", "content": question})
            history.append({"role": "assistant", "content": answer})

        print("=" * 60)
        print("✅ 问答流程测试完成！")
        print("=" * 60)

        return True

    except Exception as e:
        print(f"❌ 问答测试失败：{e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    # 运行主测试
    success = test_rag_pipeline()

    if success:
        # 可选：运行问答测试
        # test_qa_pipeline()
        pass

    # 退出码
    sys.exit(0 if success else 1)
