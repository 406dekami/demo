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
      // 关闭对话框并清空表单
      onClose()
      setFormData({
        name: '',
        description: '',
        chunk_size: 512,
        chunk_overlap: 50,
      })
    } catch (error) {
      console.error('创建失败:', error)
      // 错误由父组件的 toast 处理
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 对话框 */}
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 标题 */}
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
          创建新知识库
        </h2>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 知识库名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              知识库名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入知识库名称"
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 transition-all"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请输入知识库描述（可选）"
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 transition-all resize-none"
            />
          </div>

          {/* 高级设置（折叠） */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-300 hover:text-white transition-colors">
              <span>高级设置</span>
              <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            
            <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-700">
              {/* 切片长度 */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  切片长度
                </label>
                <input
                  type="number"
                  value={formData.chunk_size}
                  onChange={(e) => setFormData(prev => ({ ...prev, chunk_size: parseInt(e.target.value) || 512 }))}
                  min={256}
                  max={1024}
                  step={64}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all"
                />
                <p className="mt-1 text-xs text-gray-500">建议值：512，范围：256-1024</p>
              </div>

              {/* 切片重叠 */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  切片重叠
                </label>
                <input
                  type="number"
                  value={formData.chunk_overlap}
                  onChange={(e) => setFormData(prev => ({ ...prev, chunk_overlap: parseInt(e.target.value) || 50 }))}
                  min={0}
                  max={256}
                  step={10}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all"
                />
                <p className="mt-1 text-xs text-gray-500">建议值：50，范围：0-256</p>
              </div>
            </div>
          </details>

          {/* 按钮组 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
