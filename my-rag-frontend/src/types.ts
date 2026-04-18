// types.ts
export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  documentCount?: number
  model?: string
  created_at?: string
  updated_at?: string
  file_types?: string[]  // 支持的文件类型列表
  coverImage?: string  // 封面图片 URL
  coverColor?: string  // 封面纯色（hex）
}

export interface Notebook {
  id: string
  title: string
  coverColor: string
  pattern: 'dots' | 'waves' | 'tiles' | 'hearts' | 'rain' | 'triangles' | 'solid'
  lastUpdated: string | Date
  kb_ids?: string[]  // 关联的知识库 ID 列表
  coverImage?: string  // 封面图片 URL（可选）
}

// 文档类型
export interface Document {
  id: string
  name: string
  status: 'uploading' | 'processing' | 'done' | 'failed'
  chunkCount?: number
  uploadTime: string
  fileSize?: number
  progress?: number
  message?: string
}

// 上传中的文件
export interface UploadFile {
  id: string
  file: File
  status: 'uploading' | 'processing' | 'done' | 'failed'
  progress: number
  message?: string
}

// 消息类型
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  context?: Array<{
    text: string
    score: number
    source: string
  }>
  timestamp: string
}

// 对话类型
export interface Conversation {
  id: string
  title?: string
  messages: Message[]
  createdAt: string
}

// 统一 API 响应格式
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data?: T
}
