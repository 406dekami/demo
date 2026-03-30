// my-rag-frontend/src/stores/knowledgeStore.ts
import { create } from 'zustand'
import type { KnowledgeBase, Document, UploadFile } from '@/types'

interface KnowledgeState {
  // 当前知识库
  currentKb: KnowledgeBase | null
  documents: Document[]
  isEditMode: boolean
  
  // 上传状态
  uploadingFiles: UploadFile[]
  
  // 操作方法
  setCurrentKb: (kb: KnowledgeBase) => void
  setDocuments: (docs: Document[]) => void
  addDocuments: (docs: Document[]) => void
  removeDocument: (docId: string) => void
  toggleEditMode: () => void
  confirmEdit: () => void
  
  // 上传管理
  addUploadingFile: (file: UploadFile) => void
  updateUploadingFile: (id: string, updates: Partial<UploadFile>) => void
  removeUploadingFile: (id: string) => void
  clearUploadingFiles: () => void
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  // 初始状态
  currentKb: null,
  documents: [],
  isEditMode: false,
  uploadingFiles: [],
  
  // 设置当前知识库
  setCurrentKb: (kb) => set({ currentKb: kb }),
  
  // 设置文档列表（覆盖）
  setDocuments: (docs) => set({ documents: docs }),
  
  // 添加文档
  addDocuments: (docs) => set((state) => ({
    documents: [...state.documents, ...docs]
  })),
  
  // 删除文档
  removeDocument: (docId) => set((state) => ({
    documents: state.documents.filter(d => d.id !== docId)
  })),
  
  // 切换编辑模式
  toggleEditMode: () => set((state) => ({
    isEditMode: !state.isEditMode
  })),
  
  // 确认编辑（退出编辑模式）
  confirmEdit: () => set({ isEditMode: false }),
  
  // 添加上传文件
  addUploadingFile: (file) => set((state) => ({
    uploadingFiles: [...state.uploadingFiles, file]
  })),
  
  // 更新上传文件状态
  updateUploadingFile: (id, updates) => set((state) => ({
    uploadingFiles: state.uploadingFiles.map(f =>
      f.id === id ? { ...f, ...updates } : f
    )
  })),
  
  // 移除上传文件
  removeUploadingFile: (id) => set((state) => ({
    uploadingFiles: state.uploadingFiles.filter(f => f.id !== id)
  })),
  
  // 清空上传文件
  clearUploadingFiles: () => set({ uploadingFiles: [] })
}))
