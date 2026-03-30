// KnowledgeCard.tsx
import { type FC, useState, useEffect } from 'react'
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
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light')

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ isDark: boolean }>).detail
      setIsDark(detail.isDark)
    }
    window.addEventListener('themeChange', handler)
    return () => window.removeEventListener('themeChange', handler)
  }, [])

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/knowledge/${base.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/knowledge/${base.id}`)}
      className={`group flex min-h-[280px] cursor-pointer flex-col overflow-hidden rounded-[28px] text-left transition duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDark ? 'border-slate-800/80 bg-slate-950/55 shadow-[0_20px_80px_rgba(2,6,23,.45)] hover:border-sky-400/35 hover:bg-slate-900/70 hover:shadow-[0_24px_90px_rgba(14,165,233,.12)] focus:ring-sky-400/40 focus:ring-offset-slate-950' : 'border-blue-200/60 bg-white/70 shadow-lg hover:border-blue-400 hover:bg-white/90 hover:shadow-xl focus:ring-blue-400/40 focus:ring-offset-white'}`}
    >
      <NotebookCover notebook={preview} />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          <h3 className={`truncate text-lg font-semibold transition-colors group-hover:text-sky-200 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {base.name}
          </h3>
          <p className={`mt-2 flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {base.documentCount || 0} 个文档
            </span>
            <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>•</span>
            <span>{formatDate(base.updated_at || new Date())}</span>
          </p>
          {base.model && (
            <p className={`mt-2 truncate text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              模型：{base.model}
            </p>
          )}
        </div>

        <div className={`mt-4 flex items-center justify-between border-t pt-3 ${isDark ? 'border-slate-800/80' : 'border-slate-200/80'}`}>
          <div className="flex -space-x-1.5">
            {base.file_types && base.file_types.length > 0 && (base.documentCount || 0) > 0 ? (
              base.file_types.slice(0, 3).map((fileType, idx) => {
                const cleanType = fileType.replace(/^\./, '')
                return (
                  <div
                    key={`${base.id}-doc-${idx}`}
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 shadow-sm ${isDark ? 'border-slate-950 bg-slate-800' : 'border-white bg-slate-100'}`}
                    aria-hidden="true"
                  >
                    {cleanType === 'txt' && <FileText className="h-3 w-3 text-sky-400" />}
                    {cleanType === 'pdf' && <File className="h-3 w-3 text-rose-400" />}
                    {cleanType === 'docx' && <FileSpreadsheet className="h-3 w-3 text-emerald-400" />}
                    {cleanType === 'md' && <FileCode className="h-3 w-3 text-violet-400" />}
                  </div>
                )
              })
            ) : null}
            {(base.documentCount || 0) > 3 && (
              <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[8px] font-medium ${isDark ? 'border-slate-950 bg-slate-800 text-slate-400' : 'border-white bg-slate-100 text-slate-500'}`}>
                +{(base.documentCount || 0) - 3}
              </div>
            )}
          </div>

          <button
            type="button"
            className={`rounded-lg p-1.5 transition duration-200 opacity-0 focus:opacity-100 group-hover:opacity-100 ${isDark ? 'text-slate-500 hover:bg-rose-500/10 hover:text-rose-400' : 'text-slate-400 hover:bg-rose-500/10 hover:text-rose-500'}`}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(base.id)
            }}
            aria-label={`删除知识库：${base.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
