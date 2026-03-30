// my-rag-frontend/src/pages/Notebook/DetailPage.tsx
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2, Edit3, Network } from 'lucide-react'
import type { KnowledgeBase, Notebook } from '@/types'
import ChatArea from '@/components/notebook/ChatArea'
import EditKnowledgeBaseModal from '@/components/notebook/EditKnowledgeBaseModal'
import { KnowledgeGraph } from '@/components/common/KnowledgeGraph'
import { useNotebookStore } from '@/stores/notebookStore'
import toast from 'react-hot-toast'

interface Props {
  notebooks: Notebook[]
  knowledgeBases: KnowledgeBase[]
  onUpdateNotebook: (id: string, updates: Partial<Notebook>) => void
}

export const NotebookDetailPage: FC<Props> = ({ notebooks, knowledgeBases, onUpdateNotebook }) => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { selectedKbIds, setSelectedKbIds, loadFromStorage, saveToStorage, clearMessages } = useNotebookStore()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showGraph, setShowGraph] = useState(false)

  const notebook = notebooks.find(nb => nb.id === id)
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light')

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ isDark: boolean }>).detail
      setIsDark(detail.isDark)
    }
    window.addEventListener('themeChange', handler)
    return () => window.removeEventListener('themeChange', handler)
  }, [])

  useEffect(() => {
    if (!id) {
      navigate('/notebook', { replace: true })
      return
    }

    if (!notebook) {
      const timer = setTimeout(() => {
        const stillNotFound = !notebooks.find(nb => nb.id === id)
        if (stillNotFound) {
          navigate('/notebook', { replace: true })
        }
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [notebook, id, navigate, notebooks])

  useEffect(() => {
    if (!id || !notebook) return
    loadFromStorage(id)
  }, [id, notebook, loadFromStorage])

  useEffect(() => {
    if (!id || !notebook) return
    return () => {
      saveToStorage(id)
    }
  }, [id, notebook, saveToStorage])

  if (!notebook) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isDark ? 'bg-[radial-gradient(circle_at_top,rgba(14,165,233,.12),transparent_28%),radial-gradient(circle_at_88%_20%,rgba(167,139,250,.14),transparent_24%),linear-gradient(180deg,#020617_0%,#0b1120_100%)] text-slate-400' : 'bg-gradient-to-b from-blue-50 via-white to-sky-50 text-slate-600'}`}>
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  const handleEditSave = async (newKbIds: string[]) => {
    try {
      const { updateNotebook } = await import('@/api/knowledge')
      await updateNotebook(id!, {
        title: notebook.title,
        kb_ids: newKbIds,
      })

      setSelectedKbIds(newKbIds)
      clearMessages()
      toast.success('知识库已更新')
      onUpdateNotebook(id!, { kb_ids: newKbIds })
    } catch (error) {
      console.error('更新失败:', error)
      toast.error(error instanceof Error ? error.message : '更新失败')
      throw error
    }
  }

  return (
    <div className={`min-h-screen px-6 py-8 ${isDark ? 'bg-[radial-gradient(circle_at_top,rgba(14,165,233,.12),transparent_28%),radial-gradient(circle_at_88%_20%,rgba(167,139,250,.14),transparent_24%),linear-gradient(180deg,#020617_0%,#0b1120_100%)] text-slate-100' : 'bg-gradient-to-b from-blue-50 via-white to-sky-50 text-slate-900'}`}>
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="rounded-[28px] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_20px_80px_rgba(2,6,23,.45)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => {
                  clearMessages()
                  navigate('/notebook', { replace: true })
                }}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-400 transition hover:border-sky-400/35 hover:text-white"
                aria-label="返回"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div>
                <h1 className="text-2xl font-semibold text-white">{notebook.title}</h1>
                <p className="mt-2 text-sm text-slate-400">统一科技蓝风格 · 基于知识库的智能问答</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowGraph(!showGraph)}
                className={`rounded-xl p-2 transition ${showGraph ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-sky-500/10 hover:text-sky-300'}`}
                aria-label="知识图谱"
                title={showGraph ? '隐藏图谱' : '显示图谱'}
              >
                <Network className="h-5 w-5" />
              </button>

              <button
                onClick={() => setShowEditModal(true)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-sky-500/10 hover:text-sky-300"
                aria-label="编辑知识库"
                title="编辑关联的知识库"
              >
                <Edit3 className="h-5 w-5" />
              </button>

              <button
                onClick={() => {
                  if (confirm('确定要清空当前对话吗？')) {
                    clearMessages()
                  }
                }}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400"
                aria-label="清空对话"
                title="清空对话"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        {showGraph && (
          <section className="rounded-[28px] border border-slate-800/80 bg-slate-950/55 p-5 shadow-[0_20px_80px_rgba(2,6,23,.45)] backdrop-blur-xl">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Network className="h-5 w-5 text-blue-400" />
              知识图谱可视化
            </h2>
            <div className="rounded-[24px] border border-slate-800/80 bg-slate-900/35 p-4">
              <KnowledgeGraph
                notebookId={id!}
                height="500px"
                onNodeClick={(node) => {
                  console.log('点击节点:', node)
                  toast.success(`点击了：${node.label} (${node.type})`)
                }}
              />
            </div>
          </section>
        )}

        <section
          className="relative overflow-hidden rounded-[28px] border border-slate-800/80 bg-slate-950/55 shadow-[0_20px_80px_rgba(2,6,23,.45)] backdrop-blur-xl"
          style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}
        >
          {selectedKbIds.length === 0 && (
            <div className="absolute left-1/2 top-6 z-10 -translate-x-1/2">
              <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-300">
                请从右上角选择至少一个知识库
              </div>
            </div>
          )}

          <ChatArea kbIds={selectedKbIds} notebookId={id!} />
        </section>
      </div>

      <EditKnowledgeBaseModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSave}
        currentKbIds={selectedKbIds}
        knowledgeBases={knowledgeBases}
      />
    </div>
  )
}
