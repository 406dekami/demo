import { type FC } from 'react'
import { Send } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

interface ChatInputProps {
  input: string
  loading: boolean
  onInputChange: (value: string) => void
  onSend: () => void
}

export const ChatInput: FC<ChatInputProps> = ({ input, loading, onInputChange, onSend }) => {
  const { isDark } = useTheme()
  return (
    <div className={`border-t p-4 ${isDark ? 'border-gray-800' : 'border-slate-200'}`}>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
          placeholder="输入你的问题..."
          className={`flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors ${
            isDark 
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-gray-500/50' 
              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-sky-300/50'
          }`}
        />
        <button
          onClick={onSend}
          disabled={loading || !input.trim()}
          className={`p-2.5 rounded-xl transition-colors disabled:cursor-not-allowed ${
            isDark
              ? 'bg-white hover:bg-gray-100 disabled:bg-gray-700 text-gray-900'
              : 'bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
