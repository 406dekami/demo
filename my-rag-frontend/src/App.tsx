// App.tsx
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { AuthPage } from '@/components/auth'
import { HomePage } from '@/pages/home'
import { KnowledgeDetailPage } from './pages/Knowledge/DetailPage'
import { NotebookDetailPage } from './pages/Notebook/DetailPage'
import { MindMapPage } from './pages/MindMap'
import { SettingsPage } from './pages/SettingsPage'
import { LandingPage } from './pages/LandingPage'
import { MainLayout } from './layouts/MainLayout'
import type { KnowledgeBase, Notebook } from './types'
import toast from 'react-hot-toast'

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
      <Route path="/" element={!checkLoginStatus() ? <LandingPage /> : <Navigate to="/mind-map" replace />} />
      <Route path="/auth" element={!checkLoginStatus() ? <AuthPage onLoginSuccess={() => window.location.href = '/mind-map'} /> : <Navigate to="/knowledge" replace />} />

      <Route element={<MainLayout bases={knowledgeBases} notebooks={notebooks} onAddBase={handleAddBase} onDeleteBase={handleDeleteBase} onCreateNotebook={handleCreateNotebook} onDeleteNotebook={handleDeleteNotebook} onUpdateNotebook={handleUpdateNotebook} />}>
        <Route path="mind-map" element={<MindMapPage />} />
        <Route path="knowledge" element={<HomePage bases={knowledgeBases} onAddBase={handleAddBase} onDeleteBase={handleDeleteBase} notebooks={notebooks} onCreateNotebook={handleCreateNotebook} onDeleteNotebook={handleDeleteNotebook} />} />
        <Route path="notebook" element={<HomePage bases={knowledgeBases} onAddBase={handleAddBase} onDeleteBase={handleDeleteBase} notebooks={notebooks} onCreateNotebook={handleCreateNotebook} onDeleteNotebook={handleDeleteNotebook} />} />
        <Route path="knowledge/:id" element={<KnowledgeDetailPage bases={knowledgeBases} onAddBase={handleAddBase} />} />
        <Route path="notebook/:id" element={<NotebookDetailPage notebooks={notebooks} knowledgeBases={knowledgeBases} onUpdateNotebook={handleUpdateNotebook} />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/:tab?" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={checkLoginStatus() ? '/mind-map' : '/'} replace />} />
    </Routes>
  )
}