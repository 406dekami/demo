// my-rag-frontend/src/components/notebook/CreateNotebookModal.tsx
import {useEffect, useState} from 'react'
import {X} from 'lucide-react'
import type {KnowledgeBase} from '@/api/knowledge'
import {createNotebook} from '@/api/knowledge'
import {useTheme} from '@/hooks/useTheme'

interface CreateNotebookModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (notebookId: string) => void
  knowledgeBases: KnowledgeBase[]
}

interface FormData {
  title: string
  description: string
  kb_ids: string[]
  model_name: string
  system_prompt: string
}

const DEFAULT_FORM_DATA: FormData = {
  title: '',
  description: '',
  kb_ids: [],
  model_name: 'qwen-plus',
  system_prompt: '',
}

export const CreateNotebookModal: React.FC<CreateNotebookModalProps> = ({ isOpen, onClose, onSuccess, knowledgeBases }) => {
  const { isDark } = useTheme()
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setFormData(DEFAULT_FORM_DATA)
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError('请输入笔记本标题')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const notebook = await createNotebook({
        title: formData.title,
        description: formData.description || undefined,
        kb_ids: formData.kb_ids.length > 0 ? [formData.kb_ids[0]] : undefined,
        model_name: formData.model_name || undefined,
        system_prompt: formData.system_prompt || undefined,
      })
      onSuccess(notebook.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const selectKnowledgeBase = (kbId: string) => {
    setFormData((prev) => ({
      ...prev,
      kb_ids: prev.kb_ids[0] === kbId ? [] : [kbId],
    }))
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${isDark ? 'bg-slate-950/75' : 'bg-slate-900/40'}`}>
      <div className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[28px] border shadow-[0_30px_120px_rgba(2,6,23,.3)] backdrop-blur-xl ${isDark ? 'border-slate-800/80 bg-slate-950/90' : 'border-slate-200 bg-white/95'}`}>
        <div className={`border-b px-5 py-4 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>创建笔记本</h2>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>当前版本仅支持关联一个知识库</p>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); onClose() }} className={`rounded-lg p-2 transition ${isDark ? 'text-slate-500 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`} aria-label="关闭">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}

          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>笔记本标题 <span className="text-rose-400">*</span></label>
            <input type="text" value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))} className={`w-full rounded-xl border px-4 py-3 ${isDark ? 'border-slate-700 bg-slate-900/80 text-white' : 'border-slate-300 bg-white text-slate-900'}`} placeholder="输入笔记本标题" maxLength={50} autoFocus />
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>描述（可选）</label>
            <textarea value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} className={`w-full rounded-xl border px-4 py-3 ${isDark ? 'border-slate-700 bg-slate-900/80 text-white' : 'border-slate-300 bg-white text-slate-900'}`} placeholder="描述这个笔记本的用途" rows={3} />
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>关联知识库（单选）</label>
            {knowledgeBases.length === 0 ? (
              <div className={`rounded-xl border p-3 text-sm ${isDark ? 'border-slate-800/80 bg-slate-900/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>暂无知识库，请先创建知识库</div>
            ) : (
              <div className={`max-h-48 space-y-2 overflow-y-auto rounded-2xl border p-2 ${isDark ? 'border-slate-800/80 bg-slate-900/35' : 'border-slate-200 bg-slate-50/50'}`}>
                {knowledgeBases.map((kb) => {
                  const selected = formData.kb_ids[0] === kb.id
                  return (
                    <label key={kb.id} className={`flex cursor-pointer items-center space-x-3 rounded-xl border p-3 transition-colors ${selected ? (isDark ? 'border-sky-400/35 bg-sky-500/10' : 'border-blue-400 bg-blue-50') : (isDark ? 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100')}`}>
                      <input type="radio" name="kb_id" checked={selected} onChange={() => selectKnowledgeBase(kb.id)} className="h-4 w-4" />
                      <span className={`flex-1 text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{kb.name}</span>
                      {selected && <span className={`text-xs ${isDark ? 'text-sky-300' : 'text-blue-600'}`}>已选择</span>}
                    </label>
                  )
                })}
              </div>
            )}
            {formData.kb_ids.length === 0 && <p className={`mt-2 text-xs ${isDark ? 'text-amber-300/80' : 'text-amber-600'}`}>未选择知识库，将无法进行 RAG 问答</p>}
          </div>

          <div className={`flex gap-3 border-t pt-4 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <button type="button" onClick={onClose} disabled={loading} className={`flex-1 rounded-xl border px-4 py-3 ${isDark ? 'border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>取消</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">{loading ? '创建中...' : '创建'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
