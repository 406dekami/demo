/**
 * 思维导图相关 Hooks
 */
import { useQuery } from '@tanstack/react-query'
import { getMindMapTree, getNodePath, getNodeQuestions } from '@/api/mindMap'

export const useMindMapTree = (rootId: string = 'root') => {
  return useQuery({
    queryKey: ['mindMapTree', rootId],
    queryFn: () => getMindMapTree(rootId),
    staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
  })
}

export const useNodePath = (nodeId: string) => {
  return useQuery({
    queryKey: ['nodePath', nodeId],
    queryFn: () => getNodePath(nodeId),
    enabled: !!nodeId, // 只有当 nodeId 存在时才请求
  })
}

export const useNodeQuestions = (nodeId: string) => {
  return useQuery({
    queryKey: ['nodeQuestions', nodeId],
    queryFn: () => getNodeQuestions(nodeId),
    enabled: !!nodeId,
  })
}
