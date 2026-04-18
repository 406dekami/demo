import {type FC, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {getUserProgress, toggleNodeProgress} from '@/api/mindMap'
import {useMindMapTree, useNodePath} from '@/hooks/useMindMap'
import {Skeleton} from '@/components/common/Skeleton'
import {ChatPanel} from './ChatPanel'
import {MindMapNodeItem} from './MindMapNodeItem'
import {EdgeLayer, FocusCard, PathBreadcrumb, TooltipCard, ZoomControls} from './MindMapOverlays'
import {buildEdges, findNode, flattenNodes, getBounds, layoutTree, type Node, type TooltipState} from './mindMapLayout'
import {useMindMapViewport} from './useMindMapViewport'
import {useTheme} from '@/hooks/useTheme'

const ROOT_ID = 'root'
const EMPTY = '单击标题更新详情，双击节点展开或收缩分支。'
const STORAGE_KEY = 'mindmap-completed-ids'

export const MindMapPage: FC = () => {
  const viewportRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<Node | null>(null)
  const toggleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRef = useRef(false)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set([ROOT_ID]))
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [progressStats, setProgressStats] = useState<{ total: number; completed: number }>({ total: 0, completed: 0 })
  const [isChatCollapsed, setIsChatCollapsed] = useState(true)
  const [tooltip, setTooltip] = useState<TooltipState>(null)
  const { isDark } = useTheme()
  const isLoggedIn = useMemo(() => !!localStorage.getItem('auth_token'), [])

  // 使用 React Query 获取数据
  const { data: treeData, isLoading } = useMindMapTree(ROOT_ID)
  const { data: pathData } = useNodePath(selectedId || '')

  // 初始化进度数据（登录走后端，未登录走 localStorage）
  useEffect(() => {
    let cancelled = false
    const loadProgress = async () => {
      const raw = localStorage.getItem(STORAGE_KEY)
      const loadLocalStorageData = () => {
        if (!raw || cancelled) return
        try {
          setCompletedIds(new Set(JSON.parse(raw) as string[]))
        } catch {
          localStorage.removeItem(STORAGE_KEY)
        }
      }

      if (isLoggedIn) {
        try {
          const data = await getUserProgress()
          if (!cancelled && data) setCompletedIds(new Set(data.completed_ids))
        } catch {
          loadLocalStorageData()
        }
      } else {
        loadLocalStorageData()
      }
    }
    loadProgress().catch(console.error)
    return () => { cancelled = true }
  }, [isLoggedIn])

  // 同步树数据并计算进度
  useEffect(() => {
    if (treeData && !initializedRef.current) {
      initializedRef.current = true
      treeRef.current = treeData
      setSelectedId(treeData.id)
    }

    if (treeData) {
      const countLeafNodes = (node?: Node | null): { total: number; completed: number } => {
        if (!node) return { total: 0, completed: 0 }
        if (node.is_leaf) {
          return { total: 1, completed: completedIds.has(node.id) ? 1 : 0 }
        }
        let total = 0
        let completed = 0
        if (node.children) {
          for (const child of node.children) {
            const result = countLeafNodes(child)
            total += result.total
            completed += result.completed
          }
        }
        return { total, completed }
      }
      setProgressStats(countLeafNodes(treeData))
    }
  }, [treeData, completedIds])

  const tree = treeData || null

  const {
    view,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    stopDrag,
    zoomByButton,
    resetView,
  } = useMindMapViewport({ viewportRef })

  const path = useMemo(() => pathData || [], [pathData])
  const pathIds = useMemo(() => new Set(path.map((item) => item.id)), [path])
  const root = useMemo(() => tree ? layoutTree(tree, collapsedIds, selectedId, pathIds, completedIds) : null, [tree, collapsedIds, selectedId, pathIds, completedIds])
  const nodes = useMemo(() => (root ? flattenNodes(root) : []), [root])
  const edges = useMemo(() => (root ? buildEdges(root) : []), [root])
  const bounds = useMemo(() => getBounds(nodes), [nodes])
  const selected = useMemo(() => findNode(tree, selectedId || ''), [tree, selectedId])
  const title = selected?.title || '未选择节点'
  const subtitle = selected?.node_type || '知识节点'
  const pathText = path.length ? path.map((item) => item.title).join(' / ') : EMPTY
  const progressPercent = progressStats.total > 0 ? Math.round((progressStats.completed / progressStats.total) * 100) : 0

  // 调试信息
  console.log('MindMapPage 渲染:', { selected, selectedId, path, pathText })

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  const handleDone = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const isDone = prev.has(id)
      const next = new Set(prev)
      
      // 记录所有状态变化的节点 ID（用于同步到后端）
      const changedNodes: { id: string; isCompleted: boolean }[] = []
      
      // 辅助函数：获取节点的所有后代 ID（基于树结构）
      const getAllDescendantIds = (nodeId: string, currentNode?: Node): string[] => {
        const target = currentNode || findNode(tree, nodeId)
        if (!target?.children?.length) return []
        const ids: string[] = []
        for (const child of target.children) {
          ids.push(child.id)
          ids.push(...getAllDescendantIds(child.id, child))
        }
        return ids
      }
      
      // 辅助函数：向上检查并更新父节点状态
      const updateParentCascade = (nodeId: string) => {
        const currentNode = findNode(tree, nodeId)
        if (!currentNode?.parent_id) return
        
        const parentNode = findNode(tree, currentNode.parent_id)
        if (!parentNode?.children) return
        
        // 检查父节点的所有直接子节点是否都已完成
        const allChildrenDone = parentNode.children.every(child => next.has(child.id))
        
        if (allChildrenDone && !next.has(parentNode.id)) {
          // 所有子节点都完成了，自动勾选父节点
          next.add(parentNode.id)
          changedNodes.push({ id: parentNode.id, isCompleted: true })
          updateParentCascade(parentNode.id) // 继续向上
        } else if (!allChildrenDone && next.has(parentNode.id)) {
          // 有子节点未完成，但父节点已勾选，取消父节点
          next.delete(parentNode.id)
          changedNodes.push({ id: parentNode.id, isCompleted: false })
          updateParentCascade(parentNode.id) // 继续向上
        }
      }
      
      if (isDone) {
        // 取消完成：先删除当前节点和所有后代
        next.delete(id)
        changedNodes.push({ id, isCompleted: false })
        const descendants = getAllDescendantIds(id)
        descendants.forEach(descId => {
          next.delete(descId)
          changedNodes.push({ id: descId, isCompleted: false })
        })
        
        // 向上检查：取消可能导致父节点不再满足"全部完成"条件
        updateParentCascade(id)
      } else {
        // 完成当前节点
        next.add(id)
        changedNodes.push({ id, isCompleted: true })
        // 向上检查：可能触发父节点自动完成
        updateParentCascade(id)
      }

      // 更新统计（只统计叶子节点）
      const countLeafNodes = (node?: Node | null): { total: number; completed: number } => {
        if (!node) return { total: 0, completed: 0 }
        if (node.is_leaf) {
          return { total: 1, completed: next.has(node.id) ? 1 : 0 }
        }
        let total = 0
        let completed = 0
        if (node.children) {
          for (const child of node.children) {
            const result = countLeafNodes(child)
            total += result.total
            completed += result.completed
          }
        }
        return { total, completed }
      }
      const stats = countLeafNodes(tree)
      setProgressStats(stats)

      // 批量同步所有变化的节点到后端
      if (isLoggedIn && changedNodes.length > 0) {
        if (toggleTimerRef.current) clearTimeout(toggleTimerRef.current)
        toggleTimerRef.current = setTimeout(async () => {
          // 依次同步所有变化的节点
          for (const change of changedNodes) {
            await toggleNodeProgress(change.id, change.isCompleted).catch(console.error)
          }
          toggleTimerRef.current = null
        }, 300)
      }

      return next
    })
  }, [isLoggedIn, tree])

  const handleCollapse = useCallback((id: string) => {
    const current = findNode(tree, id)
    if (!current?.children?.length) return
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        // 展开：移除当前节点，同时将当前节点的所有后代（除直接子节点外）加入折叠状态
        next.delete(id)
        const addDescendantsToCollapsed = (nodeId: string, depth = 0) => {
          const target = findNode(tree, nodeId)
          if (!target?.children?.length) return
          for (const child of target.children) {
            if (depth > 0) next.add(child.id) // 只折叠第二层及以后的后代
            addDescendantsToCollapsed(child.id, depth + 1)
          }
        }
        addDescendantsToCollapsed(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [tree])

  const updateTooltip = useCallback((event: React.MouseEvent<HTMLElement>, node: Node) => {
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({ x: event.clientX - rect.left + 18, y: event.clientY - rect.top + 18, node })
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (toggleTimerRef.current) clearTimeout(toggleTimerRef.current)
    }
  }, [])

  if (isLoading) return (
    <div className={`min-h-[70vh] p-6 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      <div className="mx-auto max-w-400 space-y-4">
        <Skeleton variant="rectangular" height={60} className="w-full" />
        <div className={`rounded-[28px] border p-8 ${isDark ? 'border-slate-800/80 bg-slate-950/60' : 'border-blue-200/60 bg-white/60'}`}>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={120} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen px-6 py-6 ${isDark ? 'bg-[radial-gradient(circle_at_top,rgba(14,165,233,.16),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(167,139,250,.18),transparent_26%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100' : 'bg-linear-to-b from-blue-50 via-white to-sky-50 text-slate-900'}`}>
      <div className="mx-auto max-w-400">
        {/* 进度统计 */}
        {progressStats.total > 0 && (
          <div className={`mb-4 rounded-2xl border px-5 py-3 backdrop-blur-sm ${isDark ? 'border-slate-800/60 bg-slate-900/60' : 'border-blue-200/60 bg-white/60'}`}>
            <div className="flex items-center justify-between text-sm">
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>学习进度</span>
              <span className={`font-semibold ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>
                {progressStats.completed} / {progressStats.total}
                <span className={`ml-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({progressPercent}%)</span>
              </span>
            </div>
            <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${isDark ? 'bg-linear-to-r from-sky-500 to-violet-500' : 'bg-linear-to-r from-sky-400 to-violet-400'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <section className={`relative overflow-hidden rounded-[28px] border shadow-2xl backdrop-blur-xl ${isDark ? 'border-slate-800/80 bg-slate-950/60' : 'border-blue-200/60 bg-white/60'}`}>
          <div
            ref={viewportRef}
            className="relative h-[calc(100vh-84px)] min-h-170 overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDrag}
            onMouseLeave={() => {
              stopDrag()
              setTooltip(null)
            }}
            onWheel={handleWheel}
          >
            <div
              className="absolute left-0 top-0"
              style={{
                width: bounds.width,
                height: bounds.height,
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                transformOrigin: '0 0',
              }}
            >
              <EdgeLayer edges={edges} width={bounds.width} height={bounds.height} />
              {nodes.map((item) => (
                <MindMapNodeItem
                  key={item.node.id}
                  item={item}
                  isDark={isDark}
                  onDone={handleDone}
                  onSelect={handleSelect}
                  onCollapse={handleCollapse}
                  onTip={updateTooltip}
                  onLeave={() => setTooltip(null)}
                />
              ))}
            </div>

            {selected && <FocusCard title={title} subtitle={subtitle} onOpenChat={() => setIsChatCollapsed(false)} />}
            {tooltip && <TooltipCard tooltip={tooltip} />}
          </div>
        </section>
        <ZoomControls scale={view.scale} onZoomOut={() => zoomByButton(-0.15)} onZoomIn={() => zoomByButton(0.15)} />
        {selected && <PathBreadcrumb pathText={pathText} />}
      </div>

      {selected && <ChatPanel node={selected!} isCollapsed={isChatCollapsed} onToggleCollapse={() => setIsChatCollapsed((prev) => !prev)} />}
    </div>
  )
}
