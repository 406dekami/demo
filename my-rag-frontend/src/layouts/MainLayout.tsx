import {useEffect, useState} from 'react'
import {Outlet, useLocation, useNavigate} from 'react-router-dom'
import {Moon, Sun, UserCircle} from 'lucide-react'
import type {KnowledgeBase, Notebook} from '@/types'

interface MainLayoutProps {
  bases: KnowledgeBase[]
  notebooks: Notebook[]
  onAddBase: (base: KnowledgeBase) => void
  onDeleteBase: (id: string) => void
  onCreateNotebook: (notebook: Notebook | Notebook[]) => void
  onDeleteNotebook: (id: string) => Promise<void>
  onUpdateNotebook: (id: string, updates: Partial<Notebook>) => void
}

export const MainLayout = (_props: MainLayoutProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light')

  // 同步主题
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { isDark } }))
  }, [isDark])

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { path: '/mind-map', label: '思维导图', icon: 'Brain' },
    { path: '/knowledge', label: '资料库', icon: 'Database' },
    { path: '/notebook', label: '笔记本', icon: 'BookOpen' },
  ]

  const getPageTitle = (): string => {
    const path = location.pathname
    if (path.startsWith('/settings')) return '用户中心'
    if (path.startsWith('/knowledge')) return '资料库'
    if (path.startsWith('/notebook')) return '笔记本'
    if (path.startsWith('/mind-map')) return '思维导图'
    return '数字逻辑学习助手'
  }

  const getPageMeta = (): { eyebrow: string; hint: string } | null => {
    if (location.pathname.startsWith('/mind-map')) {
      return {
        eyebrow: 'Knowledge Mind Map',
        hint: '单击更新详情 · 双击展开收缩',
      }
    }
    if (location.pathname.startsWith('/knowledge')) {
      return {
        eyebrow: 'Knowledge Repository',
        hint: '上传文档资料 · 浏览与管理资料库',
      }
    }
    if (location.pathname.startsWith('/notebook')) {
      return {
        eyebrow: 'Study Notebook',
        hint: '深度学习笔记 · 记录与整理学习内容',
      }
    }
    return null
  }

  const navButtonClass = (path: string) =>
    isActive(path)
      ? 'bg-blue-600 text-white'
      : isDark
        ? 'text-gray-300 hover:text-white hover:bg-gray-800'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'

  const pageMeta = getPageMeta()

  const iconButtonClass = isDark
    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'

  const handleNavigateToSettings = () => {
    navigate('/settings')
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'} transition-colors duration-300`}>
      <header className={`fixed top-0 left-0 right-0 z-50 h-16 ${isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border-b transition-colors duration-300`}>
        <div className="h-full px-6 flex items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-4">
            <img src="/favicon/favicon.svg" alt="Logo" className="w-8 h-8" />
            <div className="min-w-0">
              <h1 className={`truncate text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} transition-colors`}>{getPageTitle()}</h1>
            </div>
          </div>

          {pageMeta && (
            <div className="hidden min-w-0 flex-1 items-center gap-6 lg:flex">
              <p className={`truncate text-xs uppercase tracking-[0.35em] ${isDark ? 'text-sky-300/70' : 'text-sky-700/70'}`}>
                {pageMeta.eyebrow}
              </p>
              <p className={`truncate text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {pageMeta.hint}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${navButtonClass(item.path)}`}
              >
                {item.label}
              </button>
            ))}
            <div className={`w-px h-6 mx-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg transition-colors ${iconButtonClass}`}
              title="切换主题"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleNavigateToSettings}
              className={`p-2 rounded-lg transition-colors ${iconButtonClass}`}
              title="个人设置"
            >
              <UserCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="pt-16 h-screen overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
