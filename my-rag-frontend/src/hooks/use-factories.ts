import {useEffect, useState} from 'react'
import {parseTags, TAG_MAP} from '@/utils/model-tags'
import apiClient from '@/api/client'

interface FactoryModel {
  id: number
  name: string
  logo: string
  tags: string[]
  rank?: number
  status?: string
}

interface UseFactoriesResult {
  factories: FactoryModel[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

export const useFactories = (): UseFactoriesResult => {
  const [factories, setFactories] = useState<FactoryModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadFactories = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<{ code: number; message: string; data?: { factories?: Array<{ tags: unknown; id: number; name: string; logo: string; rank?: number; status?: string }> } }>('/model/factories')
      const data = response.data

      if (data.code === 0) {
        const factoriesData = data.data?.factories || []
        const processedFactories = factoriesData.map((f) => {
          const rawTags = parseTags(f.tags)
          const normalizedTags = rawTags
            .map((rawTag: string) => TAG_MAP[rawTag.trim().toUpperCase()] || null)
            .filter((t: string | null): t is string => t !== null)

          return {
            id: f.id,
            name: f.name,
            logo: f.logo,
            tags: normalizedTags,
            rank: f.rank,
            status: f.status,
          }
        })
        setFactories(processedFactories)
      } else {
        setError(new Error(data.message || '加载厂商列表失败'))
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('加载失败'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFactories()
  }, [])

  return {
    factories,
    loading,
    error,
    refetch: loadFactories,
  }
}
