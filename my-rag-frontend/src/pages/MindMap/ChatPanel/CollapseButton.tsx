import { type FC } from 'react'
import { MessageSquare } from 'lucide-react'

interface CollapseButtonProps {
  onClick: () => void
}

export const CollapseButton: FC<CollapseButtonProps> = ({ onClick }) => {
  return (
    <div
      className="fixed top-1/2 right-0 cursor-pointer z-20 bg-gray-800/90 backdrop-blur-xl rounded-l-xl border-l border-y border-gray-700 p-3 hover:bg-gray-700 transition-colors group"
      onClick={onClick}
      title="展开问答面板"
    >
      <MessageSquare className="w-6 h-6 text-gray-400 group-hover:text-gray-300" />
    </div>
  )
}
