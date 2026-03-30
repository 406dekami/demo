// ============================================
// Neo4j 知识图谱数据导入脚本
// 使用方法：在 Neo4j Browser 中运行
// :source import.cypher
// ============================================

// 清理现有数据（可选，谨慎使用）
// MATCH (n) DETACH DELETE n;

// 创建唯一性约束
CREATE CONSTRAINT node_id IF NOT EXISTS FOR (n:Node) REQUIRE n.id IS UNIQUE;

// 导入节点并设置动态标签
LOAD CSV WITH HEADERS FROM 'file:///nodes.csv' AS row
CALL {
    WITH row
    CREATE (n:Node {
        id: row.id,
        name: row.name,
        label: row.label,
        level: toInteger(row.level),
        description: row.description,
        module: row.module,
        keywords: split(row.keywords, ';')
    })
    // 根据 label 字段添加额外标签
    WITH n, row.label AS lbl
    CALL apoc.create.addLabels(n, [lbl]) YIELD node
    RETURN node
}

// 导入关系（使用动态关系类型）
LOAD CSV WITH HEADERS FROM 'file:///relationships.csv' AS row
MATCH (source:Node {id: row.source_id})
MATCH (target:Node {id: row.target_id})
CALL {
    WITH source, target, row
    CALL apoc.create.relationship(source, row.relationship_type, {description: row.description}, target) YIELD rel
    RETURN rel
}
