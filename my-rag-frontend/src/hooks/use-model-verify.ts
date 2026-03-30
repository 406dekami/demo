/**
 * 模型验证相关的自定义 Hook
 */

import { useState } from 'react'
import axios from 'axios'

export interface VerifyModelParams {
  tenant_id?: string
  llm_factory: string
  api_key: string
  base_url?: string
}

export interface VerifyResult {
  success: boolean
  message: string
}

/**
 * 模型验证 Hook
 * @returns 验证状态、验证函数和错误信息
 */
export const useModelVerify = () => {
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 验证模型 API Key 和配置
   */
  const verifyModel = async (params: VerifyModelParams): Promise<VerifyResult> => {
    setVerifying(true)
    setError(null)

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/v1/model/models/verify', params)

      if (response.data.code === 0) {
        return {
          success: true,
          message: response.data.message || '验证成功！'
        }
      } else {
        return {
          success: false,
          message: response.data.message || '验证失败'
        }
      }
    } catch (err: any) {
      let errorMsg = '验证失败，请检查 API Key 和网络连接'
      
      if (err.response) {
        errorMsg = err.response.data?.message || `API 错误：${err.response.status}`
      } else if (err.request) {
        errorMsg = '网络连接失败，请检查网络'
      } else if (err.message) {
        errorMsg = err.message
      }
      
      setError(errorMsg)
      return {
        success: false,
        message: errorMsg
      }
    } finally {
      setVerifying(false)
    }
  }

  /**
   * 清除错误信息
   */
  const clearError = () => {
    setError(null)
  }

  return {
    verifying,
    error,
    verifyModel,
    clearError
  }
}
