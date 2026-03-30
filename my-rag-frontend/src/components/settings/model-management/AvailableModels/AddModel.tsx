// AddModel.tsx
import { useState, useEffect } from 'react';
import { X, ExternalLink, HelpCircle, RefreshCw } from 'lucide-react';
import { useModelVerify } from '@/hooks/use-model-verify';
import type { VerifyModelParams } from '@/hooks/use-model-verify';

interface AddModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  factoryName: string;
  factoryLogo?: string;
  onSave: (apiKey: string, baseUrl: string) => void;
}

export const AddModel: React.FC<AddModelModalProps> = ({
  isOpen,
  onClose,
  factoryName,
  factoryLogo,
  onSave
}) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  // 使用模型验证 Hook
  const { verifying, error, verifyModel, clearError } = useModelVerify();

  // 定义支持自定义 Base URL 的厂商列表
  const supportCustomUrl = [
    'OpenAI',
    'Anthropic',
    'Azure-OpenAI',
    'Ollama',
    'Bedrock',
    'VolcEngine',
    'Qwen'
  ];

  // 根据厂商设置默认 Base URL
  useEffect(() => {
    if (isOpen) {
      // 重置表单
      setApiKey('');

      // 仅对支持的厂商设置默认 Base URL
      if (supportCustomUrl.includes(factoryName)) {
        const defaultUrls: Record<string, string> = {
          'OpenAI': 'https://api.openai.com/v1',
          'Anthropic': 'https://api.anthropic.com/v1',
          'Azure-OpenAI': 'https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT',
          'Ollama': 'http://localhost:11434/v1',
          'Bedrock': 'https://bedrock-runtime.YOUR_REGION.amazonaws.com',
          'VolcEngine': 'https://ark.cn-beijing.volces.com/api/v3',
          'Qwen': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        };
        setBaseUrl(defaultUrls[factoryName] || '');
      } else {
        setBaseUrl('');
      }
    }
  }, [isOpen, factoryName]);

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!apiKey.trim()) {
      alert('请输入 API Key');
      return;
    }
  
    clearError();
      
    // 构造验证参数
    const verifyParams: VerifyModelParams = {
      tenant_id: "demo_user",
      llm_factory: factoryName,
      api_key: apiKey,
      base_url: baseUrl || undefined
    };
  
    const result = await verifyModel(verifyParams);
      
    if (result.success) {
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      alert('请输入 API Key');
      return;
    }
    onSave(apiKey, baseUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl dark:bg-[#131519] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden dark:border-gray-800 border-gray-200">

        {/* 顶部标题区域 */}
        <div className="relative px-8 pt-8 pb-6">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 dark:text-gray-500 dark:hover:text-gray-300 text-gray-600 hover:text-gray-800 transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            {factoryLogo ? (
              <img src={factoryLogo} alt={factoryName} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <span className="text-3xl">🔹</span>
            )}
            <div>
              <h2 className="text-xl font-medium dark:text-white text-gray-900 flex items-center gap-2">
                {factoryName}
                <ExternalLink className="w-4 h-4 dark:text-gray-500 text-gray-600" />
              </h2>
            </div>
          </div>
        </div>

        {/* 表单区域 */}
        <div className="px-8 pb-8 flex-1">

          {/* API Key 输入框 */}
          <div className="mb-6">
            <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
              <span className="text-red-500 mr-1">*</span>API-Key
            </label>
            <input
              type="text"
              name="api-key-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="请输入 API Key"
              className="w-full dark:bg-[#1a1d24] bg-gray-50 dark:border-gray-700 border-gray-300 rounded-xl px-4 py-3 dark:text-gray-200 text-gray-900 dark:placeholder-gray-500 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              autoComplete="off"
              style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
            />
            {error && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          {/* Base URL 输入框 - 仅对支持的厂商显示 */}
          {supportCustomUrl.includes(factoryName) && (
            <div className="mb-6">
              <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-2 flex items-center gap-1">
                Base-Url
                <HelpCircle
                  className="w-3.5 h-3.5 dark:text-gray-500 text-gray-400 cursor-help"
                  aria-label="可选，默认使用官方 API"
                />
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full dark:bg-[#1a1d24] bg-gray-50 dark:border-gray-700 border-gray-300 rounded-xl px-4 py-3 dark:text-gray-400 text-gray-900 dark:placeholder-gray-600 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
          )}

        </div>

        {/* 底部按钮区域 */}
        <div className="px-8 pb-8 flex items-center justify-between gap-4">
          {/* 验证按钮 */}
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

          {/* 取消和保存按钮 */}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-6 py-2.5 dark:bg-[#25272c] bg-gray-100 dark:hover:bg-[#2f3239] hover:bg-gray-200 dark:border-gray-700 border-gray-300
                         rounded-xl dark:text-gray-300 text-gray-700 text-sm font-medium transition-all"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-white hover:bg-gray-100 text-gray-900
                         rounded-xl text-sm font-medium transition-all shadow-lg shadow-white/20"
            >
              保存
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};