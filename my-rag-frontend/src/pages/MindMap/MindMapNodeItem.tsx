import type { FC, MouseEvent as ReactMouseEvent } from 'react'
import { Check } from 'lucide-react'
import type { MindMapNode } from '@/api/mindMap'
import { BOX, NODE_H, colorOf, fontSizeOf, type LayoutNode } from './mindMapLayout'

type MindMapNodeItemProps = {
  item: LayoutNode
  isDark: boolean
  onDone: (id: string) => void
  onSelect: (id: string) => void
  onCollapse: (id: string) => void
  onTip: (event: ReactMouseEvent<HTMLElement>, node: MindMapNode) => void
  onLeave: () => void
}

export const MindMapNodeItem: FC<MindMapNodeItemProps> = ({
  item,
  isDark,
  onDone,
  onSelect,
  onCollapse,
  onTip,
  onLeave,
}) => {
  const color = colorOf(item.node.level)
  const titleClass = item.active
    ? isDark ? 'border-white bg-sky-500/12 text-white shadow-[0_0_24px_rgba(96,165,250,.25)]' : 'border-sky-400 bg-sky-500/15 text-sky-900 shadow-[0_0_24px_rgba(59,130,246,.2)]'
    : item.inPath
      ? isDark ? 'border-sky-400/40 bg-sky-500/8 text-sky-50' : 'border-sky-400/30 bg-sky-500/5 text-sky-800'
      : isDark ? 'border-slate-700/70 bg-slate-950/72 text-slate-200' : 'border-slate-300/60 bg-white/80 text-slate-800'

  // 已完成节点的视觉反馈：删除线 + 变暗
  const doneOverlay = item.done ? 'opacity-50' : ''
  const doneTextClass = item.done ? 'line-through decoration-slate-600 decoration-2' : ''

  return (
    <div
      className="absolute"
      style={{ left: item.x, top: item.y - NODE_H / 2, width: item.width, height: NODE_H }}
    >
      <div
        className={`flex items-center transition-opacity ${doneOverlay}`}
        onMouseEnter={(event) => onTip(event, item.node)}
        onMouseMove={(event) => onTip(event, item.node)}
        onMouseLeave={onLeave}
        onDoubleClick={() => onCollapse(item.node.id)}
      >
        <button
          type="button"
          data-node="1"
          onClick={(event) => {
            event.stopPropagation()
            onDone(item.node.id)
          }}
          onDoubleClick={(event) => event.stopPropagation()}
          className="flex shrink-0 items-center justify-center rounded-md border transition"
          style={{
            width: BOX,
            height: BOX,
            background: item.done ? '#2563eb' : isDark ? 'rgba(15,23,42,.9)' : 'rgba(255,255,255,.9)',
            borderColor: item.done
              ? '#7dd3fc'
              : item.active
                ? isDark ? '#fff' : '#0ea5e9'
                : item.inPath
                  ? color
                  : isDark ? 'rgba(148,163,184,.4)' : 'rgba(100,116,139,.4)',
            boxShadow: item.active
              ? `0 0 18px ${color}55`
              : item.done
                ? '0 0 16px rgba(96,165,250,.32)'
                : 'none',
          }}
          aria-label={item.done ? '取消学习完成标记' : '标记为学习完成'}
        >
          {item.done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
        </button>

        <button
          type="button"
          data-node="1"
          onClick={(event) => {
            event.stopPropagation()
            onSelect(item.node.id)
          }}
          className={`ml-3.5 flex h-9.5 items-center rounded-2xl border px-4 text-left transition ${titleClass} ${doneTextClass}`}
          style={{
            width: item.titleWidth,
            fontSize: fontSizeOf(item.depth),
            fontWeight: item.active ? 700 : item.inPath ? 600 : 500,
          }}
          title={item.node.title}
        >
          <span className="whitespace-nowrap">{item.node.title}</span>
        </button>
      </div>
    </div>
  )
}
