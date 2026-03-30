// my-rag-frontend/src/pages/Notebook/DetailPage.tsx
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2, Edit3, Network } from 'lucide-react'
import type { KnowledgeBase, Notebook } from '@/types'
import ChatArea from '@/components/notebook/ChatArea'
import EditKnowledgeBaseModal from '@/components/notebook/EditKnowledgeBaseModal'
import { KnowledgeGraph } from '@/components/common/KnowledgeGraph'
import { useNotebookStore } from '@/stores/notebookStore'
import toast from 'react-hot-toast'

interface Props {
  notebooks: Notebook[]
  knowledgeBases: KnowledgeBase[]
  onUpdateNotebook: (id: string, updates: Partial<Notebook>) => void
}

export const NotebookDetailPage: FC<Props> = ({ notebooks, knowledgeBases, onUpdateNotebook }) => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { selectedKbIds, setSelectedKbIds, loadFromStorage, saveToStorage, clearMessages } = useNotebookStore()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showGraph, setShowGraph] = useState(false)

  // 查找当前笔记本
  const notebook = notebooks.find(nb => nb.id === id)
  
  // 如果没有找到笔记本，延迟跳转（给状态更新一些时间）
  useEffect(() => {
    // 没有 ID 参数，直接跳转
    if (!id) {
      navigate('/notebook', { replace: true })
      return
    }
    
    // 没有笔记本数据，等待后跳转
    if (!notebook) {
      const timer = setTimeout(() => {
        const stillNotFound = !notebooks.find(nb => nb.id === id)
        if (stillNotFound) {
          navigate('/notebook', { replace: true })
        }
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [notebook, id, navigate, notebooks])
  
  // 加载对话历史
  useEffect(() => {
    if (!id || !notebook) return
    loadFromStorage(id)
  }, [id, notebook, loadFromStorage])

  // 保存对话历史（当切换知识库或离开页面时）
  useEffect(() => {
    if (!id || !notebook) return
    return () => {
      saveToStorage(id)
    }
  }, [id, notebook, saveToStorage])
  
  // 加载中或未找到时不渲染
  if (!notebook) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-gray-400 text-lg">加载中...</div>
      </div>
    )
  }
  
  // 处理编辑保存
  const handleEditSave = async (newKbIds: string[]) => {
    try {
      // 先调用后端 API 更新（需要传递 title 字段）
      const { updateNotebook } = await import('@/api/knowledge')
      await updateNotebook(id!, { 
        title: notebook.title,  // 使用当前笔记本标题
        kb_ids: newKbIds 
      })
      
      // 更新前端状态
      setSelectedKbIds(newKbIds)
      // 清空消息，因为知识库变了
      clearMessages()
      toast.success('知识库已更新')
      console.log('✅ 知识库已更新:', newKbIds)
      
      // 同步更新到父组件的笔记本列表
      onUpdateNotebook(id!, { kb_ids: newKbIds })
    } catch (error) {
      console.error('更新失败:', error)
      toast.error(error instanceof Error ? error.message : '更新失败')
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 font-roboto">
      {/* Header */}
      <header className="sticky top-0 z-20 h-16 border-b border-gray-800/80 bg-black/70 backdrop-blur-xl px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              // 清除所有状态并返回笔记本列表
              clearMessages()
              navigate('/notebook', { replace: true })
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <h1 className="font-gs text-xl font-semibold text-white tracking-tight">
              {notebook.title}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              基于知识库的智能问答
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 知识图谱按钮 */}
          <button
            onClick={() => setShowGraph(!showGraph)}
            className={`p-2 rounded-lg transition-all ${
              showGraph 
                ? 'text-blue-400 bg-blue-500/20' 
                : 'text-gray-400 hover:text-purple-400 hover:bg-purple-500/10'
            }`}
            aria-label="知识图谱"
            title={showGraph ? '隐藏图谱' : '显示图谱'}
          >
            <Network className="w-5 h-5" />
          </button>
          
          {/* 编辑按钮 */}
          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
            aria-label="编辑知识库"
            title="编辑关联的知识库"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          
          {/* 清空对话按钮 */}
          <button
            onClick={() => {
              if (confirm('确定要清空当前对话吗？')) {
                clearMessages()
              }
            }}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            aria-label="清空对话"
            title="清空对话"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* 知识图谱区域 */}
          {showGraph && (
            <div className="mb-6">
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Network className="w-5 h-5 text-blue-400" />
                  知识图谱可视化
                </h2>
                <KnowledgeGraph 
                  notebookId={id!}
                  height="500px"
                  onNodeClick={(node) => {
                    console.log('点击节点:', node)
                    toast.success(`点击了：${node.label} (${node.type})`)
                  }}
                />
              </div>
            </div>
          )}
          
          {/* 问答区域卡片 */}
          <div 
            className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden"
            style={{ height: 'calc(100vh - 180px)', minHeight: '600px' }}
          >
            {/* 提示信息 */}
            {selectedKbIds.length === 0 && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl px-4 py-2 text-yellow-400 text-sm">
                  请从右上角选择至少一个知识库
                </div>
              </div>
            )}
            
            <ChatArea kbIds={selectedKbIds} notebookId={id!} />
          </div>
        </div>
      </main>

      {/* 编辑知识库 Modal */}
      <EditKnowledgeBaseModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSave}
        currentKbIds={selectedKbIds}
        knowledgeBases={knowledgeBases}
      />
    </div>
  )
}
