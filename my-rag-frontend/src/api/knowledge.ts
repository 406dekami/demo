// api/knowledge.ts - 知识库相关 API 调用
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

export interface KnowledgeBase {
  id: string
  tenant_id?: string  // 改为可选属性
  name: string
  description?: string
  embd_model?: string
  chunk_size?: number
  chunk_overlap?: number
  document_count?: number
  chunk_count?: number
  file_types?: string[]  // 新增：文档类型列表
  create_time?: number
  update_time?: number
  created_at?: string
  updated_at?: string
}

interface CreateKnowledgeBaseRequest {
  name: string
  description?: string
  chunk_size?: number
  chunk_overlap?: number
}

interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
}

/**
 * 创建知识库
 */
export const createKnowledgeBase = async (
  data: CreateKnowledgeBaseRequest
): Promise<KnowledgeBase> => {
  const response = await apiClient.post<ApiResponse<{ id: string; name: string; tenant_id?: string }>>(
    '/knowledge/create',
    data
  )
  
  if (response.data.code !== 0) {
    throw new Error(response.data.message || '创建失败')
  }
  
  return {
    id: response.data.data?.id ?? '',
    tenant_id: response.data.data?.tenant_id ?? '',
    name: response.data.data?.name ?? '',
    description: data.description,
    chunk_size: data.chunk_size,
    chunk_overlap: data.chunk_overlap,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * 获取知识库列表
 */
export const getKnowledgeBases = async (): Promise<KnowledgeBase[]> => {
  const response = await apiClient.get<ApiResponse<{ knowledge_bases: KnowledgeBase[] }>>(
    '/knowledge/list'
  )
  
  if (response.data.code !== 0) {
    throw new Error(response.data.message || '获取失败')
  }
  
  if (!response.data.data || !response.data.data.knowledge_bases) {
    return []
  }
  
  return response.data.data.knowledge_bases.map(kb => ({
    ...kb,
    created_at: kb.create_time ? new Date(kb.create_time).toISOString() : undefined,
    updated_at: kb.update_time ? new Date(kb.update_time).toISOString() : undefined,
  }))
}

/**
 * 删除知识库
 */
export const deleteKnowledgeBase = async (kbId: string): Promise<void> => {
  const response = await apiClient.delete<ApiResponse>(`/knowledge/${kbId}/delete`)
  
  if (response.data.code !== 0) {
    throw new Error(response.data.message || '删除失败')
  }
}

// ==================== 笔记本 API ====================

export interface Notebook {
  id: string
  title: string
  description?: string
  kb_ids: string[]
  model_name?: string
  system_prompt?: string
  created_at?: string
  updated_at?: string
}

interface CreateNotebookRequest {
  title: string
  description?: string
  kb_ids?: string[]
  model_name?: string
  system_prompt?: string
}

/**
 * 创建笔记本
 */
export const createNotebook = async (
  data: CreateNotebookRequest
): Promise<Notebook> => {
  const response = await apiClient.post<ApiResponse<{
    notebook_id: string
    title: string
    kb_ids?: string[]
  }>>(
    '/rag/notebook/create',
    data
  )
  
  if (response.data.code !== 0) {
    throw new Error(response.data.message || '创建失败')
  }
  
  if (!response.data.data) {
    throw new Error('创建失败：返回数据为空')
  }
  
  return {
    id: response.data.data?.notebook_id ?? '',
    title: response.data.data?.title ?? '',
    description: data.description,
    kb_ids: response.data.data?.kb_ids || data.kb_ids || [],
    model_name: data.model_name,
    system_prompt: data.system_prompt,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * 获取笔记本列表
 */
export const getNotebooks = async (): Promise<Notebook[]> => {
  const response = await apiClient.get<ApiResponse<{
    notebooks: Array<{
      notebook_id: string
      title: string
      kb_ids?: string[]
    }>
  }>>(
    '/rag/notebook/list'
  )
  
  if (response.data.code !== 0) {
    throw new Error(response.data.message || '获取失败')
  }
  
  if (!response.data.data || !response.data.data.notebooks) {
    return []
  }
  
  return response.data.data.notebooks.map(nb => ({
    id: nb.notebook_id,
    title: nb.title,
    kb_ids: nb.kb_ids || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))
}

/**
 * 删除笔记本
 */
export const deleteNotebook = async (notebookId: string): Promise<void> => {
  const response = await apiClient.delete<ApiResponse>(`/rag/notebook/${notebookId}/delete`)
  
  if (response.data.code !== 0) {
    throw new Error(response.data.message || '删除失败')
  }
}

/**
 * 更新笔记本
 */
export const updateNotebook = async (
  notebookId: string,
  data: {
    title: string  // 必填，后端需要
    description?: string
    kb_ids?: string[]
    model_name?: string
    system_prompt?: string
  }
): Promise<Notebook> => {
  const response = await apiClient.put<ApiResponse<{
    notebook_id: string
    title: string
    kb_ids?: string[]
  }>>(
    `/rag/notebook/${notebookId}`,
    data
  )
  
  if (response.data.code !== 0) {
    throw new Error(response.data.message || '更新失败')
  }
  
  if (!response.data.data) {
    throw new Error('更新失败：返回数据为空')
  }
  
  return {
    id: response.data.data?.notebook_id ?? '',
    title: response.data.data?.title ?? '',
    kb_ids: response.data.data?.kb_ids || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
