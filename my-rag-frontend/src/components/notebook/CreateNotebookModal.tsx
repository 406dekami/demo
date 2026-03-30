// my-rag-frontend/src/components/notebook/CreateNotebookModal.tsx
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createNotebook } from '@/api/knowledge'
import type { KnowledgeBase } from '@/api/knowledge'

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

export const CreateNotebookModal: React.FC<CreateNotebookModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  knowledgeBases,
}) => {
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
        kb_ids: formData.kb_ids.length > 0 ? formData.kb_ids : undefined,
        model_name: formData.model_name || undefined,
        system_prompt: formData.system_prompt || undefined,
      })

      onSuccess(notebook.id)
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const toggleKnowledgeBase = (kbId: string) => {
    setFormData(prev => ({
      ...prev,
      kb_ids: prev.kb_ids.includes(kbId)
        ? prev.kb_ids.filter(id => id !== kbId)
        : [...prev.kb_ids, kbId],
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[28px] border border-slate-800/80 bg-slate-950/90 shadow-[0_30px_120px_rgba(2,6,23,.75)] backdrop-blur-xl">
        <div className="border-b border-slate-800/80 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">创建笔记本</h2>
              <p className="mt-1 text-sm text-slate-400">配置问答与知识库关联</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              笔记本标题 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white transition-all placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/10"
              placeholder="输入笔记本标题"
              maxLength={50}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">描述（可选）</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white transition-all placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/10"
              placeholder="描述这个笔记本的用途"
              rows={3}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">关联知识库（可选）</label>

            {knowledgeBases.length === 0 ? (
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-sm text-slate-400">
                暂无知识库，请先创建知识库
              </div>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-slate-800/80 bg-slate-900/35 p-2">
                {knowledgeBases.map((kb) => (
                  <label
                    key={kb.id}
                    className={`flex cursor-pointer items-center space-x-3 rounded-xl border p-3 transition-colors ${formData.kb_ids.includes(kb.id) ? 'border-sky-400/35 bg-sky-500/10' : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'}`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.kb_ids.includes(kb.id)}
                      onChange={() => toggleKnowledgeBase(kb.id)}
                      className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex-1 text-sm text-white">{kb.name}</span>
                    {formData.kb_ids.includes(kb.id) && (
                      <span className="text-xs text-sky-300">已选择</span>
                    )}
                  </label>
                ))}
              </div>
            )}

            {formData.kb_ids.length === 0 && (
              <p className="mt-2 text-xs text-amber-300/80">未选择知识库，将无法进行 RAG 问答</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">使用的模型（可选）</label>
            <select
              value={formData.model_name}
              onChange={(e) => setFormData(prev => ({ ...prev, model_name: e.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/10"
            >
              <option value="qwen-plus">Qwen-Plus（默认）</option>
              <option value="qwen-turbo">Qwen-Turbo</option>
              <option value="qwen-max">Qwen-Max</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">系统提示词（可选）</label>
            <textarea
              value={formData.system_prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white transition-all placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/10"
              placeholder="例如：你是一个专业的助手，请用简洁的语言回答"
              rows={2}
            />
          </div>

          <div className="flex gap-3 border-t border-slate-800/80 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
