// components/knowledge/CreateKnowledgeBaseModal.tsx
import {useState} from 'react'
import {X} from 'lucide-react'
import {useTheme} from '@/hooks/useTheme'
import CoverSelector from './CoverSelector'

interface CreateKnowledgeBaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description: string; chunk_size: number; chunk_overlap: number; coverColor?: string; coverImage?: string }) => Promise<void>
}

export default function CreateKnowledgeBaseModal({ isOpen, onClose, onSubmit }: CreateKnowledgeBaseModalProps) {
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    chunk_size: 512,
    chunk_overlap: 50,
  })
  const [cover, setCover] = useState<{ type: 'image' | 'color'; value: string } | undefined>(undefined)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        ...formData,
        coverColor: cover?.type === 'color' ? cover.value : undefined,
        coverImage: cover?.type === 'image' ? cover.value : undefined,
      })
      onClose()
      setFormData({
        name: '',
        description: '',
        chunk_size: 512,
        chunk_overlap: 50,
      })
      setCover(undefined)
    } catch (error) {
      console.error('创建失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 backdrop-blur-md ${isDark ? 'bg-slate-950/75' : 'bg-slate-900/40'}`}
        onClick={onClose}
      />

      <div className={`relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border shadow-[0_30px_120px_rgba(2,6,23,.3)] backdrop-blur-xl animate-in fade-in zoom-in duration-200 ${isDark ? 'border-slate-800/80 bg-slate-950/90' : 'border-slate-200 bg-white/95'}`}>
        <div className={`border-b px-6 py-4 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>创建新知识库</h2>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>配置知识库基础参数</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className={`rounded-lg p-2 transition focus:outline-none focus:ring-2 focus:ring-slate-500 ${isDark ? 'text-slate-500 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}
              aria-label="关闭"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                知识库名称 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入知识库名称"
                required
                className={`w-full rounded-xl border px-4 py-3 transition-all focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/10 ${isDark ? 'border-slate-700 bg-slate-900/80 text-white placeholder-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'}`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入知识库描述（可选）"
                rows={3}
                className={`w-full resize-none rounded-xl border px-4 py-3 transition-all focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/10 ${isDark ? 'border-slate-700 bg-slate-900/80 text-white placeholder-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'}`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>封面</label>
              <CoverSelector value={cover} onChange={setCover} />
            </div>

            <details className={`group rounded-2xl border p-4 ${isDark ? 'border-slate-800/80 bg-slate-900/35' : 'border-slate-200 bg-slate-50/50'}`}>
              <summary className={`flex cursor-pointer items-center justify-between text-sm font-medium transition-colors ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}>
                <span>高级设置</span>
                <span className={`transition-transform group-open:rotate-180 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>▼</span>
              </summary>

              <div className={`mt-4 space-y-4 border-l pl-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div>
                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>切片长度</label>
                  <input
                    type="number"
                    value={formData.chunk_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, chunk_size: parseInt(e.target.value) || 512 }))}
                    min={256}
                    max={1024}
                    step={64}
                    className={`w-full rounded-xl border px-4 py-2.5 transition-all focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/10 ${isDark ? 'border-slate-700 bg-slate-900/80 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  />
                  <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>建议值：512，范围：256-1024</p>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>切片重叠</label>
                  <input
                    type="number"
                    value={formData.chunk_overlap}
                    onChange={(e) => setFormData(prev => ({ ...prev, chunk_overlap: parseInt(e.target.value) || 50 }))}
                    min={0}
                    max={256}
                    step={10}
                    className={`w-full rounded-xl border px-4 py-2.5 transition-all focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/10 ${isDark ? 'border-slate-700 bg-slate-900/80 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  />
                  <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>建议值：50，范围：0-256</p>
                </div>
              </div>
            </details>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`flex-1 rounded-xl border px-4 py-3 font-medium transition disabled:opacity-50 ${isDark ? 'border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
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
