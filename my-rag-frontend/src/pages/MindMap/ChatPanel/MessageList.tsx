import {type FC, useRef} from 'react'
import {MessageSquare} from 'lucide-react'
import type {Message as MessageType} from './types'
import {MarkdownContent} from './MarkdownContent'
import {useTheme} from '@/hooks/useTheme'

interface MessageListProps {
  messages: MessageType[]
  loading: boolean
}

export const MessageList: FC<MessageListProps> = ({ messages, loading }) => {
  const { isDark } = useTheme()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`
        .overflow-y-auto::-webkit-scrollbar { display: none; }
      `}</style>
      {messages.length === 0 ? (
        <div className={`text-center mt-8 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">开始提问吧！</p>
          <p className="text-xs mt-2">点击下方快捷问题或输入你的疑问</p>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? isDark ? 'bg-sky-500/20 text-sky-50 border border-sky-500/30' : 'bg-sky-100 text-sky-900'
                  : 'bg-transparent'
              }`}
            >
              {message.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className={isDark ? 'text-gray-100' : 'text-slate-900'}>
                  <MarkdownContent content={message.content} />
                </div>
              )}
              <p className={`text-xs mt-1 ${
                message.role === 'user' 
                  ? 'text-right ' + (isDark ? 'text-sky-200' : 'text-sky-700/70') 
                  : (isDark ? 'text-gray-500' : 'text-slate-400')
              }`}>
                {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))
      )}
      
      {loading && (
        <div className={`flex justify-start ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          <div className={`rounded-2xl px-4 py-3 flex items-center gap-2 ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
            <span className="text-xs">正在思考中</span>
            <div className="flex gap-1">
              <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-500' : 'bg-slate-400'}`} />
              <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-500' : 'bg-slate-400'}`} style={{ animationDelay: '0.2s' }} />
              <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-gray-500' : 'bg-slate-400'}`} style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
}
