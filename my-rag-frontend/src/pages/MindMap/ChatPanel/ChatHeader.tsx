import { type FC } from 'react'
import { Plus, History } from 'lucide-react'
import type { MindMapNode } from '@/api/mindMap'
import type { Conversation } from './types'
import { ConversationWheel } from './ConversationWheel'
import { useTheme } from '@/hooks/useTheme'

interface ChatHeaderProps {
  node: MindMapNode
  activeConversationId: string | undefined
  conversations: Conversation[]
  showHistory: boolean
  onToggleHistory: () => void
  onCreateNew: () => void
  onCollapse: () => void
  onSwitchConversation: (convId: string) => void
}

export const ChatHeader: FC<ChatHeaderProps> = ({
  node,
  activeConversationId,
  conversations,
  showHistory,
  onToggleHistory,
  onCreateNew,
  onCollapse,
  onSwitchConversation
}) => {
  const { isDark } = useTheme()
  return (
    <div className={`h-14 border-b px-4 flex items-center gap-3 relative ${isDark ? 'border-gray-800' : 'border-slate-200'}`}>
      <button
        onClick={onToggleHistory}
        className={`p-2 rounded-lg transition-colors shrink-0 ${
          isDark
            ? showHistory ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            : showHistory ? 'text-slate-900 bg-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
        }`}
        aria-label="对话历史"
        title="对话历史"
      >
        <History className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0 h-full relative">
        <div className={`absolute inset-0 flex flex-col justify-center transition-opacity duration-200 ${showHistory ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {(() => {
            const conv = activeConversationId ? conversations.find(c => c.id === activeConversationId) : null
            return conv ? (
              <>
                <h3 className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{conv.title}</h3>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                  {`${conv.messages.length} 条消息 · ${new Date(conv.updatedAt).toLocaleDateString('zh-CN')}`}
                </p>
              </>
            ) : (
              <>
                <h3 className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{node.title}</h3>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{node.is_leaf ? '知识点' : '章节'}</p>
              </>
            )
          })()}
        </div>

        {showHistory && (
          <div className="absolute inset-0 flex items-center">
            <div className="relative h-full overflow-hidden flex items-center" style={{ maxWidth: '70%' }}>
              <div className="absolute top-0 left-0 right-0 h-6 bg-linear-to-b from-gray-900 to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-linear-to-t from-gray-900 to-transparent z-10 pointer-events-none" />
              
              <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 border-y z-0 pointer-events-none rounded ${isDark ? 'bg-white/5 border-gray-600/50' : 'bg-slate-100/80 border-slate-300/50'}" />
              
              <ConversationWheel
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSwitch={onSwitchConversation}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onCreateNew}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
          aria-label="新建对话"
          title="新建对话"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={onCollapse}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
          aria-label="收起面板"
          title="收起面板"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
