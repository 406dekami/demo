import { type FC } from 'react'

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
}

export const ResizeHandle: FC<ResizeHandleProps> = ({ onMouseDown }) => {
  return (
    <div
      className="absolute top-0 left-0 bottom-0 w-1 cursor-col-resize z-20 hover:bg-gray-500/50 transition-colors group"
      onMouseDown={onMouseDown}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 rounded-full bg-gray-700/50 group-hover:bg-gray-500/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-0.5 h-4 bg-gray-400 rounded-full" />
      </div>
    </div>
  )
}
