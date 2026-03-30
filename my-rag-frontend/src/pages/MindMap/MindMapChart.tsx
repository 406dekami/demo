import { useEffect, useMemo, useRef, useState, type FC } from 'react'
import * as echarts from 'echarts'
import type { EChartsType } from 'echarts'
import type { MindMapNode } from '@/api/mindMap'

interface MindMapChartProps {
  treeData: MindMapNode
  onNodeClick: (node: MindMapNode) => void
}

type RenderNode = {
  id: string
  name: string
  level: number
  symbol: 'roundRect'
  symbolSize: [number, number]
  itemStyle: {
    color: string
    borderColor?: string
    borderWidth?: number
    shadowBlur?: number
    shadowColor?: string
  }
  label: {
    show: true
    color: string
    position: 'inside'
    fontSize: number
    fontWeight: 'normal' | 'bold'
    width?: number
    overflow?: 'truncate'
  }
  children?: RenderNode[]
}

const SINGLE_CLICK_DELAY = 250
const DOUBLE_CLICK_FLASH_MS = 200

const LEVEL_COLORS: Record<number, string> = {
  0: '#3b82f6',
  1: '#10b981',
  2: '#06b6d4',
  3: '#8b5cf6',
  4: '#f97316',
}

const buildNodeMap = (root: MindMapNode): Map<string, MindMapNode> => {
  const map = new Map<string, MindMapNode>()
  const stack: MindMapNode[] = [root]

  while (stack.length > 0) {
    const current = stack.pop()!
    map.set(current.id, current)
    if (current.children?.length) {
      for (let i = current.children.length - 1; i >= 0; i -= 1) {
        stack.push(current.children[i])
      }
    }
  }

  return map
}

const toRenderNode = (
  node: MindMapNode,
  collapsedIds: Set<string>,
  flashNodeId: string | null
): RenderNode => {
  const level = node.level ?? 0
  const isFlash = flashNodeId === node.id
  const isCollapsed = collapsedIds.has(node.id)

  const width = level === 0 ? 140 : 112

  return {
    id: node.id,
    name: node.title,
    level,
    symbol: 'roundRect',
    symbolSize: level === 0 ? [160, 52] : [128, 42],
    itemStyle: {
      color: LEVEL_COLORS[level] ?? '#9ca3af',
      borderColor: isFlash ? '#f8fafc' : undefined,
      borderWidth: isFlash ? 2 : 0,
      shadowBlur: isFlash ? 14 : 0,
      shadowColor: isFlash ? 'rgba(248,250,252,0.75)' : 'transparent',
    },
    label: {
      show: true,
      color: '#fff',
      position: 'inside',
      fontSize: level === 0 ? 16 : level === 1 ? 14 : 12,
      fontWeight: level === 0 ? 'bold' : 'normal',
      width,
      overflow: 'truncate',
    },
    children:
      !isCollapsed && node.children?.length
        ? node.children.map((child) => toRenderNode(child, collapsedIds, flashNodeId))
        : undefined,
  }
}

export const MindMapChart: FC<MindMapChartProps> = ({ treeData, onNodeClick }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)

  const singleClickTimerRef = useRef<number | null>(null)
  const flashTimerRef = useRef<number | null>(null)
  const lastClickRef = useRef<{ nodeId: string; ts: number } | null>(null)

  const onNodeClickRef = useRef(onNodeClick)
  const nodeMapRef = useRef<Map<string, MindMapNode>>(new Map())

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [flashNodeId, setFlashNodeId] = useState<string | null>(null)

  const nodeMap = useMemo(() => buildNodeMap(treeData), [treeData])

  useEffect(() => {
    onNodeClickRef.current = onNodeClick
  }, [onNodeClick])

  useEffect(() => {
    nodeMapRef.current = nodeMap
  }, [nodeMap])

  useEffect(() => {
    if (!containerRef.current) return

    const chart = echarts.init(containerRef.current, 'dark')
    chartRef.current = chart

    const clearSingleClick = () => {
      if (singleClickTimerRef.current !== null) {
        window.clearTimeout(singleClickTimerRef.current)
        singleClickTimerRef.current = null
      }
    }

    const startFlash = (nodeId: string) => {
      setFlashNodeId(nodeId)
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current)
      }
      flashTimerRef.current = window.setTimeout(() => {
        setFlashNodeId(null)
        flashTimerRef.current = null
      }, DOUBLE_CLICK_FLASH_MS)
    }

    const toggleCollapse = (nodeId: string) => {
      setCollapsedIds((prev) => {
        const next = new Set(prev)
        if (next.has(nodeId)) {
          next.delete(nodeId)
        } else {
          next.add(nodeId)
        }
        return next
      })
    }

    const handleNodeClick = (params: any) => {
      if (params?.dataType !== 'node') return
      const nodeId = params?.data?.id as string | undefined
      if (!nodeId) return

      const now = Date.now()
      const last = lastClickRef.current
      const isDoubleClick =
        !!last &&
        last.nodeId === nodeId &&
        now - last.ts <= SINGLE_CLICK_DELAY

      if (isDoubleClick) {
        clearSingleClick()
        lastClickRef.current = null
        toggleCollapse(nodeId)
        startFlash(nodeId)
        return
      }

      clearSingleClick()
      lastClickRef.current = { nodeId, ts: now }

      singleClickTimerRef.current = window.setTimeout(() => {
        const node = nodeMapRef.current.get(nodeId)
        if (node) {
          onNodeClickRef.current(node)
        }
        singleClickTimerRef.current = null
        lastClickRef.current = null
      }, SINGLE_CLICK_DELAY)
    }

    const handleResize = () => chart.resize()

    chart.on('click', handleNodeClick)
    window.addEventListener('resize', handleResize)

    return () => {
      clearSingleClick()
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current)
        flashTimerRef.current = null
      }

      chart.off('click', handleNodeClick)
      window.removeEventListener('resize', handleResize)
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    chart.setOption(
      {
        backgroundColor: 'transparent',
        animationDurationUpdate: 180,
        animationEasingUpdate: 'cubicOut',
        series: [
          {
            type: 'tree',
            data: [toRenderNode(treeData, collapsedIds, flashNodeId)],
            top: '8%',
            left: '6%',
            bottom: '8%',
            right: '20%',
            orient: 'LR',
            roam: true,
            expandAndCollapse: false,
            initialTreeDepth: -1,
            nodeGap: 44,
            layerPadding: 220,
            lineStyle: {
              color: '#4b5563',
              width: 2,
              curveness: 0.45,
            },
          },
        ],
      },
      { notMerge: true }
    )
  }, [treeData, collapsedIds, flashNodeId])

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-slate-950"
      style={{ minHeight: 'calc(100vh - 64px)' }}
    />
  )
}
