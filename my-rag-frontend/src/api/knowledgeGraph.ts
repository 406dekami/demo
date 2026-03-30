// api/knowledgeGraph.ts - 知识图谱相关 API 调用
import axios from 'axios'

const BASE_URL = '/api/v1'

// 获取认证 token
const getToken = () => {
  return localStorage.getItem('auth_token')
}

// 创建 axios 实例（自动携带 token）
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：自动添加 token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

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

/**
 * 获取知识图谱可视化数据（ECharts 格式）
 */
export const getKnowledgeGraphData = async (): Promise<GraphData> => {
  const response = await apiClient.get('/knowledge-graph/visualization')
  return response.data
}

/**
 * 获取所有知识节点
 */
export const getAllNodes = async (): Promise<KnowledgeNode[]> => {
  const response = await apiClient.get('/knowledge-graph/nodes')
  return response.data
}

/**
 * 获取单个节点详情
 */
export const getNode = async (nodeId: string): Promise<KnowledgeNode> => {
  const response = await apiClient.get(`/knowledge-graph/nodes/${nodeId}`)
  return response.data
}

/**
 * 创建知识节点
 */
export const createNode = async (nodeData: Partial<KnowledgeNode>): Promise<any> => {
  const response = await apiClient.post('/knowledge-graph/nodes', nodeData)
  return response.data
}

/**
 * 更新知识节点
 */
export const updateNode = async (nodeId: string, updates: Partial<KnowledgeNode>): Promise<any> => {
  const response = await apiClient.put(`/knowledge-graph/nodes/${nodeId}`, updates)
  return response.data
}

/**
 * 删除知识节点
 */
export const deleteNode = async (nodeId: string): Promise<any> => {
  const response = await apiClient.delete(`/knowledge-graph/nodes/${nodeId}`)
  return response.data
}

/**
 * 获取所有知识关系
 */
export const getAllRelations = async (nodeId?: string): Promise<KnowledgeRelation[]> => {
  const params = nodeId ? { node_id: nodeId } : {}
  const response = await apiClient.get('/knowledge-graph/relations', { params })
  return response.data
}

/**
 * 创建知识关系
 */
export const createRelation = async (
  sourceId: string,
  targetId: string,
  relationType: string,
  description?: string
): Promise<any> => {
  const response = await apiClient.post('/knowledge-graph/relations', {
    source_id: sourceId,
    target_id: targetId,
    relation_type: relationType,
    description
  })
  return response.data
}

/**
 * 删除知识关系
 */
export const deleteRelation = async (relationId: string): Promise<any> => {
  const response = await apiClient.delete(`/knowledge-graph/relations/${relationId}`)
  return response.data
}

/**
 * 获取树形结构
 */
export const getTreeStructure = async (rootId: string = 'N001'): Promise<any> => {
  const response = await apiClient.get('/knowledge-graph/tree', {
    params: { root_id: rootId }
  })
  return response.data
}

/**
 * 获取学习路径
 */
export const getNodePath = async (nodeId: string, rootId: string = 'N001'): Promise<KnowledgeNode[]> => {
  const response = await apiClient.get('/knowledge-graph/path/' + nodeId, {
    params: { root_id: rootId }
  })
  return response.data
}
