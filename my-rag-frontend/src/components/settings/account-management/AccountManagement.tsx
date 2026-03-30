// AccountManagement.tsx
import type {FC} from 'react'
import { LogOut } from 'lucide-react'

interface AccountManagementProps {
  handleLogout: () => void
}

interface UserInfo {
  email: string
  name?: string
  avatar?: string
}

export const AccountManagement: FC<AccountManagementProps> = ({ handleLogout }) => {
  // 获取用户信息
  const getUserInfo = (): UserInfo | null => {
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      try {
        return JSON.parse(userInfo)
      } catch {
        return null
      }
    }
    return null
  }

  const userInfo = getUserInfo()

  // 处理登出
  const onLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
    localStorage.removeItem('remembered_phone')
    handleLogout()
  }

  // 修改密码（预留功能）
  const handleChangePassword = () => {
    alert('修改密码功能开发中...')
  }

  // 编辑资料（预留功能）
  const handleEditProfile = () => {
    alert('编辑资料功能开发中...')
  }

  return (
    <div className="space-y-6">
      {/* 用户信息卡片 */}
      <div className="dark:bg-gray-800/30 bg-gray-100 backdrop-blur-sm dark:border-gray-700/50 border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          {/* 头像 */}
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30">
            {userInfo?.name?.charAt(0).toUpperCase() || userInfo?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          {/* 用户信息 */}
          <div className="flex-1">
            <h3 className="font-gs font-medium dark:text-white text-gray-900 text-xl">
              {userInfo?.name || '用户'}
            </h3>
            <p className="dark:text-gray-400 text-gray-600 text-sm mt-1">{userInfo?.email}</p>
          </div>

          {/* 编辑按钮 */}
          <button
            onClick={handleEditProfile}
            className="px-4 py-2 dark:bg-gray-700/50 bg-gray-200 dark:hover:bg-gray-600/50 hover:bg-gray-300 rounded-lg text-sm dark:text-gray-300 text-gray-700 dark:hover:text-white hover:text-gray-900 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            编辑资料
          </button>
        </div>

        {/* 分隔线 */}
        <div className="dark:border-gray-700/50 border-gray-200 mb-6" />

        {/* 账号设置选项 */}
        <div className="space-y-2">
          <button
            onClick={handleChangePassword}
            className="w-full px-4 py-3 flex items-center justify-between dark:bg-gray-900/30 bg-gray-50 dark:hover:bg-gray-700/30 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 dark:text-gray-400 text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="dark:text-gray-300 text-gray-700 group-hover:text-white transition-colors">修改密码</span>
            </div>
            <svg className="w-5 h-5 dark:text-gray-500 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            className="w-full px-4 py-3 flex items-center justify-between dark:bg-gray-900/30 bg-gray-50 dark:hover:bg-gray-700/30 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 dark:text-gray-400 text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="dark:text-gray-300 text-gray-700 group-hover:text-white transition-colors">绑定邮箱</span>
            </div>
            <svg className="w-5 h-5 dark:text-gray-500 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            className="w-full px-4 py-3 flex items-center justify-between dark:bg-gray-900/30 bg-gray-50 dark:hover:bg-gray-700/30 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 dark:text-gray-400 text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="dark:text-gray-300 text-gray-700 group-hover:text-white transition-colors">绑定手机</span>
            </div>
            <svg className="w-5 h-5 dark:text-gray-500 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 危险区域 */}
      <div className="bg-red-500/5 backdrop-blur-sm dark:border-red-500/20 border-red-500/30 rounded-2xl p-6">
        <h3 className="font-gs font-medium dark:text-red-400 text-red-600 text-lg mb-2">危险操作</h3>
        <p className="dark:text-gray-400 text-gray-600 text-sm mb-4">以下操作是不可逆的，请谨慎操作</p>
        
        <div className="space-y-2">
          <button
            onClick={onLogout}
            className="w-full px-4 py-3 flex items-center justify-between bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 dark:text-red-400 text-red-600" />
              <span className="dark:text-red-400 text-red-600 font-medium">退出登录</span>
            </div>
            <svg className="w-5 h-5 dark:text-red-400/50 text-red-600/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            className="w-full px-4 py-3 flex items-center justify-between bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all duration-200 group opacity-50 cursor-not-allowed"
            disabled
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 dark:text-red-400 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="dark:text-red-400 text-red-600 font-medium">注销账号</span>
            </div>
            <span className="text-xs dark:text-red-400/50 text-red-600/50">开发中</span>
          </button>
        </div>
      </div>

      {/* 版本信息 */}
      <div className="text-center pt-6">
        <p className="dark:text-gray-500 text-gray-500 text-sm">
          当前版本 v1.0.0
        </p>
        <p className="dark:text-gray-600 text-gray-400 text-xs mt-1">
          Build 2026.03.18
        </p>
      </div>
    </div>
  )
}
