/**
 * 模型验证相关的自定义 Hook
 */

import {useState} from 'react'
import apiClient from '@/api/client'

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

export const useModelVerify = () => {
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verifyModel = async (params: VerifyModelParams): Promise<VerifyResult> => {
    setVerifying(true)
    setError(null)

    try {
      const response = await apiClient.post<{ code: number; message: string; data?: { verified?: boolean } }>(
        '/model/models/verify',
        params,
      )

      if (response.data.code === 0) {
        return {
          success: true,
          message: response.data.message || '验证成功！',
        }
      }

      return {
        success: false,
        message: response.data.message || '验证失败',
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '验证失败，请检查 API Key 和网络连接'
      setError(errorMsg)
      return {
        success: false,
        message: errorMsg,
      }
    } finally {
      setVerifying(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    verifying,
    error,
    verifyModel,
    clearError,
  }
}
