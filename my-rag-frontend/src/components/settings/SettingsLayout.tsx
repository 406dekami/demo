import { type FC, type ReactNode } from 'react'
import { User, Shield, AlertTriangle } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export type SettingsTab = 'profile' | 'security' | 'danger'

type SettingsLayoutProps = {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
  children: ReactNode
}

const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: '个人资料', icon: User },
  { id: 'security', label: '账号安全', icon: Shield },
  { id: 'danger', label: '危险操作', icon: AlertTriangle },
]

export const SettingsLayout: FC<SettingsLayoutProps> = ({ activeTab, onTabChange, children }) => {
  const { isDark } = useTheme()

  return (
    <div className="flex min-h-[calc(100vh-80px)] gap-6">
      {/* 左侧导航 */}
      <aside className={`w-64 shrink-0 rounded-2xl border p-4 ${isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? isDark
                      ? 'bg-sky-500/10 text-sky-400'
                      : 'bg-sky-50 text-sky-600'
                    : isDark
                      ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* 右侧内容 */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
