// SettingsPage.tsx
import React from "react";
import type{FC} from "react";
import {useState, useEffect} from "react";
import { useNavigate, useLocation } from 'react-router-dom'
import { ModelManagement, DataSourceManagement, AccountManagement } from '../components/settings'


type SettingsTab = 'model' | 'datasource' | 'account'

export const SettingsPage: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<SettingsTab>('model')
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) {
      return saved === 'dark'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

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

  // 从路由判断初始 tab
  React.useEffect(() => {
    if (location.pathname.includes('datasource')) {
      setActiveTab('datasource')
    } else if (location.pathname.includes('account')) {
      setActiveTab('account')
    }
  }, [location.pathname])

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab)
    navigate(`/settings/${tab}`)
  }

  // 返回到知识库页面
  const handleBack = () => {
    navigate('/knowledge')
  }

  return (
    <div className={`min-h-screen font-roboto ${
      isDarkMode 
        ? 'bg-linear-to-br from-gray-900 via-black to-gray-900' 
        : 'bg-linear-to-br from-gray-50 via-white to-gray-100'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-20 h-16 border-b backdrop-blur-xl px-6 flex items-center justify-between ${
        isDarkMode 
          ? 'border-gray-800/80 bg-black/70' 
          : 'border-gray-200 bg-white/80'
      }`}>
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className={`p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
              isDarkMode 
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/80' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label="返回"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className={`font-gs text-xl font-semibold tracking-tight ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>设置</h1>
        </div>
        
        {/* Tab 切换 */}
        <div className={`flex items-center gap-1 rounded-lg p-1 ${
          isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'
        }`}>
          <button
            onClick={() => handleTabChange('model')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'model'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            模型管理
          </button>
          <button
            onClick={() => handleTabChange('datasource')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'datasource'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            资料库管理
          </button>
          <button
            onClick={() => handleTabChange('account')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'account'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            账号管理
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* 主题切换按钮 */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
              isDarkMode 
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/80' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label={isDarkMode ? '切换到日间模式' : '切换到暗夜模式'}
            title={isDarkMode ? '切换到日间模式' : '切换到暗夜模式'}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <div className="w-4" /> {/* 占位，保持返回按钮居中 */}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'model' ? (
            <ModelManagement />
          ) : activeTab === 'datasource' ? (
            <DataSourceManagement />
          ) : (
            <AccountManagement />
          )}
        </div>
      </main>
    </div>
  )
}
