#!/usr/bin/env python3
"""
Neo4j 知识图谱数据导入脚本
从 CSV 文件导入节点和关系数据到 Neo4j

使用方法:
    python import_knowledge_graph.py          # 交互式
    python import_knowledge_graph.py --clean  # 清理现有数据后导入
"""
import argparse
import csv
import os

from dotenv import load_dotenv
from neo4j import GraphDatabase

# 加载环境变量
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Neo4j 配置
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "DigitalLogic2024")

# CSV 文件路径
CSV_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'seeds')
NODES_CSV = os.path.join(CSV_DIR, 'nodes.csv')
RELATIONSHIPS_CSV = os.path.join(CSV_DIR, 'relationships.csv')


class Neo4jImporter:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
    
    def close(self):
        self.driver.close()
    
    def clear_data(self):
        """清理现有数据"""
        with self.driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
        print("✓ 已清理现有数据")
    
    def create_constraints(self):
        """创建唯一性约束"""
        with self.driver.session() as session:
            session.run("""
                CREATE CONSTRAINT node_id IF NOT EXISTS 
                FOR (n:Node) REQUIRE n.id IS UNIQUE
            """)
        print("✓ 已创建唯一性约束")
    
    def import_nodes(self, csv_path):
        """导入节点数据"""
        with self.driver.session() as session:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    # 创建节点
                    session.run("""
                        MERGE (n:Node {id: $id})
                        SET n.name = $name,
                            n.label = $label,
                            n.level = toInteger($level),
                            n.description = $description,
                            n.module = $module,
                            n.keywords = split($keywords, ';')
                    """, {
                        "id": row['id'],
                        "name": row['name'],
                        "label": row['label'],
                        "level": row['level'],
                        "description": row['description'],
                        "module": row['module'],
                        "keywords": row['keywords']
                    })
                    
                    # 添加动态标签
                    session.run(f"""
                        MATCH (n:Node {{id: '{row['id']}'}})
                        CALL apoc.create.addLabels(n, ['{row['label']}']) YIELD node
                        RETURN node
                    """)
                    count += 1
        print(f"✓ 已导入 {count} 个节点")
    
    def import_relationships(self, csv_path):
        """导入关系数据"""
        with self.driver.session() as session:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    # 使用 APOC 创建动态关系类型
                    session.run("""
                        MATCH (source:Node {id: $source_id})
                        MATCH (target:Node {id: $target_id})
                        CALL apoc.create.relationship(source, $type, {description: $description}, target) YIELD rel
                        RETURN rel
                    """, {
                        "source_id": row['source_id'],
                        "target_id": row['target_id'],
                        "type": row['relationship_type'],
                        "description": row['description']
                    })
                    count += 1
        print(f"✓ 已导入 {count} 条关系")
    
    def verify_data(self):
        """验证导入数据"""
        with self.driver.session() as session:
            # 统计节点
            result = session.run("MATCH (n) RETURN count(n) AS count")
            node_count = result.single()["count"]
            
            # 统计关系
            result = session.run("MATCH ()-[r]->() RETURN count(r) AS count")
            rel_count = result.single()["count"]
            
            # 统计不同标签
            result = session.run("""
                MATCH (n) 
                WITH labels(n) AS lbls 
                UNWIND lbls AS label 
                RETURN label, count(*) AS count 
                ORDER BY count DESC
            """)
            labels = [(r["label"], r["count"]) for r in result]
            
            # 统计不同关系类型
            result = session.run("""
                MATCH ()-[r]->() 
                RETURN type(r) AS type, count(*) AS count 
                ORDER BY count DESC
            """)
            rel_types = [(r["type"], r["count"]) for r in result]
        
        print("\n" + "="*50)
        print("📊 数据验证结果")
        print("="*50)
        print(f"  节点总数：{node_count}")
        print(f"  关系总数：{rel_count}")
        print(f"\n  节点标签分布:")
        for label, count in labels[:10]:
            print(f"    - {label}: {count}")
        print(f"\n  关系类型分布:")
        for rel_type, count in rel_types:
            print(f"    - {rel_type}: {count}")
        print("="*50)


def main():
    parser = argparse.ArgumentParser(description="Neo4j 知识图谱数据导入脚本")
    parser.add_argument("--clean", action="store_true", help="清理现有数据后导入")
    args = parser.parse_args()
    
    print("="*50)
    print("🚀 Neo4j 知识图谱数据导入")
    print("="*50)
    
    # 检查 CSV 文件
    if not os.path.exists(NODES_CSV):
        print(f"❌ 错误：找不到节点文件 {NODES_CSV}")
        return
    if not os.path.exists(RELATIONSHIPS_CSV):
        print(f"❌ 错误：找不到关系文件 {RELATIONSHIPS_CSV}")
        return
    
    print(f"✓ 节点文件：{NODES_CSV}")
    print(f"✓ 关系文件：{RELATIONSHIPS_CSV}")
    
    # 创建导入器
    importer = Neo4jImporter(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
    
    try:
        # 根据参数决定是否清理数据
        if args.clean:
            print("\n🗑️  清理现有数据...")
            importer.clear_data()
        else:
            print("\n⊘  保留现有数据（使用 --clean 可清理）")
        
        # 创建约束
        print("\n📌 创建唯一性约束...")
        importer.create_constraints()
        
        # 导入节点
        print("\n📥 导入节点数据...")
        importer.import_nodes(NODES_CSV)
        
        # 导入关系
        print("\n📥 导入关系数据...")
        importer.import_relationships(RELATIONSHIPS_CSV)
        
        # 验证数据
        print("\n🔍 验证导入数据...")
        importer.verify_data()
        
        print("\n✅ 数据导入完成！")
        print("\n💡 提示：访问 http://localhost:7474 查看图谱")
        
    except Exception as e:
        print(f"\n❌ 导入失败：{e}")
        raise
    finally:
        importer.close()


if __name__ == "__main__":
    main()
