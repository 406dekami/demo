// my-rag-frontend/src/stores/notebookStore.ts
import {create} from 'zustand'
import type {Message} from '@/types'

interface NotebookState {
  selectedKbIds: string[]
  conversationId: string | null
  messages: Message[]
  draft: string
  setSelectedKbIds: (kbIds: string[]) => void
  setConversationId: (id: string) => void
  addMessage: (message: Message) => void
  clearMessages: () => void
  setDraft: (text: string) => void
  loadFromStorage: (notebookId: string) => void
  saveToStorage: (notebookId: string) => void
}

export const useNotebookStore = create<NotebookState>((set, get) => ({
  selectedKbIds: [],
  conversationId: null,
  messages: [],
  draft: '',

  setSelectedKbIds: (kbIds) => set({ selectedKbIds: kbIds.slice(0, 1) }),
  setConversationId: (id) => set({ conversationId: id }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  setDraft: (text) => set({ draft: text }),

  loadFromStorage: (notebookId) => {
    try {
      const key = `notebook_${notebookId}_conversation`
      const saved = localStorage.getItem(key)
      if (saved) {
        const data = JSON.parse(saved)
        set({
          conversationId: data.conversationId || notebookId,
          messages: data.messages || [],
          selectedKbIds: (data.selectedKbIds || []).slice(0, 1),
        })
        return
      }

      set({
        conversationId: notebookId,
        messages: [],
      })
    } catch (error) {
      console.error('加载对话历史失败:', error)
      set({ conversationId: notebookId, messages: [] })
    }
  },

  saveToStorage: (notebookId) => {
    try {
      const state = get()
      const key = `notebook_${notebookId}_conversation`
      localStorage.setItem(key, JSON.stringify({
        conversationId: state.conversationId,
        messages: state.messages,
        selectedKbIds: state.selectedKbIds.slice(0, 1),
        updatedAt: new Date().toISOString(),
      }))
    } catch (error) {
      console.error('保存对话历史失败:', error)
    }
  },
}))
