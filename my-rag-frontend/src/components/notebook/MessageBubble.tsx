// my-rag-frontend/src/components/notebook/MessageBubble.tsx
import { useState } from 'react'
import type { JSX } from 'react'
import { User, Bot, Quote, ChevronDown, ChevronUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { Message } from '@/types'
import type { Components, ExtraProps } from 'react-markdown'

interface MessageBubbleProps {
  message: Message
}

// 使用 JSX.IntrinsicElements 和 ExtraProps 来定义 code 组件的 props
type CodeComponentProps = JSX.IntrinsicElements["code"] & ExtraProps & {
  inline?: boolean
}

const markdownComponents: Components = {
  a: ({ ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />,
  p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
  code: ({ inline, className, children, ...rest }: CodeComponentProps) => {
    const match = /language-(\w+)/.exec(className || '')
    return !inline && match ? (
      <code className="block bg-gray-900/50 p-3 rounded-lg text-sm font-mono text-green-400 overflow-x-auto" {...rest}>
        {children}
      </code>
    ) : (
      <code className="bg-gray-900/50 px-1.5 py-0.5 rounded text-sm font-mono text-pink-400" {...rest}>
        {children}
      </code>
    )
  }
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [showCitation, setShowCitation] = useState(false)
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* 头像 */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser
          ? 'bg-linear-to-br from-blue-500 to-blue-600'
          : 'bg-linear-to-br from-purple-500 to-purple-600'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block rounded-2xl px-4 py-3 text-left ${
          isUser
            ? 'bg-linear-to-br from-blue-600 to-blue-700 text-white'
            : 'bg-gray-800/80 backdrop-blur-sm border border-gray-700 text-gray-100'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-a:text-blue-400 hover:prose-a:text-blue-300">
              <ReactMarkdown components={markdownComponents}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* 引用来源 */}
        {!isUser && message.context && message.context.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowCitation(!showCitation)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              <Quote className="w-3 h-3" />
              <span>查看引用来源 ({message.context.length})</span>
              {showCitation ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {showCitation && (
              <div className="mt-2 space-y-2">
                {message.context.map((ctx, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 text-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500">来源 {idx + 1}</span>
                      <span className="text-blue-400 font-medium">
                        相似度：{(ctx.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-gray-400 leading-relaxed line-clamp-3">
                      {ctx.text}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-gray-500">
                      <Quote className="w-3 h-3" />
                      <span className="truncate">{ctx.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 时间戳 */}
        <p className={`text-xs text-gray-600 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleString('zh-CN')}
        </p>
      </div>
    </div>
  )
}
