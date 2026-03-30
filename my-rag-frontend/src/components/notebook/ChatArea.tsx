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
  const [useKnowledgeGraph, setUseKnowledgeGraph] = useState(true) // 默认启用知识图谱
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, addMessage, draft, setDraft, saveToStorage } = useNotebookStore()

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 加载草稿
  useEffect(() => {
    const savedDraft = localStorage.getItem(`notebook_${notebookId}_draft`)
    if (savedDraft) {
      setDraft(JSON.parse(savedDraft))
    }
  }, [notebookId, setDraft])

  // 保存草稿
  useEffect(() => {
    localStorage.setItem(`notebook_${notebookId}_draft`, JSON.stringify(draft))
  }, [draft, notebookId])

  const sendMessage = async () => {
    if (!input.trim() || isLoading || kbIds.length === 0) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
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
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          query: input,
          kb_id: kbIds[0] || '',  // 使用第一个知识库 ID
          use_knowledge_graph: useKnowledgeGraph  // 传递 KG 开关
        })
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
        timestamp: new Date().toISOString()
      }

      addMessage(assistantMessage)
      saveToStorage(notebookId)
    } catch (error) {
      console.error('发送消息失败:', error)
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: '抱歉，发生错误，请稍后重试',
        timestamp: new Date().toISOString()
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
    <div className="flex flex-col h-full">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">开始提问，获取基于知识库的智能回答</p>
            <p className="text-gray-500 text-sm mt-2">Shift+Enter 换行，Enter 发送</p>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-800/50 p-4">
        <div className="space-y-3">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={kbIds.length === 0 ? "请先选择知识库" : "输入你的问题...（Shift+Enter 换行）"}
            className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all"
            rows={2}
            disabled={isLoading || kbIds.length === 0}
          />
          
          {/* 底部控制栏 */}
          <div className="flex items-center justify-between">
            {/* 左侧：知识图谱开关 */}
            <button
              type="button"
              onClick={() => setUseKnowledgeGraph(!useKnowledgeGraph)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                useKnowledgeGraph
                  ? 'bg-blue-500/10 hover:bg-blue-500/20' 
                  : 'bg-gray-800/50 hover:bg-gray-700/50'
              }`}
              title={useKnowledgeGraph ? '已启用知识图谱（教材）' : '已禁用知识图谱（仅用资料库）'}
              aria-label="切换知识图谱检索"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                useKnowledgeGraph
                  ? 'border-blue-500 bg-blue-500/20' 
                  : 'border-gray-600 bg-gray-700/50'
              }`}>
                {useKnowledgeGraph && (
                  <Network className="w-3 h-3 text-blue-400" />
                )}
              </div>
              <span className={`text-xs ${
                useKnowledgeGraph ? 'text-blue-400' : 'text-gray-400'
              }`}>
                {useKnowledgeGraph ? '📚 混合检索' : '📁 仅资料库'}
              </span>
            </button>
            
            {/* 右侧：发送按钮 */}
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || kbIds.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 disabled:shadow-none transition-all transform hover:scale-105 disabled:transform-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* 草稿提示 */}
          {draft && (
            <p className="text-xs text-gray-500">草稿已自动保存</p>
          )}
        </div>
      </div>
    </div>
  )
}
