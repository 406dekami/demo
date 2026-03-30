// KnowledgeDetailPage.tsx
import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Edit2, Check, X, BookOpen } from 'lucide-react'
import type { KnowledgeBase } from '@/types'
import UploadZone from '@/components/knowledge/UploadZone'
import DocumentList from '@/components/knowledge/DocumentList'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

interface Props {
  bases: KnowledgeBase[]
  onAddBase: (base: KnowledgeBase) => void
}

export const KnowledgeDetailPage: FC<Props> = ({ bases, onAddBase }) => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { currentKb, documents, isEditMode, setCurrentKb, setDocuments, addDocuments, removeDocument, toggleEditMode, confirmEdit } = useKnowledgeStore()
  const [editName, setEditName] = useState('')

  // 查找当前知识库
  const knowledgeBase = bases.find(b => b.id === id)
  
  // 初始化知识库
  useEffect(() => {
    if (knowledgeBase && (!currentKb || currentKb.id !== knowledgeBase.id)) {
      setCurrentKb(knowledgeBase)
      
      // 从 API 加载文档列表
      const loadDocuments = async () => {
        try {
          const response = await fetch(`/api/v1/knowledge/${knowledgeBase.id}/documents`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          })
          
          if (!response.ok) {
            console.error('加载文档列表失败')
            return
          }
          
          const result = await response.json()
          
          // 将文档添加到 store（覆盖而不是累加）
          if (result.data?.documents) {
            setDocuments(result.data.documents)
          }
        } catch (error) {
          console.error('加载文档列表失败:', error)
        }
      }
      
      loadDocuments()
    }
  }, [knowledgeBase, currentKb, setCurrentKb, addDocuments])
  
  // 如果没有找到知识库，返回知识库列表
  useEffect(() => {
    if (!knowledgeBase) {
      navigate('/knowledge')
    }
  }, [knowledgeBase, navigate])
  
  // 如果没有找到知识库，不渲染（等待跳转）
  if (!knowledgeBase) {
    return null
  }
  
  // 格式化日期
  const formattedDate = knowledgeBase.updated_at 
    ? new Date(knowledgeBase.updated_at).toLocaleDateString('zh-CN')
    : new Date().toLocaleDateString('zh-CN')

  // 处理开始编辑
  const handleStartEdit = () => {
    setEditName(knowledgeBase.name)
    toggleEditMode()
  }

  // 处理保存编辑
  const handleSaveEdit = () => {
    if (editName.trim()) {
      const updatedBase = { ...knowledgeBase, name: editName.trim() }
      onAddBase(updatedBase)
      confirmEdit()
      setEditName('')
    }
  }

  // 处理取消编辑
  const handleCancelEdit = () => {
    confirmEdit()
    setEditName('')
  }

  // 处理删除文档
  const handleDeleteDocument = async (docId: string) => {
    // 二次确认
    if (!window.confirm('确定要删除这个文档吗？此操作不可恢复')) {
      return
    }
    
    try {
      // 调用后端 API 删除文档
      const response = await fetch(`/api/v1/knowledge/${id}/documents/${docId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || '删除失败')
      }
      
      // 前端状态更新
      removeDocument(docId)
      
      // 不需要刷新页面，直接从 store 读取最新状态即可
      // 如果需要从后端重新加载，可以调用：
      // await loadDocuments()
    } catch (error) {
      console.error('删除文档失败:', error)
      alert(error instanceof Error ? error.message : '删除失败')
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 font-roboto">
      {/* Header */}
      <header className="sticky top-0 z-20 h-16 border-b border-gray-800/80 bg-black/70 backdrop-blur-xl px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/knowledge')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="返回"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* 知识库名称 */}
          {isEditMode ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-all"
                aria-label="保存"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                aria-label="取消"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="font-gs text-xl font-semibold text-white tracking-tight">
                {knowledgeBase.name}
              </h1>
              <button
                onClick={handleStartEdit}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-lg transition-all"
                aria-label="编辑名称"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-lg transition-all" aria-label="搜索">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-lg transition-all" aria-label="更多">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* 知识库信息卡片 */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-gs text-lg font-medium text-white mb-2">知识库简介</h2>
                <p className="text-gray-400 text-sm">
                  {knowledgeBase.description || '暂无描述，点击上方编辑按钮添加描述'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>{documents.length} 个文档</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>更新于 {formattedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 文档管理区域 */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            {/* 上传区域 */}
            <div className="mb-6">
              <UploadZone kbId={id!} disabled={!isEditMode} />
            </div>

            {/* 文档列表 */}
            <DocumentList
              documents={documents}
              isEditMode={isEditMode}
              onDelete={handleDeleteDocument}
            />

            {/* 编辑模式下的确认按钮 */}
            {isEditMode && (
              <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-gray-700">
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-2.5 text-gray-400 hover:text-white transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all"
                >
                  确认编辑
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
