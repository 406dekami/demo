// api/knowledgeGraph.ts - 知识图谱相关 API 调用
import apiClient from './client'

export interface GraphNode {
  id: string
  name: string
  level: number
  node_type: string
  category: number
  symbolSize: number
  value?: number
  draggable?: boolean
}

export interface GraphLink {
  source: string
  target: string
  value: number
  lineStyle?: {
    curveness?: number
  }
}

export interface GraphCategory {
  name: string
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
  categories: GraphCategory[]
}

export interface KnowledgeNode {
  id: string
  name: string
  level: number
  node_type: string
  description?: string
  parent_id?: string
  module?: string
  prerequisites?: string[]
}

export interface KnowledgeRelation {
  id: string
  source_id: string
  target_id: string
  relation_type: string
  description?: string
}

export const getKnowledgeGraphData = async (): Promise<GraphData> => {
  const response = await apiClient.get<GraphData>('/knowledge-graph/visualization')
  return response.data
}

export const getAllNodes = async (): Promise<KnowledgeNode[]> => {
  const response = await apiClient.get<KnowledgeNode[]>('/knowledge-graph/nodes')
  return response.data
}

export const getNode = async (nodeId: string): Promise<KnowledgeNode> => {
  const response = await apiClient.get<KnowledgeNode>(`/knowledge-graph/nodes/${nodeId}`)
  return response.data
}

export const createNode = async (nodeData: Partial<KnowledgeNode>) => {
  const response = await apiClient.post('/knowledge-graph/nodes', nodeData)
  return response.data
}

export const updateNode = async (nodeId: string, updates: Partial<KnowledgeNode>) => {
  const response = await apiClient.put(`/knowledge-graph/nodes/${nodeId}`, updates)
  return response.data
}

export const deleteNode = async (nodeId: string) => {
  const response = await apiClient.delete(`/knowledge-graph/nodes/${nodeId}`)
  return response.data
}

export const getAllRelations = async (nodeId?: string): Promise<KnowledgeRelation[]> => {
  const response = await apiClient.get<KnowledgeRelation[]>('/knowledge-graph/relations', {
    params: nodeId ? { node_id: nodeId } : undefined,
  })
  return response.data
}

export const createRelation = async (sourceId: string, targetId: string, relationType: string, description?: string) => {
  const response = await apiClient.post('/knowledge-graph/relations', {
    source_id: sourceId,
    target_id: targetId,
    relation_type: relationType,
    description,
  })
  return response.data
}

export const deleteRelation = async (relationId: string) => {
  const response = await apiClient.delete(`/knowledge-graph/relations/${relationId}`)
  return response.data
}

export const getTreeStructure = async (rootId: string = 'N001') => {
  const response = await apiClient.get('/knowledge-graph/tree', {
    params: { root_id: rootId },
  })
  return response.data
}

export const getNodePath = async (nodeId: string, rootId: string = 'N001'): Promise<KnowledgeNode[]> => {
  const response = await apiClient.get<KnowledgeNode[]>(`/knowledge-graph/path/${nodeId}`, {
    params: { root_id: rootId },
  })
  return response.data
}
