import { type FC } from 'react'
import { LogOut, Trash2, AlertTriangle } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

type DangerSettingsProps = {
  handleLogout: () => void
}

export const DangerSettings: FC<DangerSettingsProps> = ({ handleLogout }) => {
  const { isDark } = useTheme()

  const handleLogoutClick = () => {
    if (window.confirm('确定要退出登录吗？')) {
      handleLogout()
    }
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>危险操作</h2>
        <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>以下操作是不可逆的，请谨慎操作</p>
      </div>

      {/* 退出登录 */}
      <div className={`rounded-2xl border border-rose-200/50 bg-rose-50/50 p-6 dark:border-rose-900/30 dark:bg-rose-950/20`}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30">
            <LogOut className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className={`text-base font-semibold ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>退出登录</h3>
            <p className={`mt-1 text-sm ${isDark ? 'text-rose-400/80' : 'text-rose-600/80'}`}>
              退出当前账号，需要重新登录才能继续使用
            </p>
            <button
              type="button"
              onClick={handleLogoutClick}
              className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-rose-600"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>
        </div>
      </div>

      {/* 注销账号 */}
      <div className={`rounded-2xl border border-rose-200/30 bg-rose-50/30 p-6 opacity-60 dark:border-rose-900/20 dark:bg-rose-950/10`}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100/50 dark:bg-rose-900/20">
            <Trash2 className="h-6 w-6 text-rose-400 dark:text-rose-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-semibold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>注销账号</h3>
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                开发中
              </span>
            </div>
            <p className={`mt-1 text-sm ${isDark ? 'text-rose-400/60' : 'text-rose-500/70'}`}>
              永久删除账号及所有相关数据，此操作不可恢复
            </p>
            <button
              type="button"
              disabled
              className="mt-4 flex cursor-not-allowed items-center gap-2 rounded-xl bg-rose-300 px-4 py-2 text-sm font-medium text-white dark:bg-rose-800"
            >
              <Trash2 className="h-4 w-4" />
              注销账号
            </button>
          </div>
        </div>
      </div>

      {/* 提示 */}
      <div className={`flex items-start gap-3 rounded-xl border p-4 ${isDark ? 'border-amber-900/30 bg-amber-950/20' : 'border-amber-200/50 bg-amber-50/50'}`}>
        <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
        <div>
          <p className={`text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>安全提示</p>
          <p className={`mt-1 text-xs ${isDark ? 'text-amber-400/70' : 'text-amber-600/80'}`}>
            注销账号后，您的所有数据将被永久删除且无法恢复。请确保已备份重要信息。
          </p>
        </div>
      </div>
    </div>
  )
}
