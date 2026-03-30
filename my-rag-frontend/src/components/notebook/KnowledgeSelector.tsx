// my-rag-frontend/src/components/notebook/KnowledgeSelector.tsx
import { useState } from 'react'
import { Check, ChevronDown, BookOpen } from 'lucide-react'
import type { KnowledgeBase } from '@/types'

interface KnowledgeSelectorProps {
  knowledgeBases: KnowledgeBase[]
  selectedKbIds: string[]
  onChange: (kbIds: string[]) => void
}

export default function KnowledgeSelector({
  knowledgeBases,
  selectedKbIds,
  onChange
}: KnowledgeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleKnowledgeBase = (kbId: string) => {
    if (selectedKbIds.includes(kbId)) {
      onChange(selectedKbIds.filter(id => id !== kbId))
    } else {
      onChange([...selectedKbIds, kbId])
    }
  }

  const getSelectedNames = () => {
    const selected = knowledgeBases.filter(kb => selectedKbIds.includes(kb.id))
    if (selected.length === 0) return '选择知识库'
    if (selected.length === 1) return selected[0].name
    return `${selected.length} 个知识库`
  }

  return (
    <div className="relative">
      {/* 选择按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl hover:border-gray-600 transition-all"
      >
        <BookOpen className="w-4 h-4 text-blue-400" />
        <span className="text-white text-sm font-medium">{getSelectedNames()}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉面板 */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-gray-800/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl z-20 max-h-80 overflow-y-auto">
            <div className="p-2">
              {knowledgeBases.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-gray-400 text-sm">暂无知识库</p>
                </div>
              ) : (
                knowledgeBases.map(kb => (
                  <button
                    key={kb.id}
                    onClick={() => toggleKnowledgeBase(kb.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      selectedKbIds.includes(kb.id)
                        ? 'bg-blue-600/20 text-white'
                        : 'hover:bg-gray-700/50 text-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                      selectedKbIds.includes(kb.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-600'
                    }`}>
                      {selectedKbIds.includes(kb.id) && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <span className="text-sm truncate flex-1 text-left">{kb.name}</span>
                    <span className="text-xs text-gray-500">
                      {kb.documentCount || 0} 个文档
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
