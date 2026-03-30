// my-rag-frontend/src/stores/notebookStore.ts
import { create } from 'zustand'
import type { Message } from '@/types'

interface NotebookState {
  // 当前状态
  selectedKbIds: string[]
  conversationId: string | null
  messages: Message[]
  draft: string
  
  // 操作方法
  setSelectedKbIds: (kbIds: string[]) => void
  setConversationId: (id: string) => void
  addMessage: (message: Message) => void
  clearMessages: () => void
  setDraft: (text: string) => void
  
  // 持久化
  loadFromStorage: (notebookId: string) => void
  saveToStorage: (notebookId: string) => void
}

export const useNotebookStore = create<NotebookState>((set, get) => ({
  // 初始状态
  selectedKbIds: [],
  conversationId: null,
  messages: [],
  draft: '',
  
  // 设置选中的知识库
  setSelectedKbIds: (kbIds) => set({ selectedKbIds: kbIds }),
  
  // 设置对话 ID
  setConversationId: (id) => set({ conversationId: id }),
  
  // 添加消息
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  // 清空消息
  clearMessages: () => set({ messages: [] }),
  
  // 设置草稿
  setDraft: (text) => set({ draft: text }),
  
  // 从 localStorage 加载
  loadFromStorage: (notebookId) => {
    try {
      const key = `notebook_${notebookId}_conversation`
      const saved = localStorage.getItem(key)
      if (saved) {
        const data = JSON.parse(saved)
        set({
          conversationId: data.conversationId,
          messages: data.messages || [],
          selectedKbIds: data.selectedKbIds || []
        })
      }
    } catch (error) {
      console.error('加载对话历史失败:', error)
    }
  },
  
  // 保存到 localStorage
  saveToStorage: (notebookId) => {
    try {
      const state = get()
      const key = `notebook_${notebookId}_conversation`
      const data = {
        conversationId: state.conversationId,
        messages: state.messages,
        selectedKbIds: state.selectedKbIds,
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('保存对话历史失败:', error)
    }
  }
}))
