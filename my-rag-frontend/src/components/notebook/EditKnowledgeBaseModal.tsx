// my-rag-frontend/src/components/notebook/EditKnowledgeBaseModal.tsx
import {useEffect, useState} from 'react'
import {BookOpen, Search, X} from 'lucide-react'
import type {KnowledgeBase} from '@/api/knowledge'

interface EditKnowledgeBaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newKbIds: string[]) => void
  currentKbIds: string[]
  knowledgeBases: KnowledgeBase[]
}

export default function EditKnowledgeBaseModal({ isOpen, onClose, onSave, currentKbIds, knowledgeBases }: EditKnowledgeBaseModalProps) {
  const [selectedId, setSelectedId] = useState<string>(currentKbIds[0] || '')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentKbIds[0] || '')
      setSearchQuery('')
    }
  }, [isOpen, currentKbIds])

  const handleSave = () => {
    setLoading(true)
    setTimeout(() => {
      onSave(selectedId ? [selectedId] : [])
      setLoading(false)
      onClose()
    }, 300)
  }

  const filteredKnowledgeBases = knowledgeBases.filter((kb) => {
    const query = searchQuery.toLowerCase()
    return kb.name.toLowerCase().includes(query) || (kb.description && kb.description.toLowerCase().includes(query))
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-slate-800/80 bg-slate-950/90 shadow-[0_30px_120px_rgba(2,6,23,.75)] backdrop-blur-xl">
        <div className="border-b border-slate-800/80 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">编辑关联知识库</h2>
              <p className="mt-1 text-sm text-slate-400">当前版本仅支持单选</p>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); onClose() }} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white" aria-label="关闭">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索知识库..." className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:border-sky-400/50 focus:outline-none" />
          </div>

          {filteredKnowledgeBases.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <BookOpen className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>{knowledgeBases.length === 0 ? '暂无知识库' : '没有找到匹配的知识库'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredKnowledgeBases.map((kb) => {
                const isSelected = selectedId === kb.id
                return (
                  <label key={kb.id} className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${isSelected ? 'border-sky-400/35 bg-sky-500/10' : 'border-slate-800/80 bg-slate-900/35 hover:border-slate-700 hover:bg-slate-900/60'}`}>
                    <div className="flex flex-1 items-center gap-3">
                      <input type="radio" name="edit-kb" checked={isSelected} onChange={() => setSelectedId(kb.id)} className="h-4 w-4" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{kb.name}</p>
                        {kb.description && <p className="mt-0.5 truncate text-xs text-slate-500">{kb.description}</p>}
                      </div>
                    </div>
                    {isSelected && <span className="text-xs font-medium text-sky-300">已选择</span>}
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-800/80 bg-slate-900/35 px-6 py-4">
          <div className="mb-4 text-sm text-slate-400">{selectedId ? '已选择 1 个知识库' : '未选择知识库'}</div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-slate-200 transition hover:bg-slate-800">取消</button>
            <button onClick={handleSave} disabled={loading} className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 disabled:opacity-50">{loading ? '保存中...' : '保存'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
