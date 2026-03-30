import { type FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SettingsLayout, type SettingsTab, ProfileSettings, SecuritySettings, DangerSettings } from '@/components/settings'
import { useTheme } from '@/hooks/useTheme'

export const SettingsPage: FC = () => {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    navigate('/', { replace: true })
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />
      case 'security':
        return <SecuritySettings />
      case 'danger':
        return <DangerSettings handleLogout={handleLogout} />
      default:
        return <ProfileSettings />
    }
  }

  return (
    <div className={`min-h-screen px-6 py-6 ${isDark ? 'bg-[radial-gradient(circle_at_top,rgba(14,165,233,.16),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(167,139,250,.18),transparent_26%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100' : 'bg-linear-to-b from-blue-50 via-white to-sky-50 text-slate-900'}`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>用户中心</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>管理您的个人信息和账号设置</p>
        </div>
        <SettingsLayout activeTab={activeTab} onTabChange={setActiveTab}>
          {renderContent()}
        </SettingsLayout>
      </div>
    </div>
  )
}
