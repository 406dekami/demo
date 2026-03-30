import { useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Notebook } from '@/types';
import { TEXT_STYLES, LAYOUT, DARK_MODE } from '@/styles/constants'
import { CreateNotebookModal } from '@/components/notebook/CreateNotebookModal'
import { getKnowledgeBases, type KnowledgeBase } from '@/api/knowledge'
import { Trash2, FileText, File, FileSpreadsheet } from 'lucide-react'

interface Props {
  notebooks: Notebook[];
  onCreateNotebook: (notebook: Notebook | Notebook[]) => void;
  onDeleteNotebook: (id: string) => void | Promise<void>;
}

export const NotebookGridPage: FC<Props> = ({ notebooks, onCreateNotebook, onDeleteNotebook }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  
  // 去重 notebooks，避免 key 重复警告
  const uniqueNotebooks = Array.from(
    new Map(notebooks.map((nb: Notebook) => [nb.id, nb])).values()
  );
  
  console.log('📝 Notebooks:', {
    total: notebooks.length,
    unique: uniqueNotebooks.length,
    ids: notebooks.map(nb => nb.id)
  })

  const handleCreateNotebook = async () => {
    try {
      // 加载知识库列表
      const kbs = await getKnowledgeBases()
      setKnowledgeBases(kbs)
      setIsModalOpen(true)
    } catch (error) {
      console.error('加载知识库失败:', error)
      alert('加载知识库失败，请稍后重试')
    }
  }

  const handleModalSuccess = async (notebookId: string) => {
    try {
      // 重新加载笔记本列表以更新状态
      const { getNotebooks } = await import('@/api/knowledge')
      const updatedNotebooks = await getNotebooks()
      
      // 为每本笔记本生成封面样式
      const formattedNbs = updatedNotebooks.map(nb => ({
        ...nb,
        coverColor: ['#fef3c7', '#bfdbfe', '#fecaca', '#e0f2fe', '#fde68a', '#a7f3d0', '#ddd6fe'][nb.id.charCodeAt(0) % 7],
        pattern: ['dots', 'waves', 'tiles', 'hearts', 'rain', 'triangles', 'solid'][nb.id.charCodeAt(1) % 7] as Notebook['pattern'],
        lastUpdated: nb.updated_at || new Date().toISOString(),
      }))
      
      // 更新父组件状态
      onCreateNotebook(formattedNbs)
      
      // 跳转到笔记本详情页
      navigate(`/notebook/${notebookId}`)
    } catch (error) {
      console.error('加载笔记本失败:', error)
      // 如果加载失败，至少跳转到详情页
      navigate(`/notebook/${notebookId}`)
    }
  }

  const handleDeleteNotebook = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation() // 阻止冒泡，避免触发卡片点击
    if (!confirm(`确定要删除笔记本"${title}"吗？`)) return
    
    try {
      // onDeleteNotebook 可能是异步的
      const result = onDeleteNotebook(id)
      if (result instanceof Promise) {
        await result
      }
      // 删除成功后，添加提示
      console.log(`✅ 笔记本 "${title}" 已删除`)
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请稍后重试')
    }
  }

  return (
    <div className={LAYOUT.GRID}>
      {/* 新建按钮 */}
      <button
        className={DARK_MODE.CARD_CREATE}
        onClick={handleCreateNotebook}
        aria-label="新建笔记"
      >
        <div className={DARK_MODE.ICON_BASE}>
          <span className="text-4xl font-light">＋</span>
        </div>
        <span className={TEXT_STYLES.TITLE_PRIMARY}>
          新建笔记
        </span>
        <span className={TEXT_STYLES.DESCRIPTION}>
          开始记录
        </span>
      </button>

      {/* 笔记列表 */}
      {uniqueNotebooks.length > 0 && uniqueNotebooks.map((nb) => {
        // 计算关联的资料库数量
        const kbCount = nb.kb_ids ? nb.kb_ids.length : 0
        
        return (
          <article
            key={nb.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/notebook/${nb.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/notebook/${nb.id}`)}
            className={DARK_MODE.CARD_NORMAL}
          >
            {/* 封面 */}
            <div 
              className="h-40 w-full relative"
              style={{ backgroundColor: nb.coverColor || '#fef3c7' }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600/50">
                {nb.pattern ? nb.pattern.toUpperCase() : 'NOTEBOOK'}
              </div>
            </div>
            
            {/* 内容区域 */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex-1">
                <h3 className={TEXT_STYLES.TITLE_SECONDARY}>
                  {nb.title}
                </h3>
                <p className={TEXT_STYLES.DESCRIPTION_SMALL}>
                  更新于 {nb.lastUpdated ? new Date(nb.lastUpdated).toLocaleDateString() : '未知'}
                </p>
              </div>

              {/* Footer - 资料库数和删除按钮 */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                {/* 资料库数量（带图标） */}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex -space-x-1.5">
                    {[1, 2, 3].slice(0, Math.min(3, kbCount)).map((_, idx) => {
                      // 根据索引模拟不同的文档类型
                      const docTypes = ['txt', 'pdf', 'docx'] as const;
                      const docType = docTypes[idx % docTypes.length];
                      
                      return (
                        <div
                          key={`${nb.id}-avatar-${idx}`}
                          className="w-6 h-6 rounded-full bg-gray-100
                                     border-2 border-white flex items-center justify-center
                                     shadow-sm dark:bg-gray-700 dark:border-gray-800"
                          aria-hidden="true"
                        >
                          {docType === 'txt' && (
                            <FileText className="w-3 h-3 text-blue-500" />
                          )}
                          {docType === 'pdf' && (
                            <File className="w-3 h-3 text-red-500" />
                          )}
                          {docType === 'docx' && (
                            <FileSpreadsheet className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                      );
                    })}
                    {kbCount > 3 && (
                      <div 
                        key={`${nb.id}-avatar-more`}
                        className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white
                                  flex items-center justify-center text-[8px] font-medium text-gray-400
                                  dark:bg-gray-700 dark:border-gray-800 dark:text-gray-500">
                        +{kbCount - 3}
                      </div>
                    )}
                  </div>
                  <span>{kbCount} 个资料库</span>
                </div>

                {/* 删除按钮 */}
                <button
                  type="button"
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50
                             rounded-lg transition-all duration-200
                             opacity-0 group-hover:opacity-100 focus:opacity-100
                             focus:outline-none focus:ring-2 focus:ring-red-500/50
                             dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-500/10"
                  onClick={(e) => handleDeleteNotebook(e, nb.id, nb.title)}
                  aria-label={`删除笔记本：${nb.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        )
      })} 

      {/* 创建笔记本 Modal */}
      <CreateNotebookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        knowledgeBases={knowledgeBases}
      />
    </div>
  );
};