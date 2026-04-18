// my-rag-frontend/src/components/knowledge/DocumentList.tsx
import {AlertCircle, CheckCircle, FileText, Loader2, Trash2} from 'lucide-react'
import type {Document} from '@/types'
import {useTheme} from '@/hooks/useTheme'

interface DocumentListProps {
  documents: Document[]
  isEditMode: boolean
  onDelete: (docId: string) => void
}

export default function DocumentList({
  documents,
  isEditMode,
  onDelete,
}: DocumentListProps) {
  const { isDark } = useTheme()
  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
      case 'done':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-rose-400" />
      default:
        return <FileText className="h-4 w-4 text-slate-400" />
    }
  }

  const getStatusText = (status: Document['status']) => {
    switch (status) {
      case 'uploading':
        return '上传中'
      case 'processing':
        return '处理中'
      case 'done':
        return '已完成'
      case 'failed':
        return '失败'
      default:
        return '未知'
    }
  }

  if (documents.length === 0) {
    return (
      <div className="py-14 text-center">
        <FileText className={`mx-auto mb-4 h-16 w-16 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
        <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>暂无文档，点击上方上传文件</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>已上传文档</h3>
        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>共 {documents.length} 个</span>
      </div>

      {documents.map(doc => (
        <div
          key={doc.id}
          className={`flex items-center justify-between rounded-2xl border p-4 transition-all ${isDark ? 'border-slate-800/80 bg-slate-950/55 hover:border-sky-400/20' : 'border-slate-200 bg-white hover:border-sky-400/30'}`}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="relative">
                <FileText className={`h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <div className="absolute -bottom-1 -right-1">{getStatusIcon(doc.status)}</div>
              </div>

              <div className="min-w-0 flex-1">
                <p className={`truncate font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{doc.name}</p>
                <div className={`mt-1 flex flex-wrap items-center gap-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className="text-slate-700">·</span>
                  <span>{new Date(doc.uploadTime).toLocaleString('zh-CN')}</span>
                  <span className="text-slate-700">·</span>
                  <span className={doc.status === 'done' ? 'text-emerald-400' : doc.status === 'failed' ? 'text-rose-400' : 'text-amber-400'}>
                    {getStatusText(doc.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {isEditMode && (
            <button
              onClick={() => onDelete(doc.id)}
              className={`ml-4 rounded-lg p-2 transition-colors ${isDark ? 'text-slate-500 hover:bg-rose-500/10 hover:text-rose-400' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-500'}`}
              aria-label="删除文档"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
