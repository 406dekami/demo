import {type FC} from 'react'
import {Maximize2, MessageSquareMore, ZoomIn, ZoomOut} from 'lucide-react'
import type {MindMapNode} from '@/api/mindMap'
import type {Edge} from './mindMapLayout'
import {useTheme} from '@/hooks/useTheme'

type FocusCardProps = {
  title: string
  subtitle: string
  onOpenChat: () => void
}

type ZoomControlsProps = {
  scale: number
  onZoomOut: () => void
  onZoomIn: () => void
}

type PathBreadcrumbProps = {
  pathText: string
}

type TooltipCardProps = {
  tooltip: { x: number; y: number; node: MindMapNode }
}

type EdgeLayerProps = {
  edges: Edge[]
  width: number
  height: number
}

export const EdgeLayer: FC<EdgeLayerProps> = ({ edges, width, height }) => (
  <svg className="absolute inset-0 overflow-visible" width={width} height={height}>
    {edges.map((edge) => (
      <path
        key={edge.id}
        d={edge.path}
        fill="none"
        stroke={edge.active ? 'rgba(125,211,252,.95)' : 'rgba(108,127,164,.38)'}
        strokeWidth={edge.active ? 2.8 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ))}
  </svg>
)

export const FocusCard: FC<FocusCardProps> = ({ title, subtitle, onOpenChat }) => {
  const { isDark } = useTheme()
  return (
    <div className="absolute right-4 top-4 z-10">
      <button
        type="button"
        onClick={onOpenChat}
        className={`group cursor-pointer w-50 rounded-[26px] border px-4 py-3 text-right shadow-xl backdrop-blur-sm transition ${isDark ? 'border-slate-700/80 bg-slate-900/92 hover:border-sky-400/40 hover:bg-slate-900' : 'border-blue-200/60 bg-white/90 hover:border-blue-400 hover:bg-white'}`}>
        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>当前焦点</p>
        <div className={`mt-1 flex items-center justify-end gap-2 text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          <span className="truncate">{title}</span>
          <MessageSquareMore className={`h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 ${isDark ? 'text-sky-300' : 'text-sky-500'}`} />
        </div>
        <p className={`mt-1 truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>点击打开 Chat Panel · {subtitle}</p>
      </button>
    </div>
  )
}

export const ZoomControls: FC<ZoomControlsProps> = ({ scale, onZoomOut, onZoomIn }) => {
  const { isDark } = useTheme()

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }
  return (
    <div className={`fixed bottom-4 right-4 z-20 flex items-center gap-2 rounded-2xl border p-2 shadow-xl backdrop-blur-sm ${isDark ? 'border-slate-700/80 bg-slate-900/92' : 'border-blue-200/60 bg-white/90'}`}>
      <button type="button" onClick={onZoomOut} className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-sky-300' : 'text-slate-500 hover:bg-slate-100 hover:text-sky-500'}`} aria-label="缩小"><ZoomOut className="h-4 w-4" /></button>
      <span className={`min-w-14 text-center text-xs font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{Math.round(scale * 100)}%</span>
      <button type="button" onClick={onZoomIn} className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-sky-300' : 'text-slate-500 hover:bg-slate-100 hover:text-sky-500'}`} aria-label="放大"><ZoomIn className="h-4 w-4" /></button>
      <button type="button" onClick={handleFullscreen} className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-sky-300' : 'text-slate-500 hover:bg-slate-100 hover:text-sky-500'}`} aria-label="全屏" title="进入全屏 (F11)">
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export const PathBreadcrumb: FC<PathBreadcrumbProps> = ({ pathText }) => {
  const { isDark } = useTheme()
  console.log('PathBreadcrumb 渲染:', { pathText })
  return (
    <div className={`fixed left-4 bottom-5 z-100 max-w-100 rounded-3xl border px-4 py-3 shadow-xl backdrop-blur-md ${isDark ? 'border-slate-700 bg-slate-900/90' : 'border-sky-300 bg-white/95'}`}>
      <p className={`text-[11px] uppercase tracking-[.26em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>当前路径</p>
      <p className={`mt-1 text-sm leading-6 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{pathText}</p>
    </div>
  )
}

export const TooltipCard: FC<TooltipCardProps> = ({ tooltip }) => {
  const { isDark } = useTheme()
  return (
    <div
      className={`pointer-events-none absolute z-20 max-w-[320px] rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md ${isDark ? 'border-sky-300/15 bg-slate-950/95' : 'border-sky-300/30 bg-white/95'}`}>
      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tooltip.node.title}</p>
      <p className={`mt-1 text-xs uppercase tracking-[.18em] ${isDark ? 'text-sky-300/80' : 'text-sky-500'}`}>{tooltip.node.node_type || '知识节点'}</p>
      <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{tooltip.node.description || '暂无补充描述'}</p>
    </div>
  )
}
