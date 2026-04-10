// AddedModel.tsx
import {type FC} from 'react'
import type {LlmItem} from '@/hooks/use-llm-request'

// import { getRealModelName } from '@/utils/llm-util'

interface AddedModelProps {
  myLlmList: LlmItem[]
  onConfigApiKey: (factory: LlmItem) => void
  onDeleteModel: (factory: string, llmName: string) => void
}

export const AddedModel: FC<AddedModelProps> = ({ myLlmList, onConfigApiKey, onDeleteModel }) => {
  return (
    <div className="pt-6">
      <h3 className="font-gs text-xl font-semibold dark:text-white text-gray-900 mb-4">已添加的模型</h3>
      <div className="space-y-3">
        {myLlmList.map((factory) =>
          factory.Llm?.map((llm) => (
            <div
              key={`${factory.name}-${llm.llm_name}`}
              className="flex items-center gap-3 dark:bg-gray-800/30 bg-gray-100 backdrop-blur-sm dark:border-gray-700/50 border-gray-200 rounded-xl p-4 dark:hover:border-gray-600 hover:border-gray-400 transition-all duration-200"
            >
              <div className="w-10 h-10 bg-linear-to-br from-blue-500/20 to-purple-600/20 rounded-xl flex items-center justify-center text-2xl">
                💠
              </div>
              <div className="flex-1">
                <h4 className="font-gs font-medium dark:text-white text-gray-900 text-base">
                  {/*{getRealModelName(llm.llm_name)}*/}
                </h4>
                <p className="text-xs dark:text-gray-400 text-gray-600 mt-0.5">{factory.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onConfigApiKey(factory)}
                  className="px-3 py-1.5 dark:bg-gray-700/50 bg-gray-200 dark:hover:bg-gray-600/50 hover:bg-gray-300 rounded-lg text-xs dark:text-gray-300 text-gray-700 transition-all duration-200 flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  API-Key
                </button>
                <button 
                  onClick={() => onDeleteModel(factory.name, llm.llm_name)}
                  className="p-2 dark:text-gray-400 text-gray-600 dark:hover:text-red-400 hover:text-red-600 dark:hover:bg-red-500/10 hover:bg-red-50 rounded-lg transition-all duration-200"
                  aria-label="删除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
