import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/auth'

interface AuthPageProps {
  onLoginSuccess?: (userInfo: any) => void
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: ''
  })

  // 页面加载时检查是否有记住的登录信息
  useEffect(() => {
    const remembered = localStorage.getItem('remembered_phone')
    if (remembered) {
      setFormData(prev => ({ ...prev, phone: remembered }))
      setRememberMe(true)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log(' 提交登录/注册表单', { isLogin, formData })

    try {
      const endpoint = isLogin ? '/login' : '/register'
      
      // 验证
      if (!isLogin && formData.password !== formData.confirmPassword) {
        setError('两次输入的密码不一致')
        setLoading(false)
        return
      }

      const payload = isLogin 
        ? { phone: formData.phone, password: formData.password, remember_me: rememberMe }
        : { 
            phone: formData.phone, 
            password: formData.password,
            confirm_password: formData.confirmPassword
          }

      console.log('🔵 发送请求:', {
        url: `${API_BASE_URL}${endpoint}`,
        payload
      })

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload)
      
      console.log('🔵 响应结果:', response.data)
      
      if (isLogin) {
        // 登录成功
        localStorage.setItem('auth_token', response.data.token)
        localStorage.setItem('user_info', JSON.stringify(response.data))
        
        // 处理记住我功能
        if (rememberMe) {
          localStorage.setItem('remembered_phone', formData.phone)
        } else {
          localStorage.removeItem('remembered_phone')
        }

        if (onLoginSuccess) {
          onLoginSuccess(response.data)
        } else {
          alert('登录成功！')
          window.location.reload()
        }
      } else {
        // 注册成功
        alert('注册成功！请登录')
        setIsLogin(true)  // 切换到登录模式
        // 清空表单
        setFormData({
          phone: '',
          password: '',
          confirmPassword: ''
        })
      }

    } catch (err: any) {
      console.error('❌ 错误:', err)
      setError(err.response?.data?.detail || '操作失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* 背景效果 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      {/* 登录框 */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/30 mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            数字逻辑学习助手
          </h1>
        </div>

        {/* 表单卡片 */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-xl">
          {/* 切换标签 */}
          <div className="flex mb-6 bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              注册
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 手机号 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                手机号
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="请输入手机号"
                maxLength={11}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 transition-all"
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                密码
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="请输入密码"
                minLength={6}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 transition-all"
              />
            </div>

            {/* 确认密码（仅注册） */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  确认密码
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="请再次输入密码"
                  minLength={6}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 transition-all"
                />
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* 记住我（仅登录模式） */}
            {isLogin && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 bg-gray-800 border-gray-700 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-400">
                  记住我
                </label>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? '处理中...' : isLogin ? '登录' : '注册'}
            </button>
          </form>

          {/* 协议说明 */}
          <p className="mt-6 text-xs text-gray-500 text-center">
            {isLogin ? '还没有账号？' : '已有账号？'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-400 hover:text-blue-300 ml-1 font-medium"
            >
              {isLogin ? '立即注册' : '返回登录'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
