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

  // 重置表单
  useEffect(() => {
    if (isOpen) {
      setFormData(DEFAULT_FORM_DATA)
      setError(null)
    }
  }, [isOpen])

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证必填字段
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

  // 切换知识库选择
  const toggleKnowledgeBase = (kbId: string) => {
    setFormData(prev => ({
      ...prev,
      kb_ids: prev.kb_ids.includes(kbId)
        ? prev.kb_ids.filter(id => id !== kbId)
        : [...prev.kb_ids, kbId]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            创建笔记本
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* 笔记本标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              笔记本标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入笔记本标题"
              maxLength={50}
              autoFocus
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              描述（可选）
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="描述这个笔记本的用途"
              rows={3}
            />
          </div>

          {/* 关联知识库 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              关联知识库（可选）
            </label>
            
            {knowledgeBases.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                暂无知识库，请先创建知识库
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {knowledgeBases.map((kb) => (
                  <label
                    key={kb.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.kb_ids.includes(kb.id)}
                      onChange={() => toggleKnowledgeBase(kb.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="flex-1 text-sm text-gray-900 dark:text-white">
                      {kb.name}
                    </span>
                    {formData.kb_ids.includes(kb.id) && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        已选择
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
            
            {formData.kb_ids.length === 0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                未选择知识库，将无法进行 RAG 问答
              </p>
            )}
          </div>

          {/* 模型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              使用的模型（可选）
            </label>
            <select
              value={formData.model_name}
              onChange={(e) => setFormData(prev => ({ ...prev, model_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="qwen-plus">Qwen-Plus（默认）</option>
              <option value="qwen-turbo">Qwen-Turbo</option>
              <option value="qwen-max">Qwen-Max</option>
            </select>
          </div>

          {/* 系统提示词 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              系统提示词（可选）
            </label>
            <textarea
              value={formData.system_prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如：你是一个专业的助手，请用简洁的语言回答"
              rows={2}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
