// my-rag-frontend/src/components/notebook/EditKnowledgeBaseModal.tsx
import { useState, useEffect } from 'react'
import { X, Search, BookOpen } from 'lucide-react'
import type { KnowledgeBase } from '@/api/knowledge'

interface EditKnowledgeBaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newKbIds: string[]) => void
  currentKbIds: string[]
  knowledgeBases: KnowledgeBase[]
}

export default function EditKnowledgeBaseModal({
  isOpen,
  onClose,
  onSave,
  currentKbIds,
  knowledgeBases,
}: EditKnowledgeBaseModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(currentKbIds)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // 重置选中状态
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(currentKbIds)
    }
  }, [isOpen, currentKbIds])

  // 处理知识库选择/取消选择
  const toggleKnowledgeBase = (kbId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(kbId)) {
        return prev.filter(id => id !== kbId)
      } else {
        return [...prev, kbId]
      }
    })
  }

  // 处理保存
  const handleSave = () => {
    setLoading(true)
    // 延迟一下，给用户反馈
    setTimeout(() => {
      onSave(selectedIds)
      setLoading(false)
      onClose()
    }, 300)
  }

  // 过滤知识库列表（支持搜索）
  const filteredKnowledgeBases = knowledgeBases.filter(kb => {
    const query = searchQuery.toLowerCase()
    return (
      kb.name.toLowerCase().includes(query) ||
      (kb.description && kb.description.toLowerCase().includes(query))
    )
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            编辑关联的知识库
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - 知识库列表 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* 搜索框 */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索知识库..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {filteredKnowledgeBases.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {knowledgeBases.length === 0 ? (
                <>
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无知识库</p>
                  <p className="text-sm mt-2">请先创建知识库</p>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>没有找到匹配的知识库</p>
                  <p className="text-sm mt-2">尝试其他搜索词</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {knowledgeBases.map(kb => {
                const isSelected = selectedIds.includes(kb.id)
                return (
                  <label
                    key={kb.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-400' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleKnowledgeBase(kb.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {kb.name}
                        </p>
                        {kb.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {kb.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        已选择
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer - 统计信息和操作按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              已选择 <span className="font-medium text-blue-600 dark:text-blue-400">{selectedIds.length}</span> 个知识库
            </div>
            {selectedIds.length === 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ 不选择知识库将无法进行 RAG 问答
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
