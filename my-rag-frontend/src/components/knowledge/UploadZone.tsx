// my-rag-frontend/src/components/knowledge/UploadZone.tsx
import { useState, useCallback, useRef } from 'react'
import { Upload } from 'lucide-react'
import UploadProgress from './UploadProgress'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import type { UploadFile as UploadFileType } from '@/types'

interface UploadZoneProps {
  kbId: string
  disabled?: boolean
}

export default function UploadZone({ kbId, disabled = false }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const {
    uploadingFiles,
    addUploadingFile,
    updateUploadingFile,
    removeUploadingFile
  } = useKnowledgeStore()

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return
    
    // 创建上传任务
    const files: UploadFileType[] = Array.from(fileList).map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'uploading',
      progress: 0
    }))

    // 添加到上传列表
    files.forEach(f => addUploadingFile(f))

    // 执行上传
    for (const uploadFile of files) {
      try {
        // 更新状态：上传中
        updateUploadingFile(uploadFile.id, { status: 'uploading', progress: 10 })

        const formData = new FormData()
        formData.append('files', uploadFile.file)

        // 第一步：上传文件
        const uploadResponse = await fetch(`/api/v1/knowledge/${kbId}/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })

        if (!uploadResponse.ok) {
          throw new Error('上传失败')
        }

        const uploadResult = await uploadResponse.json()
        
        // 获取 document_id（从 files 数组中获取第一个文件的 file_id）
        const documentId = uploadResult.data?.files?.[0]?.file_id
        if (!documentId) {
          throw new Error('未获取到文档 ID')
        }

        // 更新状态：处理中
        updateUploadingFile(uploadFile.id, { status: 'processing', progress: 50 })

        // 第二步：处理文件
        const processResponse = await fetch('/api/v1/rag/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            document_id: documentId,
            chunk_size: 512,
            chunk_overlap: 50
          })
        })

        if (!processResponse.ok) {
          // 尝试获取后端返回的错误信息
          const errorData = await processResponse.json().catch(() => ({}))
          throw new Error(errorData.message || errorData.detail || '处理失败')
        }

        const processResult = await processResponse.json()
        
        // 检查后端返回的业务状态码
        if (processResult.code !== 0) {
          throw new Error(processResult.message || '处理失败')
        }

        // 更新状态：完成
        updateUploadingFile(uploadFile.id, {
          status: 'done',
          progress: 100,
          message: '处理完成'
        })

      } catch (error) {
        console.error('上传处理失败:', error)
        updateUploadingFile(uploadFile.id, {
          status: 'failed',
          message: error instanceof Error ? error.message : '处理失败'
        })
      }
    }
  }, [kbId, addUploadingFile, updateUploadingFile])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFailed = (fileId: string) => {
    removeUploadingFile(fileId)
  }

  return (
    <div className="space-y-4">
      {/* 拖拽上传区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : disabled
            ? 'border-gray-700 bg-gray-800/30 cursor-not-allowed opacity-50'
            : 'border-gray-700 bg-gray-800/30'
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-300 font-medium mb-2">
          {disabled ? '编辑模式下才能上传' : '拖拽文件到此处，或点击选择文件'}
        </p>
        <p className="text-gray-500 text-sm mb-4">
          支持 PDF、Word、Markdown、TXT 等格式
        </p>
        {!disabled && (
          <label 
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            选择文件
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.md,.txt"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={disabled}
            />
          </label>
        )}
      </div>

      {/* 上传进度列表 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-400">上传进度</h4>
          {uploadingFiles.map(file => (
            <UploadProgress
              key={file.id}
              file={file}
              onRemove={() => handleRemoveFailed(file.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
