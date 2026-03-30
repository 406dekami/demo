import { useState, useEffect } from 'react'
import { parseTags, TAG_MAP } from '@/utils/model-tags'

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

/**
 * 获取厂商列表的自定义 hook
 * @returns 厂商列表、加载状态、错误信息和刷新函数
 */
export const useFactories = (): UseFactoriesResult => {
  const [factories, setFactories] = useState<FactoryModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadFactories = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/model/factories')
      const data = await response.json()

      if (data.code === 200) {
        const factoriesData = data.data?.factories || []
        const processedFactories = factoriesData.map((f: { tags: unknown; id: number; name: string; logo: string; rank?: number; status?: string }) => {
          // 解析和处理 tags
          const rawTags = parseTags(f.tags)

          // 标准化 tag
          const normalizedTags = rawTags
            .map((rawTag: string) => TAG_MAP[rawTag.trim().toUpperCase()] || null)
            .filter((t: string | null): t is string => t !== null)

          return {
            id: f.id,
            name: f.name,
            logo: f.logo,
            tags: normalizedTags,
            rank: f.rank,
            status: f.status
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
    loadFactories()
  }, [])

  return {
    factories,
    loading,
    error,
    refetch: loadFactories
  }
}
