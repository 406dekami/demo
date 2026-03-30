import { useNavigate } from 'react-router-dom'
import { Laptop, ArrowRight, Zap, Lightbulb, Users } from 'lucide-react'

export const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* 光晕效果 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      {/* 主内容区域 */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <div className="p-4 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/30">
            <Laptop className="w-20 h-20 text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* 主标题 */}
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight drop-shadow-lg">
          你的数字逻辑学习好帮手
        </h1>

        {/* 副标题 */}
        <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light tracking-wide">
          智能 · 高效 · 便捷
        </p>

        <p className="text-base text-gray-400 mb-16 max-w-2xl mx-auto leading-relaxed">
          专为数字逻辑课程设计的学习辅助平台，帮助你轻松掌握复杂概念，提升学习效率
        </p>

        {/* CTA 按钮 */}
        <button
          onClick={() => navigate('/auth')}
          className="group relative px-12 py-5 bg-blue-600 hover:bg-blue-700
                     text-white font-semibold text-lg rounded-full shadow-lg shadow-blue-500/30
                     transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/50
                     focus:outline-none focus:ring-4 focus:ring-blue-500/50 active:scale-95"
        >
          <span className="flex items-center gap-3">
            立即登录体验
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </span>
        </button>

        {/* 特性展示 */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-400">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-medium text-gray-300 mb-2">快速响应</h3>
            <p className="text-sm">即时解答你的疑问</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-medium text-gray-300 mb-2">智能分析</h3>
            <p className="text-sm">深入理解知识点</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 mb-4 rounded-full bg-pink-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="font-medium text-gray-300 mb-2">个性化</h3>
            <p className="text-sm">定制专属学习方案</p>
          </div>
        </div>
      </div>

      {/* 底部版权 */}
      <footer className="absolute bottom-4 text-gray-500 text-sm z-10">
        <p>&copy; 2026 数字逻辑学习助手。All rights reserved.</p>
      </footer>
    </div>
  )
}
