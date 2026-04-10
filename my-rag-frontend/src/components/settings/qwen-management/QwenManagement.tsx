/**
 * 千问模型管理页面
 * 用于配置和验证通义千问 API Key
 */
import {useState} from 'react'
import {CheckCircle, Key, RefreshCw, Settings, XCircle} from 'lucide-react'
import {useModelVerify} from '@/hooks/use-model-verify'

export const QwenManagement = () => {
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://dashscope.aliyuncs.com/compatible-mode/v1')
  const [verified, setVerified] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState('')
  
  const { verifying, error, verifyModel, clearError } = useModelVerify()

  const handleVerify = async () => {
    if (!apiKey.trim()) {
      alert('请输入 API Key')
      return
    }

    clearError()
    
    const verifyParams = {
      tenant_id: "demo_user",
      llm_factory: "Qwen",
      api_key: apiKey,
      base_url: baseUrl || undefined
    }

    const result = await verifyModel(verifyParams)
    
    setVerifyMessage(result.message)
    setVerified(result.success)
    
    if (result.success) {
      alert(result.message)
    } else {
      alert(result.message)
    }
  }

  const handleSave = () => {
    if (!apiKey.trim()) {
      alert('请输入 API Key')
      return
    }
    
    // TODO: 保存到后端
    alert('API Key 已保存')
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Key className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-medium dark:text-white text-gray-900">
              通义千问模型管理
            </h1>
            <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">
              配置 API Key 并验证千问模型
            </p>
          </div>
        </div>
      </div>

      {/* 配置卡片 */}
      <div className="dark:bg-[#131519] bg-white rounded-2xl shadow-lg dark:border-gray-800 border-gray-200 overflow-hidden">
        {/* 卡片标题 */}
        <div className="px-6 py-4 border-b dark:border-gray-800 border-gray-200">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 dark:text-gray-400 text-gray-600" />
            <h2 className="text-lg font-medium dark:text-white text-gray-900">
              API 配置
            </h2>
          </div>
        </div>

        {/* 表单区域 */}
        <div className="p-6 space-y-6">
          {/* API Key 输入框 */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
              <span className="text-red-500 mr-1">*</span>API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="请输入千问 API Key"
              className="w-full dark:bg-[#1a1d24] bg-gray-50 dark:border-gray-700 border-gray-300 rounded-xl px-4 py-3 dark:text-gray-200 text-gray-900 dark:placeholder-gray-500 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              autoComplete="off"
              style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
            />
            <p className="mt-2 text-xs dark:text-gray-500 text-gray-400">
              在 <a href="https://dashscope.console.aliyun.com/apiKey" target="_blank" rel="noopener noreferrer" 
                   className="text-blue-500 hover:underline">阿里云百炼控制台</a> 获取 API Key
            </p>
          </div>

          {/* Base URL 输入框 */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
              Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
              className="w-full dark:bg-[#1a1d24] bg-gray-50 dark:border-gray-700 border-gray-300 rounded-xl px-4 py-3 dark:text-gray-400 text-gray-900 dark:placeholder-gray-600 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
            <p className="mt-2 text-xs dark:text-gray-500 text-gray-400">
              千问官方 API 地址，如需使用自定义地址可修改此项
            </p>
          </div>

          {/* 验证结果提示 */}
          {verifyMessage && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${
              verified 
                ? 'dark:bg-green-900/20 bg-green-50 border dark:border-green-800 border-green-200' 
                : 'dark:bg-red-900/20 bg-red-50 border dark:border-red-800 border-red-200'
            }`}>
              {verified ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${
                verified 
                  ? 'dark:text-green-300 text-green-700' 
                  : 'dark:text-red-300 text-red-700'
              }`}>
                {verifyMessage}
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl dark:bg-red-900/20 bg-red-50 border dark:border-red-800 border-red-200">
              <p className="text-sm dark:text-red-300 text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t dark:border-gray-800 border-gray-200 flex items-center justify-between gap-4">
          <button
            onClick={handleVerify}
            disabled={verifying || !apiKey.trim()}
            className="flex items-center gap-2 px-5 py-2.5 dark:bg-[#25272c] bg-gray-100 dark:hover:bg-[#2f3239] hover:bg-gray-200
                       dark:border-gray-700 border-gray-300 rounded-xl dark:text-gray-300 text-gray-700 text-sm font-medium
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
            {verifying ? '验证中...' : '验证'}
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setApiKey('')
                setVerified(false)
                setVerifyMessage('')
              }}
              className="px-6 py-2.5 dark:bg-[#25272c] bg-gray-100 dark:hover:bg-[#2f3239] hover:bg-gray-200 dark:border-gray-700 border-gray-300
                         rounded-xl dark:text-gray-300 text-gray-700 text-sm font-medium transition-all"
            >
              重置
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 
                         text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/25"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="mt-6 p-6 dark:bg-[#131519] bg-white rounded-2xl dark:border-gray-800 border-gray-200">
        <h3 className="text-sm font-medium dark:text-white text-gray-900 mb-3">
          使用说明
        </h3>
        <ul className="space-y-2 text-sm dark:text-gray-400 text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>访问 <a href="https://dashscope.console.aliyun.com/" target="_blank" rel="noopener noreferrer" 
                         className="text-blue-500 hover:underline">阿里云百炼控制台</a> 注册账号</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>创建 API Key 并复制</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>将 API Key 粘贴到上方输入框并点击"验证"</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>验证成功后点击"保存配置"即可使用</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
