import { type FC, useRef, useEffect } from 'react'
import type { Conversation } from './types'

interface ConversationWheelProps {
  conversations: Conversation[]
  activeConversationId: string | undefined
  onSwitch: (convId: string) => void
}

export const ConversationWheel: FC<ConversationWheelProps> = ({
  conversations,
  activeConversationId,
  onSwitch
}) => {
  const historyScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (historyScrollRef.current && conversations.length > 0) {
      const activeIndex = conversations.findIndex(c => c.id === activeConversationId)
      if (activeIndex !== -1) {
        const itemHeight = 56
        const containerHeight = historyScrollRef.current.clientHeight
        const scrollTo = (activeIndex * itemHeight) - (containerHeight / 2) + (itemHeight / 2)
        historyScrollRef.current.scrollTo({ top: scrollTo, behavior: 'smooth' })
      }
    }
  }, [activeConversationId, conversations])

  if (conversations.length === 0) {
    return (
      <div className="snap-center h-10 flex items-center justify-center text-gray-400 text-xs">
        暂无对话记录
      </div>
    )
  }

  return (
    <div
      ref={historyScrollRef}
      className="w-full h-full overflow-y-auto snap-y snap-mandatory py-6 z-20"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>
      {conversations.map((conv) => {
        const isActive = activeConversationId === conv.id
        return (
          <div
            key={conv.id}
            onClick={() => onSwitch(conv.id)}
            className={`snap-center h-10 flex items-center justify-between px-2 cursor-pointer transition-all ${
              isActive ? 'scale-100' : 'scale-90'
            }`}
          >
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>
                {conv.title}
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] shrink-0 ${isActive ? 'text-gray-300' : 'text-gray-600'}`}>
                  {conv.messages.length} 条消息
                </span>
                <span className={`text-[10px] shrink-0 ${isActive ? 'text-gray-300' : 'text-gray-600'}`}>
                  {new Date(conv.updatedAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
