// my-rag-frontend/src/components/knowledge/UploadZone.tsx
import {useCallback, useRef, useState} from 'react'
import {Upload} from 'lucide-react'
import UploadProgress from './UploadProgress'
import {useKnowledgeStore} from '@/stores/knowledgeStore'
import type {UploadFile as UploadFileType} from '@/types'
import {useTheme} from '@/hooks/useTheme'
import {getKnowledgeBaseDocuments, processDocument, uploadKnowledgeFiles} from '@/api/knowledge'

interface UploadZoneProps {
  kbId: string
  disabled?: boolean
}

export default function UploadZone({ kbId, disabled = false }: UploadZoneProps) {
  const { isDark } = useTheme()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadingFiles, addUploadingFile, updateUploadingFile, removeUploadingFile, setDocuments } = useKnowledgeStore()

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return

    const { documents } = useKnowledgeStore.getState()
    const existingFileNames = new Set(documents.map((doc) => doc.name))
    const newFiles: File[] = []
    const duplicateFiles: string[] = []

    Array.from(fileList).forEach((file) => {
      if (existingFileNames.has(file.name)) duplicateFiles.push(file.name)
      else newFiles.push(file)
    })

    if (duplicateFiles.length > 0) {
      alert(duplicateFiles.length === 1 ? `文件 "${duplicateFiles[0]}" 已上传过` : `${duplicateFiles.length} 个文件已上传过：\n${duplicateFiles.join('\n')}`)
    }
    if (newFiles.length === 0) return

    const files: UploadFileType[] = newFiles.map((file) => ({
      id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      file,
      status: 'uploading',
      progress: 0,
    }))

    files.forEach((f) => addUploadingFile(f))

    for (const uploadFile of files) {
      try {
        updateUploadingFile(uploadFile.id, { status: 'uploading', progress: 10 })
        const uploadResult = await uploadKnowledgeFiles(kbId, [uploadFile.file])
        const documentId = uploadResult.files?.[0]?.file_id
        if (!documentId) throw new Error('未获取到文档 ID')

        updateUploadingFile(uploadFile.id, { status: 'processing', progress: 50 })
        await processDocument(documentId, 512, 50)

        updateUploadingFile(uploadFile.id, { status: 'done', progress: 100, message: '处理完成' })

        const docs = await getKnowledgeBaseDocuments(kbId)
        setDocuments(docs.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          status: doc.parse_status === 'pending' ? 'processing' : doc.parse_status,
          chunkCount: doc.chunk_count,
          uploadTime: new Date(doc.create_time || Date.now()).toISOString(),
          fileSize: doc.file_size,
          message: doc.parse_msg,
        })))
      } catch (error) {
        console.error('上传处理失败:', error)
        updateUploadingFile(uploadFile.id, { status: 'failed', message: error instanceof Error ? error.message : '处理失败' })
      }
    }
  }, [kbId, addUploadingFile, updateUploadingFile, setDocuments])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(false)
      void handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handleFiles(e.target.files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`rounded-[24px] border border-dashed p-8 text-center transition-all duration-200 ${isDragging ? 'border-sky-300/55 bg-sky-500/10 shadow-[0_0_40px_rgba(56,189,248,.12)]' : disabled ? (isDark ? 'cursor-not-allowed border-slate-700 bg-slate-800/50 opacity-50' : 'cursor-not-allowed border-slate-300 bg-slate-100 opacity-50') : (isDark ? 'border-slate-700/80 bg-slate-900/50 hover:border-sky-400/35 hover:bg-slate-800/60' : 'border-slate-300 bg-slate-50 hover:border-sky-400/50 hover:bg-slate-100')}`}>
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border shadow-[0_0_28px_rgba(56,189,248,.12)] ${isDark ? 'border-sky-400/15 bg-sky-500/10 text-sky-300' : 'border-sky-400/30 bg-sky-50 text-sky-600'}`}><Upload className="h-8 w-8" /></div>
        <p className={`mb-2 font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{disabled ? '编辑模式下才能上传' : '拖拽文件到此处，或点击选择文件'}</p>
        <p className={`mb-4 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>支持 PDF、Word、Markdown、TXT 等格式</p>
        {!disabled && (
          <label className="inline-block cursor-pointer rounded-xl border border-sky-400/20 bg-blue-600 px-6 py-2.5 font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500" onClick={(e) => e.stopPropagation()}>
            选择文件
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.md,.txt" onChange={handleFileInputChange} className="hidden" disabled={disabled} />
          </label>
        )}
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>上传进度</h4>
          {uploadingFiles.map((file) => <UploadProgress key={file.id} file={file} onRemove={() => removeUploadingFile(file.id)} />)}
        </div>
      )}
    </div>
  )
}
