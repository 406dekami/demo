// SetDefaultModel.tsx
import {type FC} from 'react'
import type {LlmItem} from '@/hooks/use-llm-request'
import {LlmModelType} from '@/constants/knowledge'
import {getRealModelName} from '@/utils/llm-util'

const MODEL_TYPES = [
  { key: LlmModelType.Chat, label: 'Chat', icon: '💬' },
  { key: LlmModelType.Image2text, label: 'VLM', icon: '🖼️' },
  { key: LlmModelType.Embedding, label: 'Embedding', icon: '📊' },
  { key: LlmModelType.Speech2text, label: 'ASR', icon: '🎤' },
  { key: LlmModelType.Rerank, label: 'Rerank', icon: '🔄' },
  { key: LlmModelType.TTS, label: 'TTS', icon: '🔊' },
]

interface SetDefaultModelProps {
  myLlmList: LlmItem[]
  onSetDefault: (modelId: string, modelType: string) => void
}

export const SetDefaultModel: FC<SetDefaultModelProps> = ({ myLlmList, onSetDefault }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-gs text-2xl font-semibold dark:text-white text-gray-900 mb-2">设置默认模型</h2>
        <p className="dark:text-gray-400 text-gray-600 text-sm">请在开始之前完成这些设置</p>
      </div>

      <div className="dark:bg-gray-800/30 bg-gray-100 backdrop-blur-sm dark:border-gray-700/50 border-gray-200 rounded-2xl p-6 space-y-4">
        {MODEL_TYPES.map((type) => (
          <div key={type.key} className="flex items-center gap-4">
            <label className="w-32 dark:text-gray-300 text-gray-700 text-sm flex items-center gap-2">
              {type.icon} {type.key === LlmModelType.Chat ? '*LLM' : type.label}
              {type.key === LlmModelType.Chat && <span className="dark:text-red-400 text-red-600">*</span>}
            </label>
            <div className="flex-1">
              <select 
                className="w-full dark:bg-gray-900/50 bg-gray-50 dark:border-gray-700 border-gray-300 rounded-lg px-4 py-2.5 dark:text-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                onChange={(e) => onSetDefault(e.target.value, type.key)}
                value=""
              >
                <option value="">请选择{type.label}模型</option>
                {myLlmList
                  .filter(factory => factory.Llm?.some(llm => llm.model_type?.includes(type.key)))
                  .flatMap(factory => factory.Llm || [])
                  .filter(llm => llm.model_type?.includes(type.key))
                  .map(llm => (
                    <option key={llm.llm_name} value={llm.llm_name}>
                      {getRealModelName(llm.llm_name)}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
