// ModelCard.tsx
import {type FC} from 'react'

export interface ModelCardProps {
  name: string
  logo?: string
  rank?: number
  tags: string[]
  isSelected?: boolean
  onClick?: () => void
  onTagClick?: (tag: string) => void
  onAdd?: () => void
}

export const ModelCard: FC<ModelCardProps> = ({
  name,
  logo,
  rank,
  tags,
  isSelected = false,
  onClick,
  onTagClick,
  onAdd
}) => {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={`group dark:bg-gray-900/50 bg-gray-100 backdrop-blur-sm rounded-2xl overflow-visible
                 border ${isSelected ? 'border-blue-500/50 shadow-blue-500/20' : 'dark:border-gray-800/80 border-gray-300'}
                 shadow-sm hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 hover:border-blue-500/30
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-offset-gray-100
                 transition-all duration-300 ease-out cursor-pointer flex flex-col relative z-0 hover:z-10`}
    >
      <div className="p-4">
        {/* Header: Logo + Name + Status */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            {logo ? (
              <img 
                src={logo} 
                alt={name} 
                className="w-8 h-8 rounded-lg object-cover shadow-sm"
              />
            ) : (
              <span className="text-2xl">🔹</span>
            )}
            <div>
              <h4 className="font-gs font-medium dark:text-white text-gray-900 dark:group-hover:text-blue-300 group-hover:text-blue-600 transition-colors">
                {name}
              </h4>
              {rank !== undefined && rank > 0 && (
                <span className="text-xs dark:text-gray-500 text-gray-500">Rank: {rank}</span>
              )}
            </div>
          </div>

          {/* 选中状态图标 */}
          {isSelected && (
            <span className="flex items-center justify-center w-6 h-6 rounded bg-green-500/20 text-green-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}

          {/* 添加按钮 - 仅在悬停时显示 */}
          {!isSelected && onAdd && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onAdd()
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                         bg-white text-gray-900 px-3 py-1.5 rounded-lg text-sm font-medium
                         hover:bg-gray-100 focus:opacity-100 focus:outline-none focus:ring-2 
                         focus:ring-white/50 flex items-center gap-1.5"
              aria-label={`添加 ${name}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <span
                key={tag}
                onClick={(e) => {
                  e.stopPropagation()
                  onTagClick?.(tag)
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] cursor-pointer transition-all duration-200 ${
                  tag === 'LLM' 
                    ? 'dark:bg-blue-500/20 bg-blue-100 dark:text-blue-300 text-blue-700 dark:hover:bg-blue-500/30 hover:bg-blue-200'
                    : tag === 'Embedding'
                    ? 'dark:bg-purple-500/20 bg-purple-100 dark:text-purple-300 text-purple-700 dark:hover:bg-purple-500/30 hover:bg-purple-200'
                    : tag === 'Rerank'
                    ? 'dark:bg-orange-500/20 bg-orange-100 dark:text-orange-300 text-orange-700 dark:hover:bg-orange-500/30 hover:bg-orange-200'
                    : tag === 'TTS'
                    ? 'dark:bg-green-500/20 bg-green-100 dark:text-green-300 text-green-700 dark:hover:bg-green-500/30 hover:bg-green-200'
                    : tag === 'ASR'
                    ? 'dark:bg-yellow-500/20 bg-yellow-100 dark:text-yellow-300 text-yellow-700 dark:hover:bg-yellow-500/30 hover:bg-yellow-200'
                    : tag === 'VLM'
                    ? 'dark:bg-pink-500/20 bg-pink-100 dark:text-pink-300 text-pink-700 dark:hover:bg-pink-500/30 hover:bg-pink-200'
                    : tag === 'MODERATION'
                    ? 'dark:bg-red-500/20 bg-red-100 dark:text-red-300 text-red-700 dark:hover:bg-red-500/30 hover:bg-red-200'
                    : tag === 'OCR'
                    ? 'dark:bg-cyan-500/20 bg-cyan-100 dark:text-cyan-300 text-cyan-700 dark:hover:bg-cyan-500/30 hover:bg-cyan-200'
                    : 'dark:bg-gray-700/50 bg-gray-200 dark:text-gray-400 text-gray-600 dark:hover:bg-gray-600/50 hover:bg-gray-300 dark:hover:text-gray-200 hover:text-gray-800'
                }`}
                title={`筛选：${tag}`}
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-[10px] dark:text-gray-600 text-gray-500 italic">暂无标签</span>
          )}
        </div>
      </div>
    </article>
  )
}
