// KnowledgeGridPage.tsx
import { type FC, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { KnowledgeBase, Notebook } from '@/types.ts'
import { KnowledgeCard } from '@/components/knowledge'
import { FaPlus, FaEye, FaSearch, FaEllipsisV } from 'react-icons/fa'

interface Props {
  bases: KnowledgeBase[]
  onAddBase: (base: KnowledgeBase) => void
  onDeleteBase: (id: string) => void
}

const patterns: Notebook['pattern'][] = ['dots', 'waves', 'tiles', 'hearts', 'rain', 'triangles', 'solid']
const coverColors = ['#fef3c7', '#bfdbfe', '#fecaca', '#e0f2fe', '#fde68a', '#a7f3d0', '#ddd6fe']

export const KnowledgeGridPage: FC<Props> = ({ bases, onAddBase, onDeleteBase }) => {
  const navigate = useNavigate()
  // const [showNewModal, setShowNewModal] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  // 预计算封面样式
  const getNotebookPreview = useMemo(() => (b: KnowledgeBase): Notebook => ({
    id: b.id,
    title: b.name,
    coverColor: coverColors[b.id.charCodeAt(0) % coverColors.length],
    pattern: patterns[b.id.charCodeAt(1) % patterns.length],
    lastUpdated: b.updated_at || new Date().toISOString(),
  }), [])

  // 创建新知识库
  const handleCreateNewBase = () => {
    const newBase: KnowledgeBase = {
      id: `kb_${Date.now()}`,
      name: `新知识库 ${bases.length + 1}`,
      description: '',
      documentCount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    onAddBase(newBase)
    // 跳转到新知识库详情页
    navigate(`/knowledge/${newBase.id}`)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 font-roboto">
      {/* Header */}
      <header className="sticky top-0 z-20 h-16 border-b border-gray-800/80 bg-black/70 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
            N
          </div>
          <h1 className="font-gs text-xl font-semibold text-white tracking-tight">知识库</h1>
        </div>
        
        <div className="flex items-center gap-1.5 relative">
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="视图切换"
          >
            <FaEye className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="搜索"
          >
            <FaSearch className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-label="更多"
            >
              <FaEllipsisV className="w-5 h-5" />
            </button>
                      
            {/* 下拉菜单 */}
            {showMoreMenu && (
              <>
                {/* 遮罩层 */}
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowMoreMenu(false)}
                />
                          
                {/* 菜单面板 */}
                <div className="absolute right-0 mt-2 w-56 bg-gray-800/95 backdrop-blur-xl border border-gray-700/80 rounded-xl shadow-2xl shadow-black/50 z-40 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('/settings/model')
                        setShowMoreMenu(false)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700/80 hover:text-white transition-all duration-200 flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      模型管理
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings/datasource')
                        setShowMoreMenu(false)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700/80 hover:text-white transition-all duration-200 flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      资料库管理
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings/account')
                        setShowMoreMenu(false)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700/80 hover:text-white transition-all duration-200 flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      账号管理
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            
            {/* Create New Card */}
            <button
              type="button"
              onClick={handleCreateNewBase}
              className="group relative flex flex-col items-center justify-center min-h-70 p-6
                         bg-gray-900/30 backdrop-blur-sm border-2 border-dashed border-gray-700 
                         rounded-2xl hover:border-blue-500/50 hover:bg-gray-800/50 hover:shadow-xl hover:shadow-blue-500/20
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
                         transition-all duration-300 ease-out"
              aria-label="新建知识库"
            >
              <div className="w-16 h-16 bg-linear-to-br from-blue-500/20 to-purple-600/20 rounded-2xl
                            flex items-center justify-center text-blue-400 
                            group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/30
                            transition-all duration-300">
                <FaPlus className="w-8 h-8" />
              </div>
              <span className="font-gs font-medium text-gray-200 mt-4 text-lg group-hover:text-white transition-colors">
                新建知识库
              </span>
              <span className="text-sm text-gray-500 mt-1.5 group-hover:text-gray-400 transition-colors">
                添加文档开始探索
              </span>
              
              {/* Decorative corner */}
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500/0 group-hover:bg-blue-500 transition-colors duration-300" aria-hidden="true" />
            </button>

            {/* Knowledge Base Cards */}
            {bases.map((b) => (
              <KnowledgeCard
                key={b.id}
                base={b}
                preview={getNotebookPreview(b)}
                onDelete={onDeleteBase}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
