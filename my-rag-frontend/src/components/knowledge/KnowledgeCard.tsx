// KnowledgeCard.tsx
import {type FC } from 'react'
import { useNavigate } from 'react-router-dom'
import type { KnowledgeBase, Notebook } from '@/types'
import { NotebookCover } from './NotebookCover'
import { Trash2, FileText, File, FileSpreadsheet, FileCode } from 'lucide-react'

interface Props {
  base: KnowledgeBase
  preview: Notebook
  onDelete: (id: string) => void
}

const formatDate = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')
}

export const KnowledgeCard: FC<Props> = ({ base, preview, onDelete }) => {
  const navigate = useNavigate()

  // 调试：查看返回的数据
  console.log('📦 KnowledgeBase data:', {
    id: base.id,
    name: base.name,
    documentCount: base.documentCount,
    file_types: base.file_types
  })

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/knowledge/${base.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/knowledge/${base.id}`)}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-200
                 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-300
                 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2
                 transition-all duration-300 ease-out cursor-pointer flex flex-col min-h-[280px]
                 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:shadow-xl dark:hover:shadow-blue-500/20"
    >
      <NotebookCover notebook={preview} />

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="font-gs font-medium text-gray-900 text-base truncate group-hover:text-blue-600 transition-colors dark:text-gray-100 dark:group-hover:text-blue-400">
            {base.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-2 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {base.documentCount || 0} 个文档
            </span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>{formatDate(base.updated_at || new Date())}</span>
          </p>
          {base.model && (
            <p className="text-xs text-gray-400 mt-2 truncate flex items-center gap-1.5 dark:text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" aria-hidden="true" />
              模型：{base.model}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          {/* Document Avatars - 显示文档类型图标 */}
          <div className="flex -space-x-1.5">
            {base.file_types && base.file_types.length > 0 && (base.documentCount || 0) > 0 ? (
              // 显示实际的文档类型图标（只有当有文档时才显示）
              base.file_types.slice(0, 3).map((fileType, idx) => {
                console.log(`🔍 渲染图标 ${idx}:`, { fileType, base })
                // 移除文件扩展名中的点（如果存在）
                const cleanType = fileType.replace(/^\./, '')
                console.log(`  清理后的类型：${cleanType}`)
                return (
                  <div
                    key={`${base.id}-doc-${idx}`}
                    className="w-6 h-6 rounded-full bg-gray-100
                               border-2 border-white flex items-center justify-center
                               shadow-sm dark:bg-gray-700 dark:border-gray-800"
                    aria-hidden="true"
                  >
                    {cleanType === 'txt' && (
                      <FileText className="w-3 h-3 text-blue-500" />
                    )}
                    {cleanType === 'pdf' && (
                      <File className="w-3 h-3 text-red-500" />
                    )}
                    {cleanType === 'docx' && (
                      <FileSpreadsheet className="w-3 h-3 text-green-500" />
                    )}
                    {cleanType === 'md' && (
                      <FileCode className="w-3 h-3 text-purple-500" />
                    )}
                  </div>
                )
              })
            ) : null}
            {(base.documentCount || 0) > 3 && (
              <div 
                key={`${base.id}-doc-more`}
                className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white
                          flex items-center justify-center text-[8px] font-medium text-gray-400
                          dark:bg-gray-700 dark:border-gray-800 dark:text-gray-500">
                +{(base.documentCount || 0) - 3}
              </div>
            )}
          </div>

          {/* Delete Button */}
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50
                       rounded-lg transition-all duration-200
                       opacity-0 group-hover:opacity-100 focus:opacity-100
                       focus:outline-none focus:ring-2 focus:ring-red-500/50
                       dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-500/10"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(base.id)
            }}
            aria-label={`删除知识库：${base.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  )
}