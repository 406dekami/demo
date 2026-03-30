// my-rag-frontend/src/components/knowledge/UploadProgress.tsx
import { FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'
import type { UploadFile } from '@/types'

interface UploadProgressProps {
  file: UploadFile
  onRemove?: () => void
}

export default function UploadProgress({ file, onRemove }: UploadProgressProps) {
  const getStatusConfig = () => {
    switch (file.status) {
      case 'uploading':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin text-sky-400" />,
          text: '上传中...',
          color: 'text-sky-400',
        }
      case 'processing':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin text-amber-400" />,
          text: '处理中...',
          color: 'text-amber-400',
        }
      case 'done':
        return {
          icon: <CheckCircle className="h-4 w-4 text-emerald-400" />,
          text: file.message || '处理完成',
          color: 'text-emerald-400',
        }
      case 'failed':
        return {
          icon: <AlertCircle className="h-4 w-4 text-rose-400" />,
          text: file.message || '处理失败',
          color: 'text-rose-400',
        }
      default:
        return {
          icon: <FileText className="h-4 w-4 text-slate-400" />,
          text: '等待处理',
          color: 'text-slate-400',
        }
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/55 p-4">
      <FileText className="h-5 w-5 shrink-0 text-slate-400" />

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-3">
          <p className="truncate text-sm font-medium text-white">{file.file.name}</p>
          {onRemove && (file.status === 'failed' || file.status === 'done') && (
            <button
              onClick={onRemove}
              className="text-slate-500 transition-colors hover:text-rose-400"
              aria-label="移除文件"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {(file.status === 'uploading' || file.status === 'processing') && (
          <div className="mb-2 h-1.5 w-full rounded-full bg-slate-800">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${file.status === 'uploading' ? 'bg-sky-500' : 'bg-amber-500'}`}
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {statusConfig.icon}
          <span className={`text-xs ${statusConfig.color}`}>{statusConfig.text}</span>
          {(file.status === 'uploading' || file.status === 'processing') && (
            <span className="text-xs text-slate-500">{file.progress}%</span>
          )}
        </div>
      </div>
    </div>
  )
}
