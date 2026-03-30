// my-rag-frontend/src/components/knowledge/DocumentList.tsx
import { FileText, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { Document } from '@/types'

interface DocumentListProps {
  documents: Document[]
  isEditMode: boolean
  onDelete: (docId: string) => void
  // onBatchDelete?: (docIds: string[]) => void  // 预留批量删除功能
}

export default function DocumentList({
  documents,
  isEditMode,
  onDelete
}: DocumentListProps) {
  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
      case 'done':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <FileText className="w-4 h-4 text-gray-400" />
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
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <p className="text-gray-400">暂无文档，点击上方上传文件</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">已上传文档</h3>
        <span className="text-sm text-gray-400">共 {documents.length} 个</span>
      </div>
      
      {documents.map(doc => (
        <div
          key={doc.id}
          className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <FileText className="w-5 h-5 text-gray-400" />
              <div className="absolute -bottom-1 -right-1">
                {getStatusIcon(doc.status)}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{doc.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {doc.chunkCount || 0} 个切片
                </span>
                <span className="text-gray-600">·</span>
                <span className="text-xs text-gray-500">
                  {new Date(doc.uploadTime).toLocaleString('zh-CN')}
                </span>
                <span className="text-gray-600">·</span>
                <span className={`text-xs ${
                  doc.status === 'done' ? 'text-green-400' :
                  doc.status === 'failed' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {getStatusText(doc.status)}
                </span>
              </div>
            </div>
          </div>
          
          {isEditMode && (
            <button
              onClick={() => onDelete(doc.id)}
              className="ml-4 p-2 text-gray-400 hover:text-red-400 transition-colors"
              aria-label="删除文档"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
