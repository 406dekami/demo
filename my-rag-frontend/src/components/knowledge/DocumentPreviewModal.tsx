import {useEffect, useRef, useState} from 'react'
import {ChevronLeft, ChevronRight, Download, FileText, Loader2, X} from 'lucide-react'
import {type DocumentChunk, getDocumentChunks, getDocumentDownloadUrl, getDocumentPreviewUrl} from '@/api/knowledge'
import {useTheme} from '@/hooks/useTheme'
import {renderAsync} from 'docx-preview'

interface DocumentPreviewModalProps {
  kbId: string
  docId: string
  docName: string
  fileType: string
  onClose: () => void
}

export default function DocumentPreviewModal({ kbId, docId, docName, fileType, onClose }: DocumentPreviewModalProps) {
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState<'preview' | 'chunks'>('preview')
  const [loading, setLoading] = useState(false)
  const [chunks, setChunks] = useState<DocumentChunk[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalChunks, setTotalChunks] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const cleanFileType = fileType.toLowerCase().replace('.', '')
  const isPdf = cleanFileType === 'pdf'
  const isDocx = cleanFileType === 'docx'
  const isLegacyDoc = cleanFileType === 'doc'

  const previewUrl = getDocumentPreviewUrl(kbId, docId)
  const downloadUrl = getDocumentDownloadUrl(kbId, docId)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [docxLoading, setDocxLoading] = useState(false)

  const docxContainerRef = useRef<HTMLDivElement>(null)

  // DOCX 预览渲染
  useEffect(() => {
    if (activeTab === 'preview' && isDocx && docxContainerRef.current) {
      setDocxLoading(true)
      setPreviewError(null)

      fetch(previewUrl)
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => null)
            throw new Error(data?.message || '预览加载失败')
          }
          const blob = await res.blob()
          await renderAsync(blob, docxContainerRef.current!, undefined, {
            className: 'docx-container',
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            experimental: true,
          })
        })
        .catch((err) => {
          setPreviewError(err instanceof Error ? err.message : '预览加载失败')
        })
        .finally(() => setDocxLoading(false))
    }
  }, [activeTab, isDocx, previewUrl])

  useEffect(() => {
    if (activeTab === 'chunks') {
      fetchChunks()
    }
  }, [activeTab, currentPage])

  const fetchChunks = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDocumentChunks(kbId, docId, currentPage, 10)
      setChunks(data.chunks)
      setTotalChunks(data.total)
      setTotalPages(Math.ceil(data.total / data.page_size))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`relative flex h-[85vh] w-[85vw] max-w-6xl flex-col rounded-2xl border shadow-2xl ${
          isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <FileText className={`h-5 w-5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{docName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isDark ? 'bg-slate-800 text-sky-400 hover:bg-slate-700' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
              }`}
              title="下载原文"
            >
              <Download className="h-3.5 w-3.5" />
              下载原文
            </a>
            <button
              onClick={onClose}
              className={`rounded-lg p-2 transition-colors ${
                isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 border-b px-6 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <button
            onClick={() => setActiveTab('preview')}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? isDark ? 'bg-slate-800 text-sky-400' : 'bg-white text-sky-600'
                : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            文件预览
          </button>
          <button
            onClick={() => setActiveTab('chunks')}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'chunks'
                ? isDark ? 'bg-slate-800 text-sky-400' : 'bg-white text-sky-600'
                : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            分块结果 ({totalChunks})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'preview' && (
            <div className="h-full">
              {/* PDF: iframe */}
              {isPdf && (
                previewError ? (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <FileText className={`mb-4 h-16 w-16 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                    <p className={`mb-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{previewError}</p>
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                    >
                      <Download className="h-4 w-4" />
                      下载原文
                    </a>
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    className="h-full w-full border-0"
                    title="文档预览"
                  />
                )
              )}

              {/* DOCX: docx-preview */}
              {isDocx && (
                docxLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                  </div>
                ) : previewError ? (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <FileText className={`mb-4 h-16 w-16 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                    <p className={`mb-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{previewError}</p>
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                    >
                      <Download className="h-4 w-4" />
                      下载原文
                    </a>
                  </div>
                ) : (
                  <div ref={docxContainerRef} className="h-full overflow-auto bg-white" />
                )
              )}

              {/* 旧版 .doc: 提示下载 */}
              {isLegacyDoc && (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <FileText className={`mb-4 h-16 w-16 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                  <p className={`mb-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    旧版 .doc 格式不支持在线预览，请下载后用 Word 打开
                  </p>
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                  >
                    <Download className="h-4 w-4" />
                    下载原文
                  </a>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chunks' && (
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                </div>
              ) : error ? (
                <div className={`rounded-xl border p-4 ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-600'}`}>
                  <p className="text-sm">{error}</p>
                </div>
              ) : chunks.length === 0 ? (
                <div className="py-12 text-center">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>暂无分块数据</p>
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className={`mb-4 rounded-xl border px-4 py-3 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      共 <span className="font-semibold">{totalChunks}</span> 个分块，当前显示第 {((currentPage - 1) * 10) + 1}-{Math.min(currentPage * 10, totalChunks)} 个
                    </p>
                  </div>

                  {/* Chunks List */}
                  <div className="space-y-4">
                    {chunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className={`rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/50' : 'border-slate-200 bg-white'}`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className={`text-xs font-medium ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                            Chunk #{chunk.chunk_index}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {chunk.content.length} 字
                          </span>
                        </div>
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {chunk.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`rounded-lg p-2 transition-colors disabled:opacity-40 ${
                          isDark
                            ? 'text-slate-400 hover:bg-slate-800 disabled:cursor-not-allowed'
                            : 'text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed'
                        }`}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`rounded-lg p-2 transition-colors disabled:opacity-40 ${
                          isDark
                            ? 'text-slate-400 hover:bg-slate-800 disabled:cursor-not-allowed'
                            : 'text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed'
                        }`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
