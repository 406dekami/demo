// App.tsx
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { AuthPage } from '@/components/auth'
import { HomePage } from '@/pages/home'
import { KnowledgeDetailPage } from './pages/Knowledge/DetailPage'
import { NotebookDetailPage } from './pages/Notebook/DetailPage'
// import { KnowledgeGraphPage } from '@/pages/KnowledgeGraph'
import { SettingsPage } from './pages/SettingsPage'
import type { KnowledgeBase, Notebook } from './types'
// 🔥 新增：导入 lucide-react 图标
import { Laptop, ArrowRight, Zap, Lightbulb, Users } from 'lucide-react'
import toast from 'react-hot-toast'

// 🔥 提取 LandingPage 为独立组件
const LandingPage = () => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
    {/* 光晕效果 */}
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

    {/* 主内容区域 */}
    <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
      {/* Logo - 🔥 替换内联 SVG */}
      <div className="mb-12 flex justify-center">
        <div className="p-4 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/30">
          <Laptop className="w-20 h-20 text-white" strokeWidth={1.5} />
        </div>
      </div>

      {/* 主标题 */}
      <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight drop-shadow-lg">
        你的数字逻辑学习好帮手
      </h1>

      {/* 副标题 */}
      <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light tracking-wide">
        智能 · 高效 · 便捷
      </p>

      <p className="text-base text-gray-400 mb-16 max-w-2xl mx-auto leading-relaxed">
        专为数字逻辑课程设计的学习辅助平台，帮助你轻松掌握复杂概念，提升学习效率
      </p>

      {/* CTA 按钮 - 🔥 替换箭头 SVG */}
      <button
        onClick={() => window.location.href = '/auth'}
        className="group relative px-12 py-5 bg-blue-600 hover:bg-blue-700
                   text-white font-semibold text-lg rounded-full shadow-lg shadow-blue-500/30
                   transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/50
                   focus:outline-none focus:ring-4 focus:ring-blue-500/50 active:scale-95"
      >
        <span className="flex items-center gap-3">
          立即登录体验
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
        </span>
      </button>

      {/* 特性展示 - 🔥 替换三个内联 SVG */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-400">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="font-medium text-gray-300 mb-2">快速响应</h3>
          <p className="text-sm">即时解答你的疑问</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="font-medium text-gray-300 mb-2">智能分析</h3>
          <p className="text-sm">深入理解知识点</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 mb-4 rounded-full bg-pink-500/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-pink-400" />
          </div>
          <h3 className="font-medium text-gray-300 mb-2">个性化</h3>
          <p className="text-sm">定制专属学习方案</p>
        </div>
      </div>
    </div>

    {/* 底部版权 */}
    <footer className="absolute bottom-4 text-gray-500 text-sm z-10">
      <p>&copy; 2026 数字逻辑学习助手。All rights reserved.</p>
    </footer>
  </div>
)

