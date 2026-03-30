#!/usr/bin/env python3
"""
测试 LLM 工厂服务
"""
import logging
from backend.app.db.services.llm_factory_service import (
    init_llm_factories,
    get_all_factories_with_models,
    get_models_by_type
)

logging.basicConfig(level=logging.INFO)

print("=" * 60)
print("测试 LLM 工厂服务")
print("=" * 60)

# 1. 初始化
print("\n1️⃣  初始化 LLM 厂商和模型数据...")
success = init_llm_factories()
print(f"初始化结果：{'✅ 成功' if success else '❌ 失败'}")

# 2. 查询所有厂商
print("\n2️⃣  查询所有厂商及其模型...")
factories = get_all_factories_with_models()
print(f"共查询到 {len(factories)} 个厂商")

for i, item in enumerate(factories[:5], 1):  # 只显示前 5 个
    factory = item['factory']
    models = item['models']
    print(f"\n  [{i}] {factory['name']}")
    print(f"      标签：{factory['tags']}")
    print(f"      模型数量：{len(models)}")
    if models:
        print(f"      示例：{models[0]['llm_name']} ({models[0]['model_type']})")

# 3. 按类型查询模型
print("\n3️⃣  按类型查询模型...")
for model_type in ['chat', 'embedding', 'tts', 'image2text']:
    models = get_models_by_type(model_type)
    print(f"\n  {model_type}: {len(models)} 个模型")
    if models:
        print(f"    示例：{models[0]['llm_name']} - {models[0]['factory_name']}")

print("\n" + "=" * 60)
print("✅ 测试完成")
print("=" * 60)
