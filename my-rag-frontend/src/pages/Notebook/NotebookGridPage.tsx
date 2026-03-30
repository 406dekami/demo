import { useState, type FC, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Notebook } from '@/types'
import { CreateNotebookModal } from '@/components/notebook/CreateNotebookModal'
import { getKnowledgeBases, type KnowledgeBase } from '@/api/knowledge'
import { Trash2, FileText, File, FileSpreadsheet } from 'lucide-react'

interface Props {
  notebooks: Notebook[]
  onCreateNotebook: (notebook: Notebook | Notebook[]) => void
  onDeleteNotebook: (id: string) => void | Promise<void>
}

export const NotebookGridPage: FC<Props> = ({ notebooks, onCreateNotebook, onDeleteNotebook }) => {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light')

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ isDark: boolean }>).detail
      setIsDark(detail.isDark)
    }
    window.addEventListener('themeChange', handler)
    return () => window.removeEventListener('themeChange', handler)
  }, [])

  const uniqueNotebooks = Array.from(
    new Map(notebooks.map((nb: Notebook) => [nb.id, nb])).values()
  )

  const handleCreateNotebook = async () => {
    try {
      const kbs = await getKnowledgeBases()
      setKnowledgeBases(kbs)
      setIsModalOpen(true)
    } catch (error) {
      console.error('加载知识库失败:', error)
      alert('加载知识库失败，请稍后重试')
    }
  }

  const handleModalSuccess = async (notebookId: string) => {
    try {
      const { getNotebooks } = await import('@/api/knowledge')
      const updatedNotebooks = await getNotebooks()

      const formattedNbs = updatedNotebooks.map(nb => ({
        ...nb,
        coverColor: ['#fef3c7', '#bfdbfe', '#fecaca', '#e0f2fe', '#fde68a', '#a7f3d0', '#ddd6fe'][nb.id.charCodeAt(0) % 7],
        pattern: ['dots', 'waves', 'tiles', 'hearts', 'rain', 'triangles', 'solid'][nb.id.charCodeAt(1) % 7] as Notebook['pattern'],
        lastUpdated: nb.updated_at || new Date().toISOString(),
      }))

      onCreateNotebook(formattedNbs)
      navigate(`/notebook/${notebookId}`)
    } catch (error) {
      console.error('加载笔记本失败:', error)
      navigate(`/notebook/${notebookId}`)
    }
  }

  const handleDeleteNotebook = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation()
    if (!confirm(`确定要删除笔记本"${title}"吗？`)) return

    try {
      const result = onDeleteNotebook(id)
      if (result instanceof Promise) {
        await result
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请稍后重试')
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <button
        className={`group relative flex min-h-[240px] flex-col items-center justify-center overflow-hidden rounded-[28px] border border-dashed p-8 transition duration-300 ${isDark ? 'border-sky-400/25 bg-slate-950/50 shadow-[0_20px_80px_rgba(2,6,23,.45)] hover:border-sky-300/50 hover:bg-slate-900/70' : 'border-blue-300/40 bg-white/60 shadow-lg hover:border-blue-400 hover:bg-white/80'}`}
        onClick={handleCreateNotebook}
        aria-label="新建笔记"
      >
        <div className={`absolute inset-0 opacity-80 ${isDark ? 'bg-[radial-gradient(circle_at_top,rgba(56,189,248,.08),transparent_42%)]' : 'bg-[radial-gradient(circle_at_top,rgba(56,189,248,.05),transparent_42%)]'}`} />
        <div className={`relative flex h-20 w-20 items-center justify-center rounded-full border transition duration-300 group-hover:scale-105 ${isDark ? 'border-sky-400/20 bg-sky-500/10 text-sky-300 shadow-[0_0_32px_rgba(56,189,248,.18)] group-hover:bg-sky-500/18' : 'border-blue-300/30 bg-blue-500/10 text-blue-500 shadow-[0_0_32px_rgba(59,130,246,.15)] group-hover:bg-blue-500/15'}`}>
          <span className="text-4xl font-light">＋</span>
        </div>
        <span className={`relative mt-5 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>新建笔记</span>
        <span className={`relative mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>开始记录</span>
      </button>

      {uniqueNotebooks.map((nb) => {
        const kbCount = nb.kb_ids ? nb.kb_ids.length : 0

        return (
          <article
            key={nb.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/notebook/${nb.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/notebook/${nb.id}`)}
            className={`group flex min-h-[280px] cursor-pointer flex-col overflow-hidden rounded-[28px] text-left transition duration-300 hover:-translate-y-1 ${isDark ? 'border-slate-800/80 bg-slate-950/55 shadow-[0_20px_80px_rgba(2,6,23,.45)] hover:border-sky-400/35 hover:bg-slate-900/70 hover:shadow-[0_24px_90px_rgba(14,165,233,.12)]' : 'border-blue-200/60 bg-white/70 shadow-lg hover:border-blue-400 hover:bg-white/90 hover:shadow-xl'}`}
          >
            <div className="relative h-40 w-full overflow-hidden" style={{ backgroundColor: nb.coverColor || '#0f172a' }}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,.12),transparent_45%)]" />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium tracking-[0.3em] text-slate-800/30">
                {nb.pattern ? nb.pattern.toUpperCase() : 'NOTEBOOK'}
              </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="flex-1">
                <h3 className={`text-lg font-semibold transition-colors group-hover:text-sky-200 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {nb.title}
                </h3>
                <p className={`mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  更新于 {nb.lastUpdated ? new Date(nb.lastUpdated).toLocaleDateString() : '未知'}
                </p>
              </div>

              <div className={`mt-4 flex items-center justify-between border-t pt-3 ${isDark ? 'border-slate-800/80' : 'border-slate-200/80'}`}>
                <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <div className="flex -space-x-1.5">
                    {[1, 2, 3].slice(0, Math.min(3, kbCount)).map((_, idx) => {
                      const docTypes = ['txt', 'pdf', 'docx'] as const
                      const docType = docTypes[idx % docTypes.length]

                      return (
                        <div
                          key={`${nb.id}-avatar-${idx}`}
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 shadow-sm ${isDark ? 'border-slate-950 bg-slate-800' : 'border-white bg-slate-100'}`}
                          aria-hidden="true"
                        >
                          {docType === 'txt' && <FileText className="h-3 w-3 text-sky-400" />}
                          {docType === 'pdf' && <File className="h-3 w-3 text-rose-400" />}
                          {docType === 'docx' && <FileSpreadsheet className="h-3 w-3 text-emerald-400" />}
                        </div>
                      )
                    })}
                    {kbCount > 3 && (
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[8px] font-medium ${isDark ? 'border-slate-950 bg-slate-800 text-slate-400' : 'border-white bg-slate-100 text-slate-500'}`}>
                        +{kbCount - 3}
                      </div>
                    )}
                  </div>
                  <span>{kbCount} 个资料库</span>
                </div>

                <button
                  type="button"
                  className={`rounded-lg p-1.5 transition duration-200 opacity-0 hover:bg-rose-500/10 focus:opacity-100 group-hover:opacity-100 ${isDark ? 'text-slate-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-500'}`}
                  onClick={(e) => handleDeleteNotebook(e, nb.id, nb.title)}
                  aria-label={`删除笔记本：${nb.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        )
      })}

      <CreateNotebookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        knowledgeBases={knowledgeBases}
      />
    </div>
  )
}
