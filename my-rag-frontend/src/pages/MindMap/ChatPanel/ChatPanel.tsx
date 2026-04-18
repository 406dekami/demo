/**
 * 问答面板组件 - 主文件
 */
import {useEffect, useMemo, useRef, useState} from 'react'
import {useTheme} from '@/hooks/useTheme'
import type {ChatRequest, MindMapNode} from '@/api/mindMap'
import {getNodeQuestions, sendQuestion} from '@/api/mindMap'
import toast from 'react-hot-toast'
import type {Conversation} from './types'
import {ChatHeader} from './ChatHeader'
import {MessageList} from './MessageList'
import {QuickQuestions} from './QuickQuestions'
import {ChatInput} from './ChatInput'
import {ResizeHandle} from './ResizeHandle'

// import { CollapseButton } from './CollapseButton'

interface ChatPanelProps {
  node: MindMapNode
  onToggleCollapse: () => void
  isCollapsed: boolean
  parentTitle?: string
}

export const ChatPanel = ({ node, onToggleCollapse, isCollapsed }: ChatPanelProps) => {
  const { isDark } = useTheme()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined)
  const prevNodeIdRef = useRef(node.id)
  const prevNodeTitleRef = useRef(node.title)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<string[]>([])
  const [width, setWidth] = useState(480)
  const [isResizing, setIsResizing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const messages = useMemo(
    () => conversations.find(c => c.id === activeConversationId)?.messages || [],
    [conversations, activeConversationId]
  )

  useEffect(() => {
    const prevId = prevNodeIdRef.current
    prevNodeIdRef.current = node.id
    prevNodeTitleRef.current = node.title

    // If node.id changed, reset conversations
    if (prevId !== node.id) {
      setConversations([])
      setActiveConversationId(undefined)
    }
    
    const savedConversations = localStorage.getItem(`mindmap-conversations-${node.id}`)
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations)
        const fixedConversations = parsed.map((conv: Conversation) => {
          const firstUserMessage = conv.messages.find(m => m.role === 'user')
          if (firstUserMessage) {
            const contentPreview = firstUserMessage.content.length > 15 
              ? firstUserMessage.content.slice(0, 15) + '...' 
              : firstUserMessage.content
            return { ...conv, title: `${node.title} - ${contentPreview}` }
          }
          return { ...conv, title: node.title }
        })
        setConversations(fixedConversations)
        const lastActiveId = localStorage.getItem(`mindmap-active-conversation-${node.id}`)
        if (lastActiveId && fixedConversations.find((c: Conversation) => c.id === lastActiveId)) {
          setActiveConversationId(lastActiveId)
        }
      } catch (error) {
        console.error('加载对话记录失败:', error)
      }
    }
  }, [node.id, node.title])

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(`mindmap-conversations-${node.id}`, JSON.stringify(conversations))
    }
  }, [conversations, node.id])

  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem(`mindmap-active-conversation-${node.id}`, activeConversationId)
    } else {
      localStorage.removeItem(`mindmap-active-conversation-${node.id}`)
    }
  }, [activeConversationId, node.id])

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = window.innerWidth - e.clientX
      const clampedWidth = Math.max(320, Math.min(newWidth, 800))
      setWidth(clampedWidth)
    }

    const handleResizeEnd = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [isResizing])

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const qs = await getNodeQuestions(node.id)
        setQuestions(qs)
      } catch (error) {
        console.error('加载推荐问题失败:', error)
      }
    }
    loadQuestions().catch(console.error)
  }, [node.id])

  const handleSend = async (content: string) => {
    if (!content.trim() || loading) return

    let currentConvId = activeConversationId
    if (!currentConvId) {
      const newConversation: Conversation = {
        id: crypto.randomUUID(),
        title: node.title,
        nodeId: node.id,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setConversations(prev => [newConversation, ...prev])
      currentConvId = newConversation.id
      setActiveConversationId(currentConvId)
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
    }

    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConvId) {
        return {
          ...conv,
          messages: [...conv.messages, userMessage],
          updatedAt: new Date().toISOString(),
        }
      }
      return conv
    }))
    
    setInput('')
    setLoading(true)

    try {
      const chatData: ChatRequest = {
        node_id: node.id,
        question: content,
        conversation_id: currentConvId,
      }

      const response = await sendQuestion(chatData)
      
      if (response.code === 0 && response.data) {
        const assistantMessage = {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: response.data.answer,
          timestamp: new Date().toISOString(),
        }
        
        setConversations(prev => prev.map(conv => {
          if (conv.id === currentConvId) {
            const isFirstMessage = conv.messages.length === 1
            if (isFirstMessage) {
              const contentPreview = content.length > 15 ? content.slice(0, 15) + '...' : content
              const newTitle = `${node.title} - ${contentPreview}`
              return {
                ...conv,
                messages: [...conv.messages, assistantMessage],
                title: newTitle,
                updatedAt: new Date().toISOString(),
              }
            }
            return {
              ...conv,
              messages: [...conv.messages, assistantMessage],
              updatedAt: new Date().toISOString(),
            }
          }
          return conv
        }))
      } else {
         
        throw new Error(response.message || '请求失败')
      }
    } catch (err) {
      console.error('发送消息失败:', err)
      toast.error('发送失败，请重试')
      
      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: '抱歉，回答失败，请重试。',
        timestamp: new Date().toISOString(),
      }
      setConversations(prev => prev.map(conv => {
        if (conv.id === currentConvId) {
          return {
            ...conv,
            messages: [...conv.messages, errorMessage],
            updatedAt: new Date().toISOString(),
          }
        }
        return conv
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionClick = async (question: string) => {
    await handleSend(question)
  }

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: node.title,
      nodeId: node.id,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setConversations(prev => [newConversation, ...prev])
    setActiveConversationId(newConversation.id)
    setShowHistory(false)
  }

  const switchConversation = (convId: string) => {
    setActiveConversationId(convId)
    setShowHistory(false)
  }

  const deleteConversation = (convId: string) => {
    setConversations(prev => prev.filter(c => c.id !== convId))
    if (activeConversationId === convId) {
      setActiveConversationId(undefined)
    }
    localStorage.removeItem(`mindmap-active-conversation-${node.id}`)
  }

  const handleSendMessage = async () => {
    await handleSend(input)
  }

  return (
    <>
      {/*{isCollapsed && (*/}
      {/*  <CollapseButton onClick={onToggleCollapse} />*/}
      {/*)}*/}

      <div
        ref={panelRef}
        className={`fixed top-16 right-0 bottom-0 backdrop-blur-xl border-l shadow-2xl z-30 flex flex-col transition-all duration-300 ${
          isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-slate-200'
        } ${
          isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-full opacity-100'
        }`}
        style={{ width: isCollapsed ? 0 : width }}
      >
        {!isCollapsed && (
          <ResizeHandle onMouseDown={handleResizeStart} />
        )}

        {!isCollapsed && (
          <ChatHeader
            node={node}
            activeConversationId={activeConversationId}
            conversations={conversations}
            showHistory={showHistory}
            onToggleHistory={() => setShowHistory(!showHistory)}
            onCreateNew={createNewConversation}
            onCollapse={onToggleCollapse}
            onSwitchConversation={switchConversation}
            onDeleteConversation={deleteConversation}
          />
        )}

        {!isCollapsed && (
          <>
            <MessageList messages={messages} loading={loading} />
            <QuickQuestions questions={questions} onQuestionClick={handleQuestionClick} />
            <ChatInput
              input={input}
              loading={loading}
              onInputChange={setInput}
              onSend={handleSendMessage}
            />
          </>
        )}
      </div>
    </>
  )
}
