// 公共 Tailwind CSS 类名常量，用于简化组件中的 className
// 设计风格：参考 OpenAI、Gemini 的扁平化设计

// 颜色主题
export const COLORS = {
  // 主色调 - 使用简洁的单色
  PRIMARY: 'bg-gray-900 hover:bg-gray-800',
  ACCENT: 'bg-black hover:bg-gray-900',
  TEXT_PRIMARY: 'text-gray-900',
  TEXT_SECONDARY: 'text-gray-600',
  TEXT_MUTED: 'text-gray-500',
  BORDER: 'border-gray-200',
  BG_PRIMARY: 'bg-white',
  BG_SECONDARY: 'bg-gray-50',
  BG_TERTIARY: 'bg-gray-100',
}

// 卡片相关样式
export const CARD_BASE = {
  // 新建卡片（简洁边框）
  CREATE: 'group relative flex flex-col items-center justify-center min-h-[240px] p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all duration-200 ease-out',
  
  // 普通卡片（简洁边框）
  NORMAL: 'group bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-300 transition-all duration-200 ease-out cursor-pointer flex flex-col min-h-[240px] text-left',
}

// 图标容器样式
export const ICON_CONTAINER = {
  // 简洁图标容器
  BASE: 'w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-700 group-hover:bg-gray-200 group-hover:scale-105 transition-all duration-200 dark:bg-gray-700 dark:text-gray-300 dark:group-hover:bg-gray-600',
  
  // Logo 容器
  LOGO: 'w-9 h-9 bg-black rounded-lg flex items-center justify-center text-white font-bold dark:bg-gray-700',
}

// 文字样式
export const TEXT_STYLES = {
  // 标题文字
  TITLE_PRIMARY: 'font-medium text-gray-900 mt-4 text-base group-hover:text-gray-700 transition-colors dark:text-gray-100 dark:group-hover:text-gray-300',
  TITLE_SECONDARY: 'font-medium text-gray-900 text-base group-hover:text-gray-700 transition-colors dark:text-gray-100 dark:group-hover:text-gray-300',
  
  // 描述文字
  DESCRIPTION: 'text-sm text-gray-500 mt-2 group-hover:text-gray-600 transition-colors dark:text-gray-400 dark:group-hover:text-gray-300',
  DESCRIPTION_SMALL: 'text-xs text-gray-500 mt-1.5 dark:text-gray-400',
  
  // 标签页按钮
  TAB_BUTTON: 'font-medium text-base transition-colors',
  TAB_ACTIVE: 'text-gray-900 dark:text-gray-100',
  TAB_INACTIVE: 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
}

// 布局容器
export const LAYOUT = {
  // 页面容器 - 简洁白色背景
  PAGE: 'min-h-screen bg-white font-sans dark:bg-gray-900',
  
  // Header - 简洁顶部导航
  HEADER: 'sticky top-0 z-20 h-16 border-b border-gray-200 bg-white/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between dark:border-gray-800 dark:bg-gray-900/80',
  
  // Main 内容区
  MAIN: 'p-6 sm:p-8',
  
  // 最大宽度容器
  CONTAINER: 'max-w-7xl mx-auto',
  
  // 网格布局
  GRID: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6',
}

// 按钮样式
export const BUTTON = {
  // 图标按钮
  ICON: 'p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800',
  
  // 主要按钮 - 黑色背景
  PRIMARY: 'px-6 py-3 bg-black hover:bg-gray-900 text-white font-medium text-sm rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900/20',
  
  // 次要按钮
  SECONDARY: 'px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm rounded-lg transition-all duration-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
}

// 装饰元素
export const DECORATION = {
  // 角落装饰点 - 更简洁
  CORNER_DOT: 'absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-gray-900 transition-colors duration-200 dark:bg-gray-600 dark:group-hover:bg-gray-400',
}

// 下拉菜单
export const DROPDOWN = {
  OVERLAY: 'fixed inset-0 z-30 bg-black/10 dark:bg-black/30',
  MENU: 'absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-40 overflow-hidden py-1 dark:bg-gray-800 dark:border-gray-700',
  ITEM: 'w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 flex items-center gap-3 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100',
}

// 滚动条隐藏
export const SCROLLBAR_HIDE = `
  scrollbar-hide
  [&::-webkit-scrollbar]:hidden
  [-ms-overflow-style:none]
  [scrollbar-width:none]
`.trim()

// 暗夜模式样式 - 使用条件类名而不是 dark:前缀
export const DARK_MODE = {
  // 页面背景
  PAGE: 'bg-white dark:bg-gray-900',
  
  // Header
  HEADER: 'border-gray-200 bg-white/80 dark:border-gray-800 dark:bg-gray-900/80',
  
  // 卡片
  CARD_BG: 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700',
  
  // 文字颜色
  TEXT_PRIMARY: 'text-gray-900 dark:text-gray-100',
  TEXT_SECONDARY: 'text-gray-600 dark:text-gray-300',
  TEXT_MUTED: 'text-gray-500 dark:text-gray-400',
  
  // 边框
  BORDER: 'border-gray-200 dark:border-gray-700',
  
  // 按钮
  BUTTON_ICON: 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800',
  
  // 输入框
  INPUT: 'bg-white border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100',
  
  // 卡片基础样式（包含暗黑模式）
  CARD_CREATE: 'group relative flex flex-col items-center justify-center min-h-[240px] p-6 bg-white border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all duration-200 ease-out dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-500',
  
  CARD_NORMAL: 'group bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-300 transition-all duration-200 ease-out cursor-pointer flex flex-col min-h-[240px] text-left dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600',
  
  // 图标容器
  ICON_BASE: 'w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-700 group-hover:bg-gray-200 group-hover:scale-105 transition-all duration-200 dark:bg-gray-700 dark:text-gray-300 dark:group-hover:bg-gray-600',
  
  ICON_LOGO: 'w-9 h-9 bg-black rounded-lg flex items-center justify-center text-white font-bold dark:bg-gray-700',
  
  // 下拉菜单
  DROPDOWN_MENU: 'absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-40 overflow-hidden py-1 dark:bg-gray-800 dark:border-gray-700',
  DROPDOWN_ITEM: 'w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 flex items-center gap-3 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100',
}
