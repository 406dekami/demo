// KnowledgeDetailPage.tsx
import type {FC} from 'react'
import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {BookOpen, Check, ChevronLeft, Edit2, Image, X} from 'lucide-react'
import CoverSelector from '@/components/knowledge/CoverSelector'
import type {KnowledgeBase} from '@/types'
import UploadZone from '@/components/knowledge/UploadZone'
import DocumentList from '@/components/knowledge/DocumentList'
import {useKnowledgeStore} from '@/stores/knowledgeStore'
import {deleteKnowledgeDocument, getKnowledgeBaseDocuments, updateKnowledgeBase} from '@/api/knowledge'

interface Props {
  bases: KnowledgeBase[]
  onAddBase: (base: KnowledgeBase) => void
}

export const KnowledgeDetailPage: FC<Props> = ({ bases, onAddBase }) => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { currentKb, documents, isEditMode, setCurrentKb, setDocuments, removeDocument, toggleEditMode, confirmEdit } = useKnowledgeStore()
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light')

  const knowledgeBase = bases.find((b) => b.id === id)
  const [editCover, setEditCover] = useState<{ type: 'image' | 'color'; value: string } | null>(
    knowledgeBase?.coverImage ? { type: 'image', value: knowledgeBase.coverImage } : knowledgeBase?.coverColor ? { type: 'color', value: knowledgeBase.coverColor } : null
  )

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ isDark: boolean }>).detail
      setIsDark(detail.isDark)
    }
    window.addEventListener('themeChange', handler)
    return () => window.removeEventListener('themeChange', handler)
  }, [])

  useEffect(() => {
    if (knowledgeBase && documents.length !== (knowledgeBase.documentCount || 0)) {
      onAddBase({ ...knowledgeBase, documentCount: documents.length })
    }
  }, [documents, knowledgeBase, onAddBase])

  const loadDocuments = async () => {
    if (!id) return
    try {
      const result = await getKnowledgeBaseDocuments(id)
      setDocuments(result.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        status: doc.parse_status === 'pending' ? 'processing' : doc.parse_status,
        chunkCount: doc.chunk_count,
        uploadTime: new Date(doc.create_time || Date.now()).toISOString(),
        fileSize: doc.file_size,
        message: doc.parse_msg,
      })))
    } catch (error) {
      console.error('加载文档列表失败:', error)
    }
  }

  useEffect(() => {
    if (knowledgeBase && (!currentKb || currentKb.id !== knowledgeBase.id)) {
      setCurrentKb(knowledgeBase)
      void loadDocuments()
    }
  }, [knowledgeBase, currentKb, setCurrentKb, id])

  useEffect(() => {
    if (!knowledgeBase) {
      navigate('/knowledge')
    }
  }, [knowledgeBase, navigate])

  if (!knowledgeBase) {
    return null
  }

  const formattedDate = knowledgeBase.updated_at ? new Date(knowledgeBase.updated_at).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN')

  const handleStartEdit = () => {
    setEditName(knowledgeBase.name)
    setEditDescription(knowledgeBase.description || '')
    setEditCover(knowledgeBase.coverImage ? { type: 'image', value: knowledgeBase.coverImage } : knowledgeBase.coverColor ? { type: 'color', value: knowledgeBase.coverColor } : null)
    toggleEditMode()
  }

  const handleSaveEdit = async () => {
    if (!id || !editName.trim()) return
    try {
      setSaving(true)
      const updatedBase = await updateKnowledgeBase(id, {
        name: editName.trim(),
        description: editDescription.trim(),
        coverImage: editCover?.type === 'image' ? editCover.value : undefined,
        coverColor: editCover?.type === 'color' ? editCover.value : undefined,
      })
      onAddBase({
        ...knowledgeBase,
        ...updatedBase,
        documentCount: documents.length,
      })
      confirmEdit()
      setEditName('')
      setEditDescription('')
      setEditCover(null)
    } catch (error) {
      console.error('保存知识库失败:', error)
      alert(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    confirmEdit()
    setEditName('')
    setEditDescription('')
    setEditCover(null)
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!id || !window.confirm('确定要删除这个文档吗？此操作不可恢复')) {
      return
    }

    try {
      await deleteKnowledgeDocument(id, docId)
      removeDocument(docId)
    } catch (error) {
      console.error('删除文档失败:', error)
      alert(error instanceof Error ? error.message : '删除失败')
    }
  }

  return (
    <div className={`min-h-screen overflow-auto px-6 py-8 ${isDark ? 'bg-[radial-gradient(circle_at_top,rgba(14,165,233,.12),transparent_28%),radial-gradient(circle_at_88%_20%,rgba(167,139,250,.14),transparent_24%),linear-gradient(180deg,#020617_0%,#0b1120_100%)] text-slate-100' : 'bg-gradient-to-b from-blue-50 via-white to-sky-50 text-slate-900'}`}>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className={`rounded-2xl border p-6 ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/knowledge')} className={`rounded-lg p-2 transition ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`} aria-label="返回"><ChevronLeft className="h-5 w-5" /></button>
              <div>
                {isEditMode ? (
                  <div className="flex items-center gap-2">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={`rounded-lg border px-3 py-1.5 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-900'}`} autoFocus />
                    <button onClick={() => void handleSaveEdit()} disabled={saving} className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-500/10" aria-label="保存"><Check className="h-4 w-4" /></button>
                    <button onClick={handleCancelEdit} className="rounded-lg p-1.5 text-rose-400 transition hover:bg-rose-500/10" aria-label="取消"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{knowledgeBase.name}</h1>
                    <button onClick={handleStartEdit} className={`rounded-lg p-1.5 transition ${isDark ? 'text-slate-500 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`} aria-label="编辑名称"><Edit2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                <div className={`mt-1 flex items-center gap-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><div className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /><span>{documents.length} 个文档</span></div><span>·</span><span>更新于 {formattedDate}</span></div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <section className={`rounded-2xl border p-4 ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
              <h2 className={`mb-2 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>知识库简介</h2>
              {isEditMode ? <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="请输入知识库描述" rows={3} className={`w-full resize-none rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'}`} /> : <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{knowledgeBase.description || '暂无描述'}</p>}
            </section>

            <section className={`rounded-2xl border p-4 ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
              <h2 className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Image className="h-4 w-4" />知识库封面</h2>
              {isEditMode ? <CoverSelector value={editCover ?? undefined} onChange={(cover) => setEditCover(cover ?? null)} /> : knowledgeBase.coverImage || knowledgeBase.coverColor ? <div className="overflow-hidden rounded-lg">{knowledgeBase.coverImage ? <img src={knowledgeBase.coverImage} alt="封面" className="h-28 w-full object-cover" /> : <div className="h-28 w-full" style={{ backgroundColor: knowledgeBase.coverColor }} />}</div> : <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>暂无封面</p>}
            </section>
          </div>

          <section className={`rounded-2xl border p-4 ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
            <h2 className={`mb-3 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>文档管理</h2>
            <UploadZone kbId={id!} disabled={!isEditMode} />
            {documents.length > 0 && <div className="mt-4"><DocumentList kbId={id!} documents={documents} isEditMode={isEditMode} onDelete={handleDeleteDocument} /></div>}
          </section>
        </div>

        {isEditMode && (
          <div className="flex justify-end gap-3">
            <button onClick={handleCancelEdit} className={`rounded-lg px-4 py-2 text-sm transition ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>取消</button>
            <button onClick={() => void handleSaveEdit()} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">{saving ? '保存中...' : '确认编辑'}</button>
          </div>
        )}
      </div>
    </div>
  )
}
