/**
 * 思维导图 API
 */
import apiClient from './client'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message: string
}

export interface MindMapNode {
  id: string
  parent_id: string | null
  title: string
  level: number
  node_type: string
  description: string | null
  order_index: number
  is_leaf: boolean
  icon?: string | null
  color?: string | null
  created_at?: string | null
  updated_at?: string | null
  children?: MindMapNode[]
}

export interface MindMapTreeResponse {
  success: boolean
  data: MindMapNode | null
  message: string
}

export interface QuestionsResponse {
  success: boolean
  data: string[]
  message: string
}

export interface ChatRequest {
  node_id: string
  question: string
  conversation_id?: string
}

export interface ChatResponse {
  success: boolean
  data: {
    answer: string
    conversation_id: string
    references?: string[]
  }
  message: string
}

/**
 * 获取完整的思维导图树
 */
export const getMindMapTree = async (rootId: string = 'root'): Promise<MindMapNode | null> => {
  try {
    const response = await apiClient.get<ApiResponse<MindMapNode>>(
      `/mind-map/tree?root_id=${rootId}`
    )
    console.log('API 原始响应:', response.data)
    if (response.data.success && response.data.data) {
      console.log('返回的树形数据:', response.data.data)
      console.log('根节点的子节点:', response.data.data.children)
      if (response.data.data.children && response.data.data.children.length > 0) {
        console.log('第一个子节点:', response.data.data.children[0])
        console.log('第一个子节点的 children:', response.data.data.children[0].children)
      }
      return response.data.data
    }
    return null
  } catch (error) {
    console.error('获取思维导图失败:', error)
    throw error
  }
}

/**
 * 获取单个节点详情
 */
export const getNode = async (nodeId: string): Promise<MindMapNode | null> => {
  try {
    const response = await apiClient.get<ApiResponse<MindMapNode>>(
      `/mind-map/node/${nodeId}`
    )
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    return null
  } catch (error) {
    console.error('获取节点失败:', error)
    throw error
  }
}

/**
 * 获取节点的子节点
 */
export const getNodeChildren = async (nodeId: string): Promise<MindMapNode[]> => {
  try {
    const response = await apiClient.get<ApiResponse<{ node_id: string; children: MindMapNode[] }>>(
      `/mind-map/node/${nodeId}/children`
    )
    if (response.data.success && response.data.data) {
      return response.data.data.children || []
    }
    return []
  } catch (error) {
    console.error('获取子节点失败:', error)
    throw error
  }
}

/**
 * 获取从根节点到当前节点的路径
 */
export const getNodePath = async (nodeId: string): Promise<MindMapNode[]> => {
  try {
    const response = await apiClient.get<ApiResponse<MindMapNode[]>>(
      `/mind-map/node/${nodeId}/path`
    )
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    return []
  } catch (error) {
    console.error('获取节点路径失败:', error)
    throw error
  }
}

/**
 * 获取节点的推荐问题
 */
export const getNodeQuestions = async (nodeId: string): Promise<string[]> => {
  try {
    const response = await apiClient.get<ApiResponse<string[]>>(
      `/mind-map/node/${nodeId}/questions`
    )
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    return []
  } catch (error) {
    console.error('获取推荐问题失败:', error)
    throw error
  }
}

/**
 * 搜索节点
 */
export const searchNodes = async (keyword: string, limit: number = 20): Promise<MindMapNode[]> => {
  try {
    const response = await apiClient.get<ApiResponse<{ keyword: string; count: number; nodes: MindMapNode[] }>>(
      `/mind-map/search?keyword=${keyword}&limit=${limit}`
    )
    if (response.data.success && response.data.data) {
      return response.data.data.nodes || []
    }
    return []
  } catch (error) {
    console.error('搜索节点失败:', error)
    throw error
  }
}

/**
 * 创建节点
 */
export const createNode = async (nodeData: Partial<MindMapNode>): Promise<MindMapNode | null> => {
  try {
    const response = await apiClient.post<ApiResponse<MindMapNode>>(
      '/mind-map/node',
      nodeData
    )
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    return null
  } catch (error) {
    console.error('创建节点失败:', error)
    throw error
  }
}

/**
 * 更新节点
 */
export const updateNode = async (nodeId: string, updates: Partial<MindMapNode>): Promise<boolean> => {
  try {
    const response = await apiClient.put<ApiResponse<MindMapNode>>(
      `/mind-map/node/${nodeId}`,
      updates
    )
    return response.data.success
  } catch (error) {
    console.error('更新节点失败:', error)
    throw error
  }
}

/**
 * 删除节点
 */
export const deleteNode = async (nodeId: string, cascade: boolean = false): Promise<boolean> => {
  try {
    const response = await apiClient.delete<ApiResponse<{ node_id: string }>>(
      `/mind-map/node/${nodeId}?cascade=${cascade}`
    )
    return response.data.success
  } catch (error) {
    console.error('删除节点失败:', error)
    throw error
  }
}

/**
 * 发送问题并获取答案
 */
export const sendQuestion = async (data: ChatRequest): Promise<ChatResponse> => {
  try {
    const response = await apiClient.post<ChatResponse>(
      '/mind-map/chat',
      data
    )
    return response.data
  } catch (error) {
    console.error('发送问题失败:', error)
    throw error
  }
}

// ==================== 学习进度 API ====================

export interface UserProgressResponse {
  success: boolean
  data: {
    completed_ids: string[]
    total_nodes: number
    completed_count: number
  }
  message: string
}

/**
 * 获取用户学习进度
 */
export const getUserProgress = async (): Promise<UserProgressResponse['data']> => {
  try {
    const response = await apiClient.get<UserProgressResponse>(
      '/mind-map/progress'
    )
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    return { completed_ids: [], total_nodes: 0, completed_count: 0 }
  } catch (error) {
    console.error('获取学习进度失败:', error)
    return { completed_ids: [], total_nodes: 0, completed_count: 0 }
  }
}

/**
 * 切换节点完成状态
 */
export const toggleNodeProgress = async (nodeId: string, isCompleted: boolean): Promise<boolean> => {
  try {
    const response = await apiClient.post<ApiResponse>(
      '/mind-map/progress/toggle',
      { node_id: nodeId, is_completed: isCompleted }
    )
    return response.data.success
  } catch (error) {
    console.error('切换节点进度失败:', error)
    return false
  }
}

/**
 * 批量同步进度
 */
export const batchSyncProgress = async (nodeIds: string[]): Promise<boolean> => {
  try {
    const response = await apiClient.post<ApiResponse>(
      '/mind-map/progress/batch-sync',
      { node_ids: nodeIds }
    )
    return response.data.success
  } catch (error) {
    console.error('批量同步进度失败:', error)
    return false
  }
}

/**
 * 重置学习进度
 */
export const resetProgress = async (): Promise<boolean> => {
  try {
    const response = await apiClient.post<ApiResponse>(
      '/mind-map/progress/reset'
    )
    return response.data.success
  } catch (error) {
    console.error('重置学习进度失败:', error)
    return false
  }
}
