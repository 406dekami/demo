#!/usr/bin/env python3
"""
初始化数字逻辑知识图谱数据

按照四级知识体系构建：
- Level 0: Course (课程)
- Level 1: Concept (概念)  
- Level 2: Principle (原理)
- Level 3: Circuit (电路)
- Level 4: Application (应用)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.services.knowledge_graph_service import KnowledgeGraphService
from loguru import logger

def init_knowledge_graph():
    """初始化知识图谱数据"""
    print("\n" + "="*70)
    print(" "*20 + "数字逻辑知识图谱初始化")
    print("="*70 + "\n")
    
    service = KnowledgeGraphService()
    
    # ========== 1. 创建课程根节点 ==========
    print("📚 创建课程根节点...")
    course_id = "N001"
    service.create_node({
        'id': course_id,
        'name': '数字逻辑电路',
        'level': 0,
        'node_type': 'Course',
        'description': '数字逻辑电路课程根节点'
    })
    print(f"   ✅ 课程：{course_id} - 数字逻辑电路")
    
    # ========== 2. 创建一级节点（概念层） ==========
    print("\n💡 创建一级概念节点...")
    concepts = [
        ("N002", "基础知识", 1, "Concept", "数制、编码与逻辑门基础", None),
        ("N007", "逻辑函数化简", 1, "Concept", "逻辑表达式的化简方法", None),
        ("N010", "组合逻辑电路", 1, "Concept", "组合逻辑电路分析与设计", None),
        ("N014", "触发器", 1, "Concept", "具有记忆功能的基本逻辑单元", "模块 4"),
        ("N017", "时序逻辑电路", 1, "Concept", "输出取决于当前输入和过去状态", "模块 5"),
        ("N021", "计数器", 1, "Concept", "用于计数脉冲数量的时序电路", "模块 6"),
    ]
    
    for node_id, name, level, node_type, desc, module in concepts:
        service.create_node({
            'id': node_id,
            'name': name,
            'level': level,
            'node_type': node_type,
            'description': desc,
            'module': module
        })
        # 创建包含关系
        service.create_relation(course_id, node_id, 'CONTAINS', f'课程包含{name}')
        print(f"   ✅ {node_id} - {name}")
    
    # ========== 3. 创建二级节点（原理层） ==========
    print("\n⚙️  创建二级原理节点...")
    principles = [
        # 基础知识模块
        ("N003", "数制与编码", 2, "Principle", "二进制、十六进制转换及 BCD 码", "N002", "模块 1"),
        ("N004", "逻辑门电路", 2, "Principle", "与或非门、复合门电路结构", "N002", "模块 1"),
        ("N005", "布尔代数定理", 2, "Principle", "逻辑运算基本定律与规则", "N002", "模块 1"),
        ("N006", "标准形式", 2, "Principle", "最小项、最大项标准表达式转换", "N002", "模块 1"),
        
        # 逻辑函数化简模块
        ("N008", "卡诺图 (K-Map)", 2, "Principle", "图形化化简逻辑函数工具", "N007", "模块 2"),
        ("N009", "逻辑变换", 2, "Principle", "公式法化简与形式转换", "N007", "模块 2"),
        
        # 组合逻辑电路模块
        ("N011", "分析与设计", 2, "Principle", "组合电路的分析步骤与设计流程", "N010", "模块 3"),
        ("N012", "常用集成电路 (MSI)", 2, "Principle", "编码器、译码器、数据选择器等芯片", "N010", "模块 3"),
        ("N013", "竞争与冒险", 2, "Principle", "电路延时导致的错误输出现象", "N010", "模块 3"),
        
        # 触发器模块
        ("N015", "类型与方程", 2, "Principle", "RS/D/JK/T 触发器特性方程", "N014", "模块 4"),
        ("N016", "功能转换", 2, "Principle", "利用 M 模型 N 实现触发器类型转换", "N014", "模块 4"),
        
        # 时序逻辑电路模块
        ("N018", "三大方程", 2, "Principle", "输出方程、驱动方程、状态方程", "N017", "模块 5"),
        ("N019", "同步 vs 异步", 2, "Principle", "时钟信号控制方式的分类", "N017", "模块 5"),
        
        # 计数器模块
        ("N022", "74LS290", 2, "Principle", "二 - 五 - 十进制异步计数器芯片", "N021", "模块 6"),
        ("N023", "任意进制设计", 2, "Principle", "利用复位/置位法设计 N 进制计数器", "N021", "模块 6"),
    ]
    
    for node_id, name, level, node_type, desc, parent_id, module in principles:
        service.create_node({
            'id': node_id,
            'name': name,
            'level': level,
            'node_type': node_type,
            'description': desc,
            'parent_id': parent_id,
            'module': module
        })
        # 创建包含关系
        parent = service.get_node(parent_id)
        service.create_relation(parent_id, node_id, 'CONTAINS', f'{parent["name"]}包含{name}')
        print(f"   ✅ {node_id} - {name}")
    
    # ========== 4. 创建三级节点（电路层） ==========
    print("\n🔌 创建三级电路节点...")
    circuits = [
        # 逻辑函数化简 -> 逻辑变换
        ("N024", "与或表达式", 3, "Circuit", "基本的与 - 或门电路实现", "N009", "模块 2"),
        ("N025", "与非 - 与非表达式", 3, "Circuit", "仅用与非门实现逻辑函数", "N009", "模块 2"),
        
        # 组合逻辑电路 -> 分析与设计
        ("N026", "半加器", 3, "Circuit", "两个一位二进制数相加", "N011", "模块 3"),
        ("N027", "全加器", 3, "Circuit", "带进位输入的一位加法器", "N011", "模块 3"),
        
        # 触发器 -> 类型与方程
        ("N028", "RS 触发器", 3, "Circuit", "基本 RS 触发器电路", "N015", "模块 4"),
        ("N029", "D 触发器", 3, "Circuit", "数据触发器，Q(n+1)=D", "N015", "模块 4"),
        ("N030", "JK 触发器", 3, "Circuit", "功能最全的触发器", "N015", "模块 4"),
        
        # 时序逻辑电路 -> 三大方程
        ("N031", "摩尔型电路", 3, "Circuit", "输出只取决于状态", "N018", "模块 5"),
        ("N032", "米利型电路", 3, "Circuit", "输出取决于状态和输入", "N018", "模块 5"),
    ]
    
    for node_id, name, level, node_type, desc, parent_id, module in circuits:
        service.create_node({
            'id': node_id,
            'name': name,
            'level': level,
            'node_type': node_type,
            'description': desc,
            'parent_id': parent_id,
            'module': module
        })
        parent = service.get_node(parent_id)
        service.create_relation(parent_id, node_id, 'CONTAINS', f'{parent["name"]}包含{name}')
        print(f"   ✅ {node_id} - {name}")
    
    # ========== 5. 创建四级节点（应用层） ==========
    print("\n🎯 创建四级应用节点...")
    applications = [
        # 数制与编码 -> 标准形式
        ("N033", "最小项表达式", 4, "Application", "标准与或表达式的应用", "N006", "模块 1"),
        
        # 卡诺图 -> 逻辑变换
        ("N034", "5 变量卡诺图", 4, "Application", "利用 M 模型 N 实现触发器类型转换", "N008", "模块 2"),
        
        # 常用 MSI -> 竞争与冒险
        ("N035", "序列检测器", 4, "Application", "检测特定二进制序列的电路", "N013", "模块 3"),
        
        # 功能转换 -> 触发器应用
        ("N036", "寄存器", 4, "Application", "存储二进制数据的时序电路", "N016", "模块 4"),
        ("N037", "移位寄存器", 4, "Application", "可左右移位的数据存储电路", "N016", "模块 4"),
        
        # 同步 vs 异步 -> 时序设计
        ("N038", "状态机设计", 4, "Application", "同步时序电路的状态机实现", "N019", "模块 5"),
        ("N039", "脉冲异步时序", 4, "Application", "脉冲模式异步时序电路设计", "N019", "模块 5"),
        
        # 计数器应用
        ("N040", "分频器", 4, "Application", "利用计数器实现频率分割", "N022", "模块 6"),
        ("N041", "定时器", 4, "Application", "基于计数器的定时电路", "N022", "模块 6"),
    ]
    
    for node_id, name, level, node_type, desc, parent_id, module in applications:
        service.create_node({
            'id': node_id,
            'name': name,
            'level': level,
            'node_type': node_type,
            'description': desc,
            'parent_id': parent_id,
            'module': module
        })
        parent = service.get_node(parent_id)
        service.create_relation(parent_id, node_id, 'CONTAINS', f'{parent["name"]}包含{name}')
        print(f"   ✅ {node_id} - {name}")
    
    # ========== 6. 创建先修依赖关系 ==========
    print("\n📖 创建先修依赖关系...")
    prerequisites = [
        ("N002", "N007", "PREREQUISITE", "学化简前需先掌握基础知识"),
        ("N007", "N010", "PREREQUISITE", "设计组合电路前需会化简"),
        ("N010", "N014", "PREREQUISITE", "学时序前需懂组合电路"),
        ("N014", "N017", "PREREQUISITE", "时序电路基于触发器"),
        ("N017", "N021", "PREREQUISITE", "计数器是时序电路的应用"),
    ]
    
    for source_id, target_id, rel_type, desc in prerequisites:
        service.create_relation(source_id, target_id, rel_type, desc)
        source = service.get_node(source_id)
        target = service.get_node(target_id)
        print(f"   ✅ {source['name']} → {target['name']}")
    
    # ========== 7. 创建衍生关系 ==========
    print("\n🌱 创建逻辑衍生关系...")
    derives = [
        ("N005", "N008", "DERIVES", "卡诺图是布尔代数的图形化衍生"),
        ("N015", "N016", "DERIVES", "功能转换基于触发器特性"),
    ]
    
    for source_id, target_id, rel_type, desc in derives:
        service.create_relation(source_id, target_id, rel_type, desc)
        source = service.get_node(source_id)
        target = service.get_node(target_id)
        print(f"   ✅ {source['name']} → {target['name']}")
    
    # ========== 统计信息 ==========
    print("\n" + "="*70)
    print("✅ 知识图谱初始化完成！")
    print("="*70)
    
    nodes = service.get_all_nodes()
    relations = service.get_relations()
    
    print(f"\n📊 统计信息:")
    print(f"   - 节点总数：{len(nodes)}")
    print(f"   - 关系总数：{len(relations)}")
    
    # 按类型统计
    by_type = {}
    for node in nodes:
        t = node['node_type']
        by_type[t] = by_type.get(t, 0) + 1
    
    print(f"\n📋 节点类型分布:")
    for t, count in sorted(by_type.items()):
        print(f"   - {t}: {count} 个")
    
    # 按关系类型统计
    by_rel_type = {}
    for rel in relations:
        t = rel['relation_type']
        by_rel_type[t] = by_rel_type.get(t, 0) + 1
    
    print(f"\n🔗 关系类型分布:")
    for t, count in sorted(by_rel_type.items()):
        print(f"   - {t}: {count} 条")
    
    print("\n" + "="*70 + "\n")


if __name__ == "__main__":
    init_knowledge_graph()
