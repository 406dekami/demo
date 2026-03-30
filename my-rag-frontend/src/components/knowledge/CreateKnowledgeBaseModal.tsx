// components/knowledge/CreateKnowledgeBaseModal.tsx
import { useState } from 'react'
import { X } from 'lucide-react'

interface CreateKnowledgeBaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description: string; chunk_size: number; chunk_overlap: number }) => Promise<void>
}

export default function CreateKnowledgeBaseModal({ isOpen, onClose, onSubmit }: CreateKnowledgeBaseModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    chunk_size: 512,
    chunk_overlap: 50,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit(formData)
      onClose()
      setFormData({
        name: '',
        description: '',
        chunk_size: 512,
        chunk_overlap: 50,
      })
    } catch (error) {
      console.error('创建失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-slate-800/80 bg-slate-950/90 shadow-[0_30px_120px_rgba(2,6,23,.75)] backdrop-blur-xl animate-in fade-in zoom-in duration-200">
        <div className="border-b border-slate-800/80 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">创建新知识库</h2>
              <p className="mt-1 text-sm text-slate-400">配置知识库基础参数</p>
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

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                知识库名称 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入知识库名称"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入知识库描述（可选）"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/10"
              />
            </div>

            <details className="group rounded-2xl border border-slate-800/80 bg-slate-900/35 p-4">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-slate-300 transition-colors hover:text-white">
                <span>高级设置</span>
                <span className="text-slate-500 transition-transform group-open:rotate-180">▼</span>
              </summary>

              <div className="mt-4 space-y-4 border-l border-slate-800 pl-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-400">切片长度</label>
                  <input
                    type="number"
                    value={formData.chunk_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, chunk_size: parseInt(e.target.value) || 512 }))}
                    min={256}
                    max={1024}
                    step={64}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-white transition-all focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/10"
                  />
                  <p className="mt-1 text-xs text-slate-500">建议值：512，范围：256-1024</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-400">切片重叠</label>
                  <input
                    type="number"
                    value={formData.chunk_overlap}
                    onChange={(e) => setFormData(prev => ({ ...prev, chunk_overlap: parseInt(e.target.value) || 50 }))}
                    min={0}
                    max={256}
                    step={10}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-white transition-all focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/10"
                  />
                  <p className="mt-1 text-xs text-slate-500">建议值：50，范围：0-256</p>
                </div>
              </div>
            </details>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? '创建中...' : '创建'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
