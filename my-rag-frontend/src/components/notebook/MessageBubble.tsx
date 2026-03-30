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

type CodeComponentProps = JSX.IntrinsicElements['code'] & ExtraProps & {
  inline?: boolean
}

const markdownComponents: Components = {
  a: ({ ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />,
  p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
  code: ({ inline, className, children, ...rest }: CodeComponentProps) => {
    const match = /language-(\w+)/.exec(className || '')
    return !inline && match ? (
      <code className="block overflow-x-auto rounded-lg bg-slate-950/80 p-3 font-mono text-sm text-emerald-300" {...rest}>
        {children}
      </code>
    ) : (
      <code className="rounded bg-slate-950/80 px-1.5 py-0.5 font-mono text-sm text-fuchsia-300" {...rest}>
        {children}
      </code>
    )
  },
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [showCitation, setShowCitation] = useState(false)
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-sky-500 to-violet-500'}`}>
        {isUser ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
      </div>

      <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block max-w-3xl rounded-2xl px-4 py-3 text-left ${isUser ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20' : 'border border-slate-800/80 bg-slate-950/70 text-slate-100 backdrop-blur-sm'}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-a:text-sky-300 hover:prose-a:text-sky-200">
              <ReactMarkdown components={markdownComponents}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.context && message.context.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowCitation(!showCitation)}
              className="flex items-center gap-2 text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              <Quote className="h-3 w-3" />
              <span>查看引用来源 ({message.context.length})</span>
              {showCitation ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showCitation && (
              <div className="mt-2 space-y-2">
                {message.context.map((ctx, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800/80 bg-slate-950/55 p-3 text-xs"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-slate-500">来源 {idx + 1}</span>
                      <span className="font-medium text-sky-300">相似度：{(ctx.score * 100).toFixed(1)}%</span>
                    </div>
                    <p className="line-clamp-3 leading-relaxed text-slate-400">{ctx.text}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-slate-500">
                      <Quote className="h-3 w-3" />
                      <span className="truncate">{ctx.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className={`mt-1 text-xs text-slate-600 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleString('zh-CN')}
        </p>
      </div>
    </div>
  )
}
