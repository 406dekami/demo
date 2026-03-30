// KnowledgeDetailPage.tsx
import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Edit2, Check, X, BookOpen } from 'lucide-react'
import type { KnowledgeBase } from '@/types'
import UploadZone from '@/components/knowledge/UploadZone'
import DocumentList from '@/components/knowledge/DocumentList'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

interface Props {
  bases: KnowledgeBase[]
  onAddBase: (base: KnowledgeBase) => void
}

export const KnowledgeDetailPage: FC<Props> = ({ bases, onAddBase }) => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { currentKb, documents, isEditMode, setCurrentKb, setDocuments, addDocuments, removeDocument, toggleEditMode, confirmEdit } = useKnowledgeStore()
  const [editName, setEditName] = useState('')
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light')

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ isDark: boolean }>).detail
      setIsDark(detail.isDark)
    }
    window.addEventListener('themeChange', handler)
    return () => window.removeEventListener('themeChange', handler)
  }, [])

  const knowledgeBase = bases.find(b => b.id === id)

  useEffect(() => {
    if (knowledgeBase && (!currentKb || currentKb.id !== knowledgeBase.id)) {
      setCurrentKb(knowledgeBase)

      const loadDocuments = async () => {
        try {
          const response = await fetch(`/api/v1/knowledge/${knowledgeBase.id}/documents`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            },
          })

          if (!response.ok) {
            console.error('加载文档列表失败')
            return
          }

          const result = await response.json()
          if (result.data?.documents) {
            setDocuments(result.data.documents)
          }
        } catch (error) {
          console.error('加载文档列表失败:', error)
        }
      }

      loadDocuments()
    }
  }, [knowledgeBase, currentKb, setCurrentKb, addDocuments, setDocuments])

  useEffect(() => {
    if (!knowledgeBase) {
      navigate('/knowledge')
    }
  }, [knowledgeBase, navigate])

  if (!knowledgeBase) {
    return null
  }

  const formattedDate = knowledgeBase.updated_at
    ? new Date(knowledgeBase.updated_at).toLocaleDateString('zh-CN')
    : new Date().toLocaleDateString('zh-CN')

  const handleStartEdit = () => {
    setEditName(knowledgeBase.name)
    toggleEditMode()
  }

  const handleSaveEdit = () => {
    if (editName.trim()) {
      const updatedBase = { ...knowledgeBase, name: editName.trim() }
      onAddBase(updatedBase)
      confirmEdit()
      setEditName('')
    }
  }

  const handleCancelEdit = () => {
    confirmEdit()
    setEditName('')
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('确定要删除这个文档吗？此操作不可恢复')) {
      return
    }

    try {
      const response = await fetch(`/api/v1/knowledge/${id}/documents/${docId}/delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || '删除失败')
      }

      removeDocument(docId)
    } catch (error) {
      console.error('删除文档失败:', error)
      alert(error instanceof Error ? error.message : '删除失败')
    }
  }

  return (
    <div className={`min-h-screen px-6 py-8 ${isDark ? 'bg-[radial-gradient(circle_at_top,rgba(14,165,233,.12),transparent_28%),radial-gradient(circle_at_88%_20%,rgba(167,139,250,.14),transparent_24%),linear-gradient(180deg,#020617_0%,#0b1120_100%)] text-slate-100' : 'bg-gradient-to-b from-blue-50 via-white to-sky-50 text-slate-900'}`}>
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="rounded-[28px] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_20px_80px_rgba(2,6,23,.45)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate('/knowledge')}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-400 transition hover:border-sky-400/35 hover:text-white"
                aria-label="返回"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div>
                {isEditMode ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-white outline-none ring-0 focus:border-sky-400/50"
                      autoFocus
                    />
                    <button onClick={handleSaveEdit} className="rounded-lg p-2 text-emerald-400 transition hover:bg-emerald-500/10 hover:text-emerald-300" aria-label="保存"><Check className="h-5 w-5" /></button>
                    <button onClick={handleCancelEdit} className="rounded-lg p-2 text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300" aria-label="取消"><X className="h-5 w-5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold text-white">{knowledgeBase.name}</h1>
                    <button onClick={handleStartEdit} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white" aria-label="编辑名称"><Edit2 className="h-4 w-4" /></button>
                  </div>
                )}
                <p className="mt-2 text-sm text-slate-400">统一科技蓝风格 · 管理文档与知识结构</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /><span>{documents.length} 个文档</span></div>
              <div className="flex items-center gap-1.5"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>更新于 {formattedDate}</span></div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-800/80 bg-slate-950/55 p-6 shadow-[0_20px_80px_rgba(2,6,23,.45)] backdrop-blur-xl">
          <div className="mb-6 flex items-start justify-between gap-4 rounded-[24px] border border-slate-800/80 bg-slate-900/40 p-5">
            <div>
              <h2 className="text-lg font-semibold text-white">知识库简介</h2>
              <p className="mt-2 text-sm leading-7 text-slate-400">{knowledgeBase.description || '暂无描述，点击上方编辑按钮添加描述'}</p>
            </div>
          </div>

          <div className="mb-6 rounded-[24px] border border-slate-800/80 bg-slate-900/35 p-5">
            <UploadZone kbId={id!} disabled={!isEditMode} />
          </div>

          <div className="rounded-[24px] border border-slate-800/80 bg-slate-900/35 p-5">
            <DocumentList
              documents={documents}
              isEditMode={isEditMode}
              onDelete={handleDeleteDocument}
            />
          </div>

          {isEditMode && (
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-800/80 pt-6">
              <button onClick={handleCancelEdit} className="px-6 py-2.5 text-slate-400 transition hover:text-white">取消</button>
              <button onClick={handleSaveEdit} className="rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500">确认编辑</button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
