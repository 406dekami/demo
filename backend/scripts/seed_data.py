#!/usr/bin/env python3
"""
测试数据填充脚本
使用方法：python scripts/seed_data.py
"""
import logging
import sys
from pathlib import Path

# 添加项目根目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


def create_demo_user():
    """创建演示用户"""
    from app.db.models import User
    
    logging.info("创建演示用户...")
    
    # 检查是否已存在
    existing = User.select().where(User.phone == "13800138000").first()
    if existing:
        logging.info("⏭️  演示用户已存在")
        return existing
    
    # 创建用户
    user = User.create(
        phone="13800138000",
        nickname="演示用户",
        password_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",  # 空密码的 SHA256
    )
    
    logging.info(f"✅ 演示用户已创建：ID={user.id}")
    return user


def create_test_knowledge_base(tenant_id: str):
    """创建测试知识库"""
    from app.db.models import KnowledgeBase
    
    logging.info("创建测试知识库...")
    
    # 检查是否已存在
    existing = KnowledgeBase.select().where(
        (KnowledgeBase.tenant_id == tenant_id) & 
        (KnowledgeBase.name == "测试知识库")
    ).first()
    
    if existing:
        logging.info("⏭️  测试知识库已存在")
        return existing
    
    kb = KnowledgeBase.create(
        tenant_id=tenant_id,
        name="测试知识库",
        description="用于测试的示例知识库",
        embd_model="text-embedding-v3",
        chunk_size=512,
        chunk_overlap=50,
    )
    
    logging.info(f"✅ 测试知识库已创建：ID={kb.id}")
    return kb


def main():
    """主函数"""
    logging.info("\n🌱 RAG Platform 测试数据填充脚本")
    logging.info("=" * 60)
    
    try:
        # 1. 创建演示用户
        user = create_demo_user()
        
        # 2. 创建测试知识库
        kb = create_test_knowledge_base(tenant_id="demo_tenant")
        
        logging.info("=" * 60)
        logging.info("🎉 测试数据填充完成！")
        logging.info("=" * 60)
        logging.info(f"演示账号：13800138000")
        logging.info(f"知识库：{kb.name} (ID={kb.id})")
        logging.info("=" * 60)
        
    except Exception as e:
        logging.error(f"❌ 数据填充失败：{e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
