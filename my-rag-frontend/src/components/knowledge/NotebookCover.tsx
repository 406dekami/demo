// NotebookCover.tsx
import {type FC} from "react";
import type {Notebook} from '@/types.ts'

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
  // 如果有 coverImage，优先显示图片
  if (notebook.coverImage) {
    return (
      <div className="relative h-40 overflow-hidden rounded-t-2xl">
        <img
          src={notebook.coverImage}
          alt={notebook.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" aria-hidden="true" />
      </div>
    )
  }

  // 否则显示纯色背景 + 图案
  return (
    <div className="relative h-40 overflow-hidden rounded-t-2xl" style={{ backgroundColor: notebook.coverColor }}>
      <div
        className="absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-50"
        style={{ background: patternStyles[notebook.pattern] }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" aria-hidden="true" />
    </div>
  )
}
