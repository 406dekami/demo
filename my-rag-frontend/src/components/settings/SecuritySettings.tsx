import { type FC, useState } from 'react'
import { Lock, Mail, Phone, Check, AlertCircle } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

type BindingStatus = 'bound' | 'unbound'

type BindingItem = {
  id: string
  label: string
  value: string
  icon: typeof Mail
  status: BindingStatus
}

export const SecuritySettings: FC = () => {
  const { isDark } = useTheme()
  const [bindings] = useState<BindingItem[]>([
    { id: 'email', label: '邮箱', value: '未绑定', icon: Mail, status: 'unbound' },
    { id: 'phone', label: '手机号', value: '未绑定', icon: Phone, status: 'unbound' },
  ])

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>账号安全</h2>
        <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>保护您的账号安全，管理密码和绑定信息</p>
      </div>

      {/* 密码管理 */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isDark ? 'bg-sky-500/10' : 'bg-sky-50'}`}>
              <Lock className={`h-6 w-6 ${isDark ? 'text-sky-400' : 'text-sky-500'}`} />
            </div>
            <div>
              <h3 className={`text-base font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>登录密码</h3>
              <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>定期修改密码可以提升账号安全性</p>
            </div>
          </div>
          <button
            type="button"
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              isDark
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            修改密码
          </button>
        </div>
      </div>

      {/* 绑定信息 */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
        <h3 className={`mb-4 text-base font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>绑定信息</h3>
        <div className="space-y-4">
          {bindings.map((item) => {
            const Icon = item.icon
            const isBound = item.status === 'bound'
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-xl border p-4 ${
                  isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                    <Icon className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.label}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {isBound ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.value}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className={`h-3.5 w-3.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                          <span className={`text-xs ${isDark ? 'text-amber-400/80' : 'text-amber-600'}`}>未绑定</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    isBound
                      ? isDark
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                      : 'bg-sky-500 text-white hover:bg-sky-600'
                  }`}
                >
                  {isBound ? '更换' : '绑定'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
