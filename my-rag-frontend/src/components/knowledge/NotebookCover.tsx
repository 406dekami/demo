// NotebookCover.tsx
import { type FC } from "react";
import type { Notebook } from '../../types'

const formatDate = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')
}

// Pattern 样式映射（深色主题）
const patternStyles: Record<Notebook['pattern'], string> = {
  dots: 'bg-[radial-gradient(circle,_#ffffff20_1px,_transparent_1px)] bg-[length:12px_12px]',
  waves: 'bg-[repeating-linear-gradient(45deg,_#ffffff15_0,_#ffffff15_1px,_transparent_0,_transparent_50%)] bg-[length:20px_20px]',
  tiles: 'bg-[linear-gradient(90deg,_#ffffff15_1px,_transparent_1px),_linear-gradient(_#ffffff15_1px,_transparent_1px)] bg-[length:20px_20px]',
  hearts: 'bg-[radial-gradient(circle,_#ffffff20_2px,_transparent_2px)] bg-[length:16px_16px]',
  rain: 'bg-[repeating-linear-gradient(180deg,_#ffffff15_0,_#ffffff15_1px,_transparent_0,_transparent_8px)]',
  triangles: 'bg-[conic-gradient(at_0_0,_#ffffff15_0deg_60deg,_transparent_60deg_120deg,_#ffffff15_120deg_180deg,_transparent_180deg_240deg,_#ffffff15_240deg_300deg,_transparent_300deg_360deg)] bg-[length:24px_24px]',
  solid: '',
}

export const NotebookCover: FC<{ notebook: Notebook }> = ({ notebook }) => {
  return (
    <div className="relative h-40 overflow-hidden rounded-t-2xl" style={{ backgroundColor: notebook.coverColor }}>
      {/* Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-50"
        style={{ background: patternStyles[notebook.pattern] }}
        aria-hidden="true"
      />

      {/* Gradient Fade (深色主题加深) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" aria-hidden="true" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-gs font-medium text-white text-lg truncate drop-shadow-sm">
          {notebook.title}
        </h3>
        <p className="text-xs text-gray-200/90 mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" aria-hidden="true" />
          更新于 {formatDate(notebook.lastUpdated)}
        </p>
      </div>
    </div>
  )
}
