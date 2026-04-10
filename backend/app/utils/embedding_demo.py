import os
from http import HTTPStatus

import dashscope
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# 设置 API Key
dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
resp = dashscope.TextEmbedding.call(
    model="text-embedding-v4",
    input='衣服的质量杠杠的，很漂亮，不枉我等了这么久啊，喜欢，以后还来这里买',
    dimension=1024,  # 指定向量维度（仅 text-embedding-v3及 text-embedding-v4支持该参数）
    output_type="dense&sparse"
)

print(resp) if resp.status_code == HTTPStatus.OK else print(resp)