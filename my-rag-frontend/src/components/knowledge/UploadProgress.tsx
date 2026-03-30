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
          icon: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
          text: '上传中...',
          color: 'text-blue-400'
        }
      case 'processing':
        return {
          icon: <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />,
          text: '处理中...',
          color: 'text-yellow-400'
        }
      case 'done':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-400" />,
          text: file.message || '处理完成',
          color: 'text-green-400'
        }
      case 'failed':
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-400" />,
          text: file.message || '处理失败',
          color: 'text-red-400'
        }
      default:
        return {
          icon: <FileText className="w-4 h-4 text-gray-400" />,
          text: '等待处理',
          color: 'text-gray-400'
        }
    }
  }

  const statusConfig = getStatusConfig()

  return (
    <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-lg p-3">
      <FileText className="w-5 h-5 text-gray-400 shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-white text-sm font-medium truncate">{file.file.name}</p>
          {onRemove && (file.status === 'failed' || file.status === 'done') && (
            <button
              onClick={onRemove}
              className="text-gray-400 hover:text-red-400 transition-colors"
              aria-label="移除文件"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* 进度条 */}
        {(file.status === 'uploading' || file.status === 'processing') && (
          <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                file.status === 'uploading' ? 'bg-blue-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
        
        {/* 状态显示 */}
        <div className="flex items-center gap-2">
          {statusConfig.icon}
          <span className={`text-xs ${statusConfig.color}`}>
            {statusConfig.text}
          </span>
          {file.status === 'uploading' || file.status === 'processing' ? (
            <span className="text-xs text-gray-500">{file.progress}%</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
