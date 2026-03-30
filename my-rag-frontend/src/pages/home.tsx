// HomePage.tsx - 主页框架，包含知识库和笔记本切换
import { type FC, useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { KnowledgeBase as LocalKnowledgeBase, Notebook } from '@/types'
import { KnowledgeCard } from '@/components/knowledge'
import { NotebookGridPage } from '@/pages/Notebook'
import { KnowledgeGraphPage } from '@/pages/KnowledgeGraph'
import { FaPlus, FaEye, FaSearch, FaEllipsisV, FaSun, FaMoon } from 'react-icons/fa'
import { TEXT_STYLES, LAYOUT, BUTTON, DECORATION, DROPDOWN, DARK_MODE } from '@/styles/constants'
import { getKnowledgeBases, createKnowledgeBase, deleteKnowledgeBase, getNotebooks } from '@/api/knowledge'
import { toast } from 'react-hot-toast'
import CreateKnowledgeBaseModal from '@/components/knowledge/CreateKnowledgeBaseModal'
import type { KnowledgeBase } from '@/types'

interface Props {
  bases: KnowledgeBase[]
  onAddBase: (base: KnowledgeBase) => void
  onDeleteBase: (id: string) => void
  notebooks: Notebook[]
  onCreateNotebook: (notebook: Notebook | Notebook[]) => void
  onDeleteNotebook: (id: string) => void
}

export const HomePage: FC<Props> = ({ bases, onAddBase, onDeleteBase, notebooks, onCreateNotebook, onDeleteNotebook }) => {
  const navigate = useNavigate()
  // 根据当前路径决定默认标签页
  const [activeTab, setActiveTab] = useState<'knowledge' | 'notebook' | 'graph'>(() => {
    const path = window.location.pathname
    if (path === '/notebook') return 'notebook'
    if (path === '/knowledge-graph') return 'graph'
    return 'knowledge'
  })
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 从 localStorage 读取用户偏好
    const saved = localStorage.getItem('theme')
    if (saved) {
      return saved === 'dark'
    }
    // 默认使用系统偏好
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // 切换标签页时更新 URL
  useEffect(() => {
    const targetPath = activeTab === 'knowledge' ? '/knowledge' 
      : activeTab === 'notebook' ? '/notebook' 
      : '/knowledge-graph'
    if (window.location.pathname !== targetPath) {
      navigate(targetPath, { replace: true })
    }
  }, [activeTab, navigate])

  // 加载知识库列表
  useEffect(() => {
    const loadKnowledgeBases = async () => {
      try {
        setIsLoading(true)
        const kbs = await getKnowledgeBases()
        // 直接替换整个列表，不清空再添加
        const formattedKbs = kbs.map(kb => ({
          ...kb,
          documentCount: kb.document_count || 0,
        } as LocalKnowledgeBase))
        
        // 清空旧数据并添加新数据
        formattedKbs.forEach(kb => onAddBase(kb))
      } catch (error) {
        console.error('加载知识库失败:', error)
        toast.error(error instanceof Error ? error.message : '加载失败')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadKnowledgeBases().catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 移除 onAddBase 依赖，避免无限循环

  // 加载笔记本列表
  useEffect(() => {
    const loadNotebooks = async () => {
      try {
        const nbs = await getNotebooks()
        // 为每本笔记本生成封面样式
        const formattedNbs = nbs.map(nb => ({
          ...nb,
          coverColor: ['#fef3c7', '#bfdbfe', '#fecaca', '#e0f2fe', '#fde68a', '#a7f3d0', '#ddd6fe'][nb.id.charCodeAt(0) % 7],
          pattern: ['dots', 'waves', 'tiles', 'hearts', 'rain', 'triangles', 'solid'][nb.id.charCodeAt(1) % 7] as Notebook['pattern'],
          lastUpdated: nb.updated_at || new Date().toISOString(),
        }))
        // 直接设置整个列表，避免重复添加
        onCreateNotebook(formattedNbs)
      } catch (error) {
        console.error('加载笔记本失败:', error)
        toast.error(error instanceof Error ? error.message : '加载失败')
      }
    }
    
    // 只在 notebooks 为空时才加载
    if (notebooks.length === 0) {
      loadNotebooks().catch(console.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 移除 onCreateNotebook 依赖

  // 预计算封面样式
  const getNotebookPreview = useMemo(() => (b: KnowledgeBase): Notebook => ({
    id: b.id,
    title: b.name,
    coverColor: ['#fef3c7', '#bfdbfe', '#fecaca', '#e0f2fe', '#fde68a', '#a7f3d0', '#ddd6fe'][b.id.charCodeAt(0) % 7],
    pattern: ['dots', 'waves', 'tiles', 'hearts', 'rain', 'triangles', 'solid'][b.id.charCodeAt(1) % 7] as Notebook['pattern'],
    lastUpdated: b.updated_at || new Date().toISOString(),
  }), [])

  // 主题切换效果
  useEffect(() => {
    const html = document.documentElement
    if (isDarkMode) {
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  // 创建新知识库
  const handleCreateNewBase = async (data: { name: string; description: string; chunk_size: number; chunk_overlap: number }) => {
    if (isCreating) return
    
    setIsCreating(true)
    try {
      const newBase = await createKnowledgeBase(data)
      
      toast.success('知识库创建成功！')
      onAddBase({
        ...newBase,
        documentCount: 0,
      } as LocalKnowledgeBase)
      navigate(`/knowledge/${newBase.id}`)
    } catch (error) {
      console.error('创建知识库失败:', error)
      toast.error(error instanceof Error ? error.message : '创建失败')
      throw error // 让对话框知道失败
    } finally {
      setIsCreating(false)
    }
  }

  // 删除知识库
  const handleDeleteBase = async (id: string) => {
    if (!confirm('确定要删除这个知识库吗？')) return
    
    try {
      await deleteKnowledgeBase(id)
      toast.success('删除成功')
      onDeleteBase(id)
    } catch (error) {
      console.error('删除失败:', error)
      toast.error(error instanceof Error ? error.message : '删除失败')
    }
  }

  return (
    <div className={LAYOUT.PAGE}>
      {/* Header */}
      <header className={LAYOUT.HEADER}>
        <div className="flex items-center gap-3">
          <div className={DARK_MODE.ICON_LOGO}>
            N
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`${TEXT_STYLES.TAB_BUTTON} ${
                activeTab === 'knowledge' ? TEXT_STYLES.TAB_ACTIVE : TEXT_STYLES.TAB_INACTIVE
              }`}
            >
              知识库
            </button>
            <span className={TEXT_STYLES.TAB_INACTIVE}>|</span>
            <button
              onClick={() => setActiveTab('notebook')}
              className={`${TEXT_STYLES.TAB_BUTTON} ${
                activeTab === 'notebook' ? TEXT_STYLES.TAB_ACTIVE : TEXT_STYLES.TAB_INACTIVE
              }`}
            >
              笔记本
            </button>
            <span className={TEXT_STYLES.TAB_INACTIVE}>|</span>
            <button
              onClick={() => setActiveTab('graph')}
              className={`${TEXT_STYLES.TAB_BUTTON} ${
                activeTab === 'graph' ? TEXT_STYLES.TAB_ACTIVE : TEXT_STYLES.TAB_INACTIVE
              }`}
            >
              知识图谱
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 relative">
          {/* 主题切换按钮 */}
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={BUTTON.ICON}
            aria-label={isDarkMode ? '切换到日间模式' : '切换到暗夜模式'}
            title={isDarkMode ? '切换到日间模式' : '切换到暗夜模式'}
          >
            {isDarkMode ? (
              <FaSun className="w-5 h-5" />
            ) : (
              <FaMoon className="w-5 h-5" />
            )}
          </button>
          
          <button
            type="button"
            className={BUTTON.ICON}
            aria-label="视图切换"
          >
            <FaEye className="w-5 h-5" />
          </button>
          <button
            type="button"
            className={BUTTON.ICON}
            aria-label="搜索"
          >
            <FaSearch className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={BUTTON.ICON}
              aria-label="更多"
            >
              <FaEllipsisV className="w-5 h-5" />
            </button>

            {/* 下拉菜单 */}
            {showMoreMenu && (
              <>
                {/* 遮罩层 */}
                <div 
                  className={DROPDOWN.OVERLAY}
                  onClick={() => setShowMoreMenu(false)}
                />
                                      
                {/* 菜单面板 */}
                <div className={DARK_MODE.DROPDOWN_MENU}>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate('/settings/model')
                        setShowMoreMenu(false)
                      }}
                      className={DARK_MODE.DROPDOWN_ITEM}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      模型管理
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings/datasource')
                        setShowMoreMenu(false)
                      }}
                      className={DARK_MODE.DROPDOWN_ITEM}
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
                      className={DARK_MODE.DROPDOWN_ITEM}
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
      <main className={LAYOUT.MAIN}>
        <div className={LAYOUT.CONTAINER}>
          {activeTab === 'knowledge' ? (
            <div className={LAYOUT.GRID}>
              {/* Create New Card */}
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className={DARK_MODE.CARD_CREATE}
                aria-label="新建知识库"
              >
                <div className={DARK_MODE.ICON_BASE}>
                  <FaPlus className="w-8 h-8" />
                </div>
                <span className={TEXT_STYLES.TITLE_PRIMARY}>
                  新建知识库
                </span>
                <span className={TEXT_STYLES.DESCRIPTION}>
                  添加文档开始探索
                </span>
                      
                {/* Decorative corner */}
                <div className={DECORATION.CORNER_DOT} aria-hidden="true" />
              </button>
      
              {/* Knowledge Base Cards */}
              {isLoading ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <div className="text-gray-400">加载中...</div>
                </div>
              ) : (
                bases.map((b) => (
                  <KnowledgeCard
                    key={b.id}
                    base={b}
                    preview={getNotebookPreview(b)}
                    onDelete={handleDeleteBase}
                  />
                ))
              )}
            </div>
          ) : activeTab === 'notebook' ? (
            <NotebookGridPage 
              notebooks={notebooks}
              onCreateNotebook={onCreateNotebook}
              onDeleteNotebook={onDeleteNotebook}
            />
          ) : (
            <KnowledgeGraphPage />
          )}
        </div>
      </main>
      
      {/* 创建知识库对话框 */}
      <CreateKnowledgeBaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateNewBase}
      />
    </div>
  )
}
