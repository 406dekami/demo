import {useRef, useState} from 'react'
import {Image, Palette, X} from 'lucide-react'
import {useTheme} from '@/hooks/useTheme'

interface CoverSelectorProps {
  value?: { type: 'image' | 'color'; value: string }
  onChange: (cover: { type: 'image' | 'color'; value: string } | undefined) => void
}

const PRESET_COLORS = [
  '#fef3c7', '#bfdbfe', '#fecaca', '#e0f2fe', '#fde68a', '#a7f3d0', '#ddd6fe',
  '#f9a8d4', '#c4b5fd', '#6ee7b7', '#93c5fd', '#fca5a5', '#fcd34d',
]

export default function CoverSelector({ value, onChange }: CoverSelectorProps) {
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState<'color' | 'image'>(value?.type || 'color')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleColorSelect = (color: string) => {
    onChange({ type: 'color', value: color })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      onChange({ type: 'image', value: result })
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClear = () => {
    onChange(undefined)
  }

  return (
    <div className="space-y-3">
      <div className={`flex gap-1 rounded-lg p-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
        <button
          type="button"
          onClick={() => setActiveTab('color')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
            activeTab === 'color'
              ? (isDark ? 'bg-slate-700 text-white shadow' : 'bg-white text-slate-900 shadow')
              : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
          }`}
        >
          <Palette className="h-4 w-4" />
          纯色
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('image')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
            activeTab === 'image'
              ? (isDark ? 'bg-slate-700 text-white shadow' : 'bg-white text-slate-900 shadow')
              : (isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
          }`}
        >
          <Image className="h-4 w-4" />
          图片
        </button>
      </div>

      {activeTab === 'color' && (
        <div className="grid grid-cols-7 gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleColorSelect(color)}
              className={`h-10 w-full rounded-lg transition hover:scale-110 ${
                value?.value === color ? 'ring-2 ring-offset-2 ring-sky-400' : ''
              }`}
              style={{ backgroundColor: color }}
              aria-label={`选择颜色 ${color}`}
            />
          ))}
        </div>
      )}

      {activeTab === 'image' && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full rounded-lg border border-dashed p-6 text-center transition ${
              isDark
                ? 'border-slate-700 hover:border-sky-400/50 hover:bg-slate-800/50'
                : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50'
            }`}
          >
            <Image className={`mx-auto mb-2 h-8 w-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>点击上传图片</p>
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>支持 JPG、PNG 格式</p>
          </button>
        </div>
      )}

      {value && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {value.type === 'color' ? (
              <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: value.value }} />
            ) : (
              <img src={value.value} alt="封面预览" className="h-8 w-8 rounded-lg object-cover" />
            )}
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              当前封面
            </span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className={`rounded-lg p-1.5 transition ${isDark ? 'text-slate-500 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'}`}
            aria-label="清除封面"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
