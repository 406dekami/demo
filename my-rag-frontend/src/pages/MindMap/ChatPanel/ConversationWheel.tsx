import {type FC, useEffect, useRef} from 'react'
import {ChevronLeft, ChevronRight, Trash2} from 'lucide-react'
import type {Conversation} from './types'
import {useTheme} from '@/hooks/useTheme'

interface ConversationWheelProps {
  conversations: Conversation[]
  activeConversationId: string | undefined
  onSwitch: (convId: string) => void
  onDelete?: (convId: string) => void
}

export const ConversationWheel: FC<ConversationWheelProps> = ({
  conversations,
  activeConversationId,
  onSwitch,
  onDelete
}) => {
  const historyScrollRef = useRef<HTMLDivElement>(null)
  const { isDark } = useTheme()

  useEffect(() => {
    if (historyScrollRef.current && conversations.length > 0) {
      const activeIndex = conversations.findIndex(c => c.id === activeConversationId)
      if (activeIndex !== -1) {
        const itemWidth = 160
        const containerWidth = historyScrollRef.current.clientWidth
        const scrollTo = (activeIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2)
        historyScrollRef.current.scrollTo({ left: scrollTo, behavior: 'auto' })
      }
    }
  }, [activeConversationId, conversations])

  const scrollLeft = () => {
    if (historyScrollRef.current) {
      historyScrollRef.current.scrollBy({ left: -160, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (historyScrollRef.current) {
      historyScrollRef.current.scrollBy({ left: 160, behavior: 'smooth' })
    }
  }

  if (conversations.length === 0) {
    return (
      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
        暂无对话记录
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 w-full">
      {/* 左滚动按钮 */}
      {conversations.length > 1 && (
        <button
          onClick={scrollLeft}
          className={`shrink-0 p-1.5 rounded-lg transition-all ${
            isDark 
              ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* 滚动列表 */}
      <div
        ref={historyScrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>
        <div className="flex gap-2">
          {conversations.map((conv) => {
            const isActive = activeConversationId === conv.id
            return (
              <div
                key={conv.id}
                onClick={() => onSwitch(conv.id)}
                className={`group shrink-0 cursor-pointer rounded-lg px-3 py-2 border transition-all relative ${
                  isActive
                    ? isDark
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-sky-500 bg-sky-50'
                    : isDark
                      ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <p className={`text-xs font-medium truncate pr-4 ${
                  isActive
                    ? isDark
                      ? 'text-sky-400'
                      : 'text-sky-700'
                    : isDark
                      ? 'text-gray-300'
                      : 'text-slate-700'
                }`}>
                  {conv.title}
                </p>
                <p className={`text-[10px] mt-0.5 pr-4 ${
                  isDark ? 'text-gray-500' : 'text-slate-400'
                }`}>
                  {conv.messages.length} 条 · {new Date(conv.updatedAt).toLocaleDateString('zh-CN')}
                </p>
                
                {/* 删除按钮 */}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(conv.id)
                    }}
                    className="absolute bottom-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 text-slate-300 hover:text-red-500"
                    title="删除对话"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 右滚动按钮 */}
      {conversations.length > 1 && (
        <button
          onClick={scrollRight}
          className={`shrink-0 p-1.5 rounded-lg transition-all ${
            isDark 
              ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-800' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
