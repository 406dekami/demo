// ModelManagement.tsx
import { type FC } from 'react'
import { AvailableModels } from './AvailableModels'
import { SetDefaultModel } from './SetDefaultModel'
import { AddedModel } from './AddedModel'
export const ModelManagement: FC = () => {

  // 设置默认模型
  const handleSetDefault = async (modelId: string, modelType: string) => {
    try {
      // TODO: 调用后端 API 设置默认模型
      console.log('设置默认模型:', modelId, modelType)
    } catch (error) {
      console.error('设置默认模型失败:', error)
    }
  }

  // 删除模型
  const handleDeleteModel = async () => {
    try {
      // TODO: 实现删除逻辑
    } catch (error) {
      console.error('删除模型失败:', error)
    }
  }

  // 添加模型 - 打开弹窗
  const handleAddModel = (factory: string) => {
    console.log('添加模型:', factory)
  }

  // 配置 API Key
  const handleConfigApiKey = async () => {
    try {
      // TODO: 实现配置 API Key 逻辑
      console.log('配置 API Key')
    } catch (error) {
      console.error('配置 API Key 失败:', error)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 左侧：设置默认模型和已添加的模型 */}
      <div className="space-y-6">
        <SetDefaultModel myLlmList={[]} onSetDefault={handleSetDefault} />
        <AddedModel 
          myLlmList={[]} 
          onConfigApiKey={handleConfigApiKey}
          onDeleteModel={handleDeleteModel}
        />
      </div>

      {/* 右侧：可选模型 - 使用 AvailableModels 组件 */}
      <div className="space-y-6">
        <AvailableModels handleAddModel={handleAddModel} />
      </div>
    </div>
  )
}
