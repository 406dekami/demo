// api/knowledge.ts - 知识库与笔记本相关 API 调用
import apiClient from './client'

export interface KnowledgeBase {
  id: string
  tenant_id?: string
  name: string
  description?: string
  chunk_size?: number
  chunk_overlap?: number
  document_count?: number
  chunk_count?: number
  file_types?: string[]
  create_time?: number
  update_time?: number
  created_at?: string
  updated_at?: string
  cover_image?: string
  cover_color?: string
  coverImage?: string
  coverColor?: string
}

interface CreateKnowledgeBaseRequest {
  name: string
  description?: string
  chunk_size?: number
  chunk_overlap?: number
  coverColor?: string
  coverImage?: string
}

interface UpdateKnowledgeBaseRequest {
  name: string
  description?: string
  coverColor?: string
  coverImage?: string
}

interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
}

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

export const createKnowledgeBase = async (data: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> => {
  const response = await apiClient.post<ApiResponse<{ id: string; name: string; tenant_id?: string }>>('/knowledge/create', {
    name: data.name,
    description: data.description,
    chunk_size: data.chunk_size,
    chunk_overlap: data.chunk_overlap,
    cover_image: data.coverImage,
    cover_color: data.coverColor,
  })

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
    coverImage: data.coverImage,
    coverColor: data.coverColor,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export const updateKnowledgeBase = async (kbId: string, data: UpdateKnowledgeBaseRequest): Promise<KnowledgeBase> => {
  const response = await apiClient.put<ApiResponse<KnowledgeBase>>(`/knowledge/${kbId}`, {
    name: data.name,
    description: data.description,
    cover_image: data.coverImage,
    cover_color: data.coverColor,
  })

  if (response.data.code !== 0 || !response.data.data) {
    throw new Error(response.data.message || '更新失败')
  }

  const kb = response.data.data
  return {
    id: kb.id,
    tenant_id: kb.tenant_id,
    name: kb.name,
    description: kb.description,
    chunk_size: kb.chunk_size,
    chunk_overlap: kb.chunk_overlap,
    document_count: kb.document_count,
    chunk_count: kb.chunk_count,
    file_types: kb.file_types,
    coverImage: kb.cover_image,
    coverColor: kb.cover_color,
    created_at: kb.create_time ? new Date(kb.create_time).toISOString() : undefined,
    updated_at: kb.update_time ? new Date(kb.update_time).toISOString() : undefined,
  }
}

export const getKnowledgeBases = async (): Promise<KnowledgeBase[]> => {
  const response = await apiClient.get<ApiResponse<{ knowledge_bases: KnowledgeBase[] }>>('/knowledge/list')

  if (response.data.code !== 0) {
    throw new Error(response.data.message || '获取失败')
  }

  return (response.data.data?.knowledge_bases || []).map((kb) => ({
    id: kb.id,
    tenant_id: kb.tenant_id,
    name: kb.name,
    description: kb.description,
    chunk_size: kb.chunk_size,
    chunk_overlap: kb.chunk_overlap,
    document_count: kb.document_count,
    chunk_count: kb.chunk_count,
    documentCount: kb.document_count,
    file_types: kb.file_types,
    coverImage: kb.cover_image,
    coverColor: kb.cover_color,
    created_at: kb.create_time ? new Date(kb.create_time).toISOString() : undefined,
    updated_at: kb.update_time ? new Date(kb.update_time).toISOString() : undefined,
  }))
}

export const getKnowledgeBaseDocuments = async (kbId: string) => {
  const response = await apiClient.get<ApiResponse<{ kb_id: string; documents: Array<Record<string, unknown>> }>>(`/knowledge/${kbId}/documents`)
  if (response.data.code !== 0) {
    throw new Error(response.data.message || '获取文档失败')
  }
  return response.data.data?.documents || []
}

export interface DocumentChunk {
  id: string
  chunk_index: number
  content: string
  meta_info?: string
  create_time?: number
}

export interface DocumentPreviewData {
  kb_id: string
  doc_id: string
  doc_name: string
  file_type: string
  file_path: string
  chunks: DocumentChunk[]
  total: number
  page: number
  page_size: number
}

export interface DocumentContentData {
  kb_id: string
  doc_id: string
  doc_name: string
  file_type: string
  content: string
}

export const getDocumentContent = async (
  kbId: string,
  docId: string
): Promise<DocumentContentData> => {
  const response = await apiClient.get<ApiResponse<DocumentContentData>>(
    `/knowledge/${kbId}/documents/${docId}/content`
  )
  if (response.data.code !== 0 || !response.data.data) {
    throw new Error(response.data.message || '获取文档内容失败')
  }
  return response.data.data
}

export const getDocumentChunks = async (
  kbId: string,
  docId: string,
  page = 1,
  pageSize = 10
): Promise<DocumentPreviewData> => {
  const response = await apiClient.get<ApiResponse<DocumentPreviewData>>(
    `/knowledge/${kbId}/documents/${docId}/chunks`,
    { params: { page, page_size: pageSize } }
  )
  if (response.data.code !== 0 || !response.data.data) {
    throw new Error(response.data.message || '获取文档内容失败')
  }
  return response.data.data
}

export const deleteKnowledgeDocument = async (kbId: string, docId: string): Promise<void> => {
  const response = await apiClient.delete<ApiResponse>(`/knowledge/${kbId}/documents/${docId}/delete`)
  if (response.data.code !== 0) {
    throw new Error(response.data.message || '删除失败')
  }
}

export const uploadKnowledgeFiles = async (kbId: string, files: File[]): Promise<{ files: Array<{ file_id: string; file_name: string }> }> => {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  const response = await apiClient.post<ApiResponse<{ files: Array<{ file_id: string; file_name: string }> }>>(`/knowledge/${kbId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  if (response.data.code !== 0 || !response.data.data) {
    throw new Error(response.data.message || '上传失败')
  }
  return response.data.data
}

export const processDocument = async (documentId: string, chunkSize = 512, chunkOverlap = 50) => {
  const response = await apiClient.post<ApiResponse<{ chunk_count: number; vector_count: number }>>('/rag/process', {
    document_id: documentId,
    chunk_size: chunkSize,
    chunk_overlap: chunkOverlap,
  })
  if (response.data.code !== 0) {
    throw new Error(response.data.message || '处理失败')
  }
  return response.data.data
}

export const deleteKnowledgeBase = async (kbId: string): Promise<void> => {
  const response = await apiClient.delete<ApiResponse>(`/knowledge/${kbId}/delete`)
  if (response.data.code !== 0) {
    throw new Error(response.data.message || '删除失败')
  }
}

export const createNotebook = async (data: CreateNotebookRequest): Promise<Notebook> => {
  const response = await apiClient.post<ApiResponse<{ notebook_id: string; title: string; kb_ids?: string[] }>>('/rag/notebook/create', data)
  if (response.data.code !== 0 || !response.data.data) {
    throw new Error(response.data.message || '创建失败')
  }
  return {
    id: response.data.data.notebook_id,
    title: response.data.data.title,
    description: data.description,
    kb_ids: response.data.data.kb_ids || data.kb_ids || [],
    model_name: data.model_name,
    system_prompt: data.system_prompt,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export const getNotebooks = async (): Promise<Notebook[]> => {
  const response = await apiClient.get<ApiResponse<{ notebooks: Array<{ notebook_id: string; title: string; kb_ids?: string[] }> }>>('/rag/notebook/list')
  if (response.data.code !== 0) {
    throw new Error(response.data.message || '获取失败')
  }
  return (response.data.data?.notebooks || []).map((nb) => ({
    id: nb.notebook_id,
    title: nb.title,
    kb_ids: nb.kb_ids || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))
}

export const deleteNotebook = async (notebookId: string): Promise<void> => {
  const response = await apiClient.delete<ApiResponse>(`/rag/notebook/${notebookId}/delete`)
  if (response.data.code !== 0) {
    throw new Error(response.data.message || '删除失败')
  }
}

export const updateNotebook = async (notebookId: string, data: { title: string; description?: string; kb_ids?: string[]; model_name?: string; system_prompt?: string }): Promise<Notebook> => {
  const response = await apiClient.put<ApiResponse<{ notebook_id: string; title: string; kb_ids?: string[] }>>(`/rag/notebook/${notebookId}`, data)
  if (response.data.code !== 0 || !response.data.data) {
    throw new Error(response.data.message || '更新失败')
  }
  return {
    id: response.data.data.notebook_id,
    title: response.data.data.title,
    kb_ids: response.data.data.kb_ids || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export const queryNotebook = async (payload: { query: string; kb_id: string; conversation_id?: string | null; use_knowledge_graph: boolean }) => {
  const response = await apiClient.post<ApiResponse<{ answer: string; context: Array<{ text: string; score: number; source: string }>; conversation_id?: string; model: string }>>('/rag/query', payload)
  if (response.data.code !== 0 || !response.data.data) {
    throw new Error(response.data.message || '提问失败')
  }
  return response.data.data
}
