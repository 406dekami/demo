#!/usr/bin/env python3
"""
清理孤儿向量库数据
扫描 storage/chroma_db/ 目录，删除数据库中不存在的知识库对应的向量数据
"""
import sys
from pathlib import Path

# 添加项目根目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db import DB, KnowledgeBase
from app.core.config import settings
from loguru import logger
import shutil


def clean_orphaned_chroma_data(dry_run: bool = True):
    """
    清理孤儿的 ChromaDB 数据
    
    Args:
        dry_run: 是否为试运行（只打印不删除）
    """
    logger.info("=" * 60)
    logger.info("🧹 开始扫描孤儿向量库数据")
    logger.info("=" * 60)
    
    # 获取所有有效的知识库 ID
    DB.connect()
    try:
        valid_kb_ids = set(kb.kb_id for kb in KnowledgeBase.select(KnowledgeBase.kb_id))
        logger.info(f"✅ 数据库中有 {len(valid_kb_ids)} 个有效知识库")
    finally:
        DB.close()
    
    # 扫描 ChromaDB 目录
    chroma_dir = settings.STORAGE_DIR / 'chroma_db'
    if not chroma_dir.exists():
        logger.warning(f"⚠️ ChromaDB 目录不存在：{chroma_dir}")
        return
    
    orphaned_dirs = []
    for item in chroma_dir.iterdir():
        if item.is_dir() and item.name not in valid_kb_ids:
            orphaned_dirs.append(item)
    
    if not orphaned_dirs:
        logger.info("✨ 没有发现孤儿数据")
        return
    
    logger.warning(f"\n⚠️  发现 {len(orphaned_dirs)} 个孤儿向量库目录：")
    for orphan_dir in orphaned_dirs:
        size_mb = sum(f.stat().st_size for f in orphan_dir.rglob('*') if f.is_file()) / (1024 * 1024)
        logger.warning(f"   - {orphan_dir.name} ({size_mb:.2f} MB)")
    
    if dry_run:
        logger.info("\n💡 试运行模式，未执行删除操作")
        logger.info("   使用 --execute 参数执行实际删除")
    else:
        logger.info("\n🗑️  开始删除孤儿数据...")
        for orphan_dir in orphaned_dirs:
            try:
                shutil.rmtree(orphan_dir)
                logger.info(f"   ✅ 已删除：{orphan_dir.name}")
            except Exception as e:
                logger.error(f"   ❌ 删除失败 {orphan_dir.name}: {e}")
        
        logger.info("\n✨ 清理完成")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='清理孤儿向量库数据')
    parser.add_argument('--execute', action='store_true', 
                       help='执行实际删除（默认只扫描）')
    
    args = parser.parse_args()
    
    clean_orphaned_chroma_data(dry_run=not args.execute)
