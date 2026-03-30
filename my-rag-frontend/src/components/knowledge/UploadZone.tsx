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
    removeUploadingFile,
  } = useKnowledgeStore()

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return

    const files: UploadFileType[] = Array.from(fileList).map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'uploading',
      progress: 0,
    }))

    files.forEach(f => addUploadingFile(f))

    for (const uploadFile of files) {
      try {
        updateUploadingFile(uploadFile.id, { status: 'uploading', progress: 10 })

        const formData = new FormData()
        formData.append('files', uploadFile.file)

        const uploadResponse = await fetch(`/api/v1/knowledge/${kbId}/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })

        if (!uploadResponse.ok) {
          throw new Error('上传失败')
        }

        const uploadResult = await uploadResponse.json()
        const documentId = uploadResult.data?.files?.[0]?.file_id
        if (!documentId) {
          throw new Error('未获取到文档 ID')
        }

        updateUploadingFile(uploadFile.id, { status: 'processing', progress: 50 })

        const processResponse = await fetch('/api/v1/rag/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            document_id: documentId,
            chunk_size: 512,
            chunk_overlap: 50,
          }),
        })

        if (!processResponse.ok) {
          const errorData = await processResponse.json().catch(() => ({}))
          throw new Error(errorData.message || errorData.detail || '处理失败')
        }

        const processResult = await processResponse.json()
        if (processResult.code !== 0) {
          throw new Error(processResult.message || '处理失败')
        }

        updateUploadingFile(uploadFile.id, {
          status: 'done',
          progress: 100,
          message: '处理完成',
        })
      } catch (error) {
        console.error('上传处理失败:', error)
        updateUploadingFile(uploadFile.id, {
          status: 'failed',
          message: error instanceof Error ? error.message : '处理失败',
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
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-[24px] border border-dashed p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-sky-300/55 bg-sky-500/10 shadow-[0_0_40px_rgba(56,189,248,.12)]'
            : disabled
              ? 'cursor-not-allowed border-slate-800/80 bg-slate-950/45 opacity-50'
              : 'border-slate-700/80 bg-slate-950/45 hover:border-sky-400/35 hover:bg-slate-900/55'
        }`}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-sky-400/15 bg-sky-500/10 text-sky-300 shadow-[0_0_28px_rgba(56,189,248,.12)]">
          <Upload className="h-8 w-8" />
        </div>
        <p className="mb-2 font-medium text-slate-200">
          {disabled ? '编辑模式下才能上传' : '拖拽文件到此处，或点击选择文件'}
        </p>
        <p className="mb-4 text-sm text-slate-500">
          支持 PDF、Word、Markdown、TXT 等格式
        </p>
        {!disabled && (
          <label
            className="inline-block cursor-pointer rounded-xl border border-sky-400/20 bg-blue-600 px-6 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500"
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

      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-400">上传进度</h4>
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
