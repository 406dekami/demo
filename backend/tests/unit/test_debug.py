"""快速测试分块器"""
from app.rag.chunking import TextChunker

print("测试 1: basic_chunking")
chunker = TextChunker(chunk_size=50, chunk_overlap=10)
text = "这是第一段。" * 20
print(f"文本长度：{len(text)}")

result = chunker.chunk_text(text)
print(f"结果块数：{len(result)}")
print(f"第一块：{result[0] if result else 'None'}")
print()

print("测试 2: very_long_text")
chunker2 = TextChunker(chunk_size=100, chunk_overlap=20)
text2 = "测试。" * 1000
print(f"文本长度：{len(text2)}")

result2 = chunker2.chunk_text(text2)
print(f"结果块数：{len(result2)}")
print(f"第一块大小：{len(result2[0]['text']) if result2 else 0}")
