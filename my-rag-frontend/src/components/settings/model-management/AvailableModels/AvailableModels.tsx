import type {FC} from 'react'
import {useMemo, useState} from 'react'
import {ModelCard} from './ModelCard.tsx'
import {AddModel} from './AddModel.tsx'
import {useFactories} from '@/hooks/use-factories'
import {FILTER_TYPES} from '@/utils/model-tags'

// ============ 类型定义 ============
interface FactoryModel {
  id: number
  name: string
  logo: string
  tags: string[]
  rank?: number
  status?: string
}

interface AvailableModelsProps {
  handleAddModel: (factory: string, apiKey: string, baseUrl: string) => void
}

// ============ 主组件 ============
export const AvailableModels: FC<AvailableModelsProps> = ({ handleAddModel }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedFactory, setSelectedFactory] = useState<{ name: string; logo: string } | null>(null)

  // 使用自定义 hook 获取厂商列表
  const { factories, loading, error } = useFactories()

  const filteredModels = useMemo(() => {
    return factories.filter((factory) => {
      const matchesSearch = factory.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = selectedType === 'All' || factory.tags.includes(selectedType)
      return matchesSearch && matchesType
    })
  }, [factories, searchTerm, selectedType])

  const handleTypeClick = (type: string) => {
    setSelectedType(prev => prev === type ? 'All' : type)
  }

  const handleAddClick = (factory: FactoryModel) => {
    setSelectedFactory(factory)
    setModalOpen(true)
  }

  const handleModalSave = (apiKey: string, baseUrl: string) => {
    if (selectedFactory) {
      handleAddModel(selectedFactory.name, apiKey, baseUrl)
      setModalOpen(false)
      setSelectedFactory(null)
    }
  }

  return (
    <div className="dark:text-white text-gray-900 h-full p-4">
      <div className="dark:text-white text-gray-900 text-base mb-4">可选模型</div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索厂商名称..."
          className="w-full dark:bg-gray-800/50 bg-gray-100 dark:border-gray-700 border-gray-300 rounded-xl pl-10 pr-4 py-2.5 dark:text-gray-200 text-gray-900 dark:placeholder-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-gray-500 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {FILTER_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => handleTypeClick(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              selectedType === type
                ? 'bg-white text-black shadow-sm'
                : 'dark:bg-gray-800/50 bg-gray-200 dark:text-gray-400 text-gray-600 dark:hover:text-white hover:text-gray-900 dark:hover:bg-gray-700/50 hover:bg-gray-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Models List */}
      <div className="space-y-3 overflow-auto h-[calc(100vh-350px)] scrollbar-hide">
        {loading ? (
          <div className="text-center dark:text-gray-400 text-gray-600 py-8">
            <div className="animate-spin w-5 h-5 border-2 dark:border-gray-600 border-gray-300 dark:border-t-white border-t-gray-900 rounded-full mx-auto mb-2"></div>
            加载中...
          </div>
        ) : error ? (
          <div className="text-center dark:text-red-400 text-red-600 py-8">
            <p className="mb-1">⚠️ 加载失败</p>
            <p className="text-xs">{error.message}</p>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-center dark:text-gray-400 text-gray-600 py-8">
            <p className="mb-1">😕 暂无匹配结果</p>
            <p className="text-xs">尝试调整搜索词或筛选条件</p>
          </div>
        ) : (
          filteredModels.map((factory) => (
            <ModelCard
              key={factory.id}
              name={factory.name}
              logo={factory.logo}
              rank={factory.rank}
              tags={factory.tags}
              onClick={() => handleAddClick(factory)}
              onTagClick={(tag) => handleTypeClick(tag)}
              onAdd={() => handleAddClick(factory)}
            />
          ))
        )}
      </div>

      {/* 添加模型模态框 */}
      {selectedFactory && (
        <AddModel
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedFactory(null)
          }}
          factoryName={selectedFactory.name}
          factoryLogo={selectedFactory.logo}
          onSave={handleModalSave}
        />
      )}
    </div>
  )
}