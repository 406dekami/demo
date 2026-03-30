// AddSourceModal.tsx
import React from 'react';

// 定义组件的 Props 类型
interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// SVG 图标组件
const Icons = {
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Globe: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  ),
  Sparkles: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  ),
  Upload: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  Youtube: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000" stroke="none">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"></polygon>
    </svg>
  ),
  Link: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  ),
  Drive: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
    </svg>
  ),
  Clipboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  )
};

export const AddSourceModal: React.FC<AddSourceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-[#131519] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-800">
        
        {/* 顶部标题区域 */}
        <div className="relative px-8 pt-8 pb-6 text-center">
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 text-gray-500 hover:text-gray-300 transition-colors p-1"
            aria-label="Close modal"
          >
            <Icons.Close />
          </button>
          <h2 className="text-lg font-medium text-gray-300 mb-2">
            根据以下内容生成音频概览和视频概览
          </h2>
          <div className="text-2xl font-bold text-green-500">
            您的文档
          </div>
        </div>

        {/* 搜索输入区域 - 蓝色边框高亮 */}
        <div className="px-8 py-4">
          <div className="relative group">
            {/* 蓝色外框容器 */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl opacity-30 group-hover:opacity-50 transition duration-200 blur"></div>
            <div className="relative flex items-center bg-[#1a1d24] rounded-2xl border border-blue-500/50 p-1">
              
              {/* 搜索图标和输入框 */}
              <div className="flex-1 flex items-center px-4">
                <span className="text-blue-400 mr-3"><Icons.Search /></span>
                <input 
                  type="text" 
                  placeholder="在网络中搜索新来源"
                  className="w-full bg-transparent py-3 text-gray-200 placeholder-gray-500 focus:outline-none text-base"
                />
              </div>
              
              {/* 下拉菜单按钮和箭头 */}
              <div className="flex gap-2 items-center pr-1">
                <button className="flex items-center gap-1.5 px-3 py-2 bg-[#25272c] hover:bg-[#2f3239] rounded-xl text-xs text-gray-300 transition-colors border border-gray-700">
                  <Icons.Globe /> Web <Icons.ChevronDown />
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 bg-[#25272c] hover:bg-[#2f3239] rounded-xl text-xs text-gray-300 transition-colors border border-gray-700">
                  <Icons.Sparkles /> Fast Research <Icons.ChevronDown />
                </button>
                <button className="p-2 bg-[#25272c] hover:bg-[#2f3239] rounded-xl text-gray-400 transition-colors border border-gray-700 ml-1">
                  <Icons.ArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 拖拽上传区域 */}
        <div className="px-8 py-6">
          <div className="border-2 border-dashed border-gray-700 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:border-gray-500 hover:bg-[#1a1d24] transition-all cursor-pointer group bg-[#131519]">
            <h3 className="text-xl text-gray-300 mb-2 font-medium group-hover:text-white transition-colors">或拖放文件</h3>
            <p className="text-sm text-gray-500">PDF、图片、文档、音频，等等</p>
          </div>
        </div>

        {/* 底部功能按钮 */}
        <div className="px-8 pb-8 flex flex-wrap gap-3 justify-center">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#25272c] hover:bg-[#2f3239] border border-gray-700 rounded-full text-gray-300 text-sm font-medium transition-all hover:text-white">
            <Icons.Upload /> 上传文件
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#25272c] hover:bg-[#2f3239] border border-gray-700 rounded-full text-gray-300 text-sm font-medium transition-all hover:text-white">
            <Icons.Link /><Icons.Youtube /> 网站
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#25272c] hover:bg-[#2f3239] border border-gray-700 rounded-full text-gray-300 text-sm font-medium transition-all hover:text-white">
            <Icons.Drive /> 云端硬盘
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#25272c] hover:bg-[#2f3239] border border-gray-700 rounded-full text-gray-300 text-sm font-medium transition-all hover:text-white">
            <Icons.Clipboard /> 复制的文字
          </button>
        </div>

      </div>
    </div>
  );
};