export default function App() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [notebooks, setNotebooks] = useState<Notebook[]>([])

  const checkLoginStatus = (): boolean => {
    const token = localStorage.getItem('auth_token')
    return !!token
  }

  useEffect(() => {
    checkLoginStatus()
  }, [])

  // 提取公共的 handlers
  const handleAddBase = (base: KnowledgeBase) => {
    setKnowledgeBases(prev => {
      const exists = prev.find(b => b.id === base.id)
      if (exists) {
        return prev.map(b => b.id === base.id ? base : b)
      }
      return [...prev, base]
    })
  }

  const handleDeleteBase = (id: string) => {
    if (confirm('确定要删除这个知识库吗？')) {
      setKnowledgeBases(prev => prev.filter(b => b.id !== id))
    }
  }

  const handleCreateNotebook = (notebook: Notebook | Notebook[]) => {
    setNotebooks(prev => {
      // 支持传入单本笔记本或数组
      const notebooksToAdd = Array.isArray(notebook) ? notebook : [notebook]
      
      // 过滤掉已存在的笔记本
      const newNotebooks = notebooksToAdd.filter(nb => !prev.find(p => p.id === nb.id))
      
      if (newNotebooks.length === 0) {
        console.log('⚠️ 所有笔记本都已存在，跳过添加')
        return prev
      }
      
      console.log('✅ 添加新笔记本:', newNotebooks.map(nb => nb.id))
      return [...prev, ...newNotebooks]
    })
  }

  const handleDeleteNotebook = async (id: string) => {
    try {
      // 调用 API 删除笔记本
      const { deleteNotebook } = await import('@/api/knowledge')
      await deleteNotebook(id)
      
      // 从状态中移除
      setNotebooks(prev => {
        const newNotebooks = prev.filter(nb => nb.id !== id)
        console.log('📝 笔记本列表已更新:', {
          before: prev.length,
          after: newNotebooks.length,
          deletedId: id
        })
        return newNotebooks
      })
      
      // 显示成功提示
      toast.success('笔记本已删除')
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败：' + (error instanceof Error ? error.message : '未知错误'))
      throw error // 让调用者知道失败
    }
  }

  const handleUpdateNotebook = (id: string, updates: Partial<Notebook>) => {
    setNotebooks(prev => {
      return prev.map(nb => {
        if (nb.id === id) {
          // 只更新指定的字段，保留其他计算字段（coverColor, pattern 等）
          return { ...nb, ...updates }
        }
        return nb
      })
    })
    console.log('📝 笔记本已更新:', id, updates)
    
    // 同时更新 localStorage，保持持久化
    try {
      const key = `notebook_${id}_conversation`
      const saved = localStorage.getItem(key)
      if (saved) {
        const data = JSON.parse(saved)
        data.selectedKbIds = updates.kb_ids || []
        localStorage.setItem(key, JSON.stringify(data))
        console.log('💾 已更新 localStorage:', key)
      }
    } catch (error) {
      console.error('更新 localStorage 失败:', error)
    }
  }

  return (
    <Routes>
      {/* 首页 / 落地页 */}
      <Route
        path="/"
        element={
          !checkLoginStatus() ? (
            <LandingPage />
          ) : (
            <Navigate to="/knowledge" replace />
          )
        }
      />

      {/* 登录页面 */}
      <Route
        path="/auth"
        element={
          !checkLoginStatus() ? (
            <AuthPage onLoginSuccess={() => {
              window.location.href = '/knowledge'
            }} />
          ) : (
            <Navigate to="/knowledge" replace />
          )
        }
      />

      {/* 知识库页面 */}
      <Route
        path="/knowledge"
        element={
          checkLoginStatus() ? (
            <HomePage
              bases={knowledgeBases}
              onAddBase={handleAddBase}
              onDeleteBase={handleDeleteBase}
              notebooks={notebooks}
              onCreateNotebook={handleCreateNotebook}
              onDeleteNotebook={handleDeleteNotebook}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* 笔记本路由，重定向到知识库页面（通过 activeTab 控制） */}
      <Route
        path="/notebook"
        element={
          checkLoginStatus() ? (
            <HomePage
              bases={knowledgeBases}
              onAddBase={handleAddBase}
              onDeleteBase={handleDeleteBase}
              notebooks={notebooks}
              onCreateNotebook={handleCreateNotebook}
              onDeleteNotebook={handleDeleteNotebook}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* 知识图谱路由，重定向到知识库页面（通过 activeTab 控制） */}
      <Route
        path="/knowledge-graph"
        element={
          checkLoginStatus() ? (
            <HomePage
              bases={knowledgeBases}
              onAddBase={handleAddBase}
              onDeleteBase={handleDeleteBase}
              notebooks={notebooks}
              onCreateNotebook={handleCreateNotebook}
              onDeleteNotebook={handleDeleteNotebook}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* 知识库详情页面 */}
      <Route
        path="/knowledge/:id"
        element={
          checkLoginStatus() ? (
            <KnowledgeDetailPage
              bases={knowledgeBases}
              onAddBase={handleAddBase}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* 笔记本详情页面 */}
      <Route
        path="/notebook/:id"
        element={
          checkLoginStatus() ? (
            <NotebookDetailPage
              notebooks={notebooks}
              knowledgeBases={knowledgeBases}
              onUpdateNotebook={handleUpdateNotebook}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* 设置页面 */}
      <Route
        path="/settings/:tab?"
        element={
          checkLoginStatus() ? (
            <SettingsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* 404 重定向 */}
      <Route path="*" element={<Navigate to="/knowledge" replace />} />
    </Routes>
  )
}