// my-rag-frontend/src/components/notebook/ChatArea.tsx
import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Network } from 'lucide-react'
import MessageBubble from './MessageBubble'
import { useNotebookStore } from '@/stores/notebookStore'
import type { Message } from '@/types'

interface ChatAreaProps {
  kbIds: string[]
  notebookId: string
}

export default function ChatArea({ kbIds, notebookId }: ChatAreaProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [useKnowledgeGraph, setUseKnowledgeGraph] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, addMessage, draft, setDraft, saveToStorage } = useNotebookStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const savedDraft = localStorage.getItem(`notebook_${notebookId}_draft`)
    if (savedDraft) {
      setDraft(JSON.parse(savedDraft))
      setInput(JSON.parse(savedDraft))
    }
  }, [notebookId, setDraft])

  useEffect(() => {
    localStorage.setItem(`notebook_${notebookId}_draft`, JSON.stringify(draft))
  }, [draft, notebookId])

  const sendMessage = async () => {
    if (!input.trim() || isLoading || kbIds.length === 0) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    addMessage(userMessage)
    setInput('')
    setDraft('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/v1/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          query: input,
          kb_id: kbIds[0] || '',
          use_knowledge_graph: useKnowledgeGraph,
        }),
      })

      if (!response.ok) {
        throw new Error('请求失败')
      }

      const result = await response.json()

      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: result.data?.answer || '抱歉，我没有找到相关信息',
        context: result.data?.context,
        timestamp: new Date().toISOString(),
      }

      addMessage(assistantMessage)
      saveToStorage(notebookId)
    } catch (error) {
      console.error('发送消息失败:', error)
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: '抱歉，发生错误，请稍后重试',
        timestamp: new Date().toISOString(),
      }
      addMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
    setDraft(value)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-sky-400/15 bg-sky-500/10 text-sky-300 shadow-[0_0_28px_rgba(56,189,248,.12)]">
              <Bot className="h-8 w-8" />
            </div>
            <p className="text-slate-300">开始提问，获取基于知识库的智能回答</p>
            <p className="mt-2 text-sm text-slate-500">Shift+Enter 换行，Enter 发送</p>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-500">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3 backdrop-blur-sm">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: '0.2s' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t border-slate-800/80 bg-slate-950/35 p-4 backdrop-blur-sm">
        <div className="space-y-3">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={kbIds.length === 0 ? '请先选择知识库' : '输入你的问题...（Shift+Enter 换行）'}
            className="w-full resize-none rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-sky-400/35 focus:outline-none focus:ring-2 focus:ring-sky-400/10"
            rows={2}
            disabled={isLoading || kbIds.length === 0}
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setUseKnowledgeGraph(!useKnowledgeGraph)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all ${useKnowledgeGraph ? 'bg-sky-500/10 text-sky-300 hover:bg-sky-500/20' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/80'}`}
              title={useKnowledgeGraph ? '已启用知识图谱（教材）' : '已禁用知识图谱（仅用资料库）'}
              aria-label="切换知识图谱检索"
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${useKnowledgeGraph ? 'border-sky-500 bg-sky-500/20' : 'border-slate-600 bg-slate-700/50'}`}>
                {useKnowledgeGraph && <Network className="h-3 w-3 text-sky-400" />}
              </div>
              <span className="text-xs">{useKnowledgeGraph ? '📚 混合检索' : '📁 仅资料库'}</span>
            </button>

            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || kbIds.length === 0}
              className="rounded-xl bg-blue-600 px-6 py-2 text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

          {draft && <p className="text-xs text-slate-500">草稿已自动保存</p>}
        </div>
      </div>
    </div>
  )
}
