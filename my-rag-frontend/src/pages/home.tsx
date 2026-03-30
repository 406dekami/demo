import { type FC, useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { KnowledgeBase, Notebook } from '@/types'
import { KnowledgeCard } from '@/components/knowledge'
import { NotebookGridPage } from '@/pages/Notebook'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import CreateKnowledgeBaseModal from '@/components/knowledge/CreateKnowledgeBaseModal'
import { createKnowledgeBase } from '@/api/knowledge'

interface Props {
  bases: KnowledgeBase[]
  onAddBase: (base: KnowledgeBase) => void
  onDeleteBase: (id: string) => void
  notebooks: Notebook[]
  onCreateNotebook: (notebook: Notebook | Notebook[]) => void
  onDeleteNotebook: (id: string) => Promise<void>
}

export const HomePage: FC<Props> = ({ bases, onAddBase, onDeleteBase, notebooks, onCreateNotebook, onDeleteNotebook }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const activeTab = location.pathname === '/notebook' ? 'notebook' : 'knowledge'
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light')

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ isDark: boolean }>).detail
      setIsDark(detail.isDark)
    }
    window.addEventListener('themeChange', handler)
    return () => window.removeEventListener('themeChange', handler)
  }, [])

  const getNotebookPreview = useMemo(() => (b: KnowledgeBase): Notebook => ({
    id: b.id,
    title: b.name,
    coverColor: ['#fef3c7', '#bfdbfe', '#fecaca', '#e0f2fe', '#fde68a', '#a7f3d0', '#ddd6fe'][b.id.charCodeAt(0) % 7],
    pattern: ['dots', 'waves', 'tiles', 'hearts', 'rain', 'triangles', 'solid'][b.id.charCodeAt(1) % 7] as Notebook['pattern'],
    lastUpdated: b.updated_at || new Date().toISOString(),
  }), [])

  const handleCreateNewBase = async (data: { name: string; description: string; chunk_size: number; chunk_overlap: number }) => {
    if (isCreating) return

    setIsCreating(true)
    try {
      const newBase = await createKnowledgeBase(data)
      toast.success('知识库创建成功！')
      onAddBase({ ...newBase, documentCount: 0 })
      navigate(`/knowledge/${newBase.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建失败')
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className={`min-h-full ${isDark ? 'bg-[radial-gradient(circle_at_top,rgba(14,165,233,.12),transparent_28%),radial-gradient(circle_at_88%_20%,rgba(167,139,250,.14),transparent_24%),linear-gradient(180deg,#020617_0%,#0b1120_100%)] text-slate-100' : 'bg-gradient-to-b from-blue-50 via-white to-sky-50 text-slate-900'}`}>
      <main className="h-full overflow-auto">
        <div className="mx-auto max-w-400 px-6 py-8">
          {activeTab === 'knowledge' ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                aria-label="新建知识库"
                className={`group relative flex min-h-60 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[28px] border border-dashed p-8 transition duration-300 ${isDark ? 'border-sky-400/25 bg-slate-950/50 shadow-[0_20px_80px_rgba(2,6,23,.45)] hover:border-sky-300/50 hover:bg-slate-900/70' : 'border-blue-300/40 bg-white/60 shadow-lg hover:border-blue-400 hover:bg-white/80'}`}>
                <div className={`absolute inset-0 opacity-80 ${isDark ? 'bg-[radial-gradient(circle_at_top,rgba(56,189,248,.08),transparent_42%)]' : 'bg-[radial-gradient(circle_at_top,rgba(56,189,248,.05),transparent_42%)]'}`} />
                <div className={`relative flex h-20 w-20 items-center justify-center rounded-full border transition duration-300 group-hover:scale-105 ${isDark ? 'border-sky-400/20 bg-sky-500/10 text-sky-300 shadow-[0_0_32px_rgba(56,189,248,.18)] group-hover:bg-sky-500/18' : 'border-blue-300/30 bg-blue-500/10 text-blue-500 shadow-[0_0_32px_rgba(59,130,246,.15)] group-hover:bg-blue-500/15'}`}>
                  <Plus className="h-10 w-10" />
                </div>
                <span className={`relative mt-5 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>新建知识库</span>
                <span className={`relative mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>添加文档开始探索</span>
              </button>

              {bases.map((b) => (
                <KnowledgeCard
                  key={b.id}
                  base={b}
                  preview={getNotebookPreview(b)}
                  onDelete={onDeleteBase}
                />
              ))}
            </div>
          ) : (
            <NotebookGridPage
              notebooks={notebooks}
              onCreateNotebook={onCreateNotebook}
              onDeleteNotebook={onDeleteNotebook}
            />
          )}
        </div>
      </main>

      <CreateKnowledgeBaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateNewBase}
      />
    </div>
  )
}
