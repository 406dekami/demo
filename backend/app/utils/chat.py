import os
import dashscope

messages = [
    {'role': 'system', 'content': 'You are a helpful assistant.'},
    {'role': 'user', 'content': '你是谁？'}
]
response = dashscope.Generation.call(
    # 若没有配置环境变量，请用百炼API Key将下行替换为：api_key="sk-xxx"
    api_key=os.getenv('DASHSCOPE_API_KEY'),
    model="qwen-plus", # 此处以qwen-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
    messages=messages,
    result_format='message'
    )
print(response)


import os
import dashscope

messages = [
        {'role': 'system', 'content': 'you are a helpful assisstant'},
        # 请将 '{FILE_ID}'替换为您实际对话场景所使用的 fileid
        {'role':'system','content':f'fileid://{FILE_ID}'},
        {'role': 'user', 'content': '这篇文章讲了什么'}]
response = dashscope.Generation.call(
    # 若没有配置环境变量，请用百炼API Key将下行替换为：api_key="sk-xxx"
    api_key=os.getenv('DASHSCOPE_API_KEY'),
    model="qwen-long",
    messages=messages,
    result_format='message'
)
print(response)