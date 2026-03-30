import { type FC } from 'react'
import { useTheme } from '@/hooks/useTheme'

interface QuickQuestionsProps {
  questions: string[]
  onQuestionClick: (question: string) => void
}

export const QuickQuestions: FC<QuickQuestionsProps> = ({ questions, onQuestionClick }) => {
  const { isDark } = useTheme()
  if (questions.length === 0) return null

  return (
    <div className={`border-t px-4 py-3 ${isDark ? 'border-gray-800' : 'border-slate-200'}`}>
      <p className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>快捷问题</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}
