import React, {useEffect, useRef, useState} from 'react'
import * as echarts from 'echarts'
import {ArrowLeft, Loader2, Network} from 'lucide-react'
import {getKnowledgeGraphData, type GraphData} from '@/api/knowledgeGraph'

interface KnowledgeGraphProps {
  notebookId?: string
  knowledgeBaseId?: string
  height?: string
  onNodeClick?: (node: { id: string; label: string; type: string; category: number; size?: number }) => void
  asPage?: boolean
  onClose?: () => void
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  height = '500px',
  onNodeClick,
  asPage = false,
  onClose,
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    let chart: echarts.ECharts | null = null
    const handleResize = () => chart?.resize()

    const initChart = async () => {
      setLoading(true)
      setError(null)

      try {
        const data: GraphData = await getKnowledgeGraphData()
        if (!chartRef.current) return

        chart = echarts.init(chartRef.current, 'dark', { renderer: 'canvas' })
        chart.setOption({
          backgroundColor: 'transparent',
          tooltip: { trigger: 'item' },
          legend: [{ data: data.categories.map((c) => c.name), right: 20, top: 20, textStyle: { color: '#e5e7eb' } }],
          series: [{
            type: 'graph',
            layout: 'force',
            data: data.nodes.map((node) => ({
              id: node.id,
              name: node.name,
              symbolSize: node.symbolSize,
              category: node.category,
              value: node.node_type,
              draggable: true,
            })),
            links: data.links.map((link) => ({
              source: link.source,
              target: link.target,
              value: link.value,
              lineStyle: link.lineStyle,
            })),
            categories: data.categories,
            roam: true,
            label: { show: true, position: 'right', color: '#e5e7eb' },
            force: { repulsion: 800, edgeLength: [150, 250], gravity: 0.08 },
            lineStyle: { color: 'source', width: 2, curveness: 0.3, opacity: 0.7 },
            emphasis: { focus: 'adjacency' },
          }],
        })

        chart.on('click', (params: any) => {
          if (params?.dataType === 'node' && onNodeClick) {
            onNodeClick({
              id: params.data.id,
              label: params.data.name,
              type: params.data.value,
              category: params.data.category,
              size: params.data.symbolSize,
            })
          }
        })

        window.addEventListener('resize', handleResize)
        setLoading(false)
      } catch (err) {
        console.error('加载图谱失败:', err)
        setError(err instanceof Error ? err.message : '加载失败')
        setLoading(false)
      }
    }

    void initChart()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart?.dispose()
    }
  }, [onNodeClick])

  const content = (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gray-800/30 backdrop-blur-sm border border-gray-700/50" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg z-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-white">加载知识图谱...</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg z-10">
          <div className="text-center text-red-500 p-4">
            <p className="text-lg font-semibold">❌ {error}</p>
          </div>
        </div>
      )}
      <div ref={chartRef} className="w-full h-full" />
    </div>
  )

  if (!asPage) {
    return content
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <header className="sticky top-0 z-20 h-16 border-b border-gray-800/80 bg-black/70 backdrop-blur-xl px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-lg transition-all duration-200" aria-label="返回">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">知识图谱</h1>
            <p className="text-xs text-gray-500 mt-0.5">ECharts 图谱分析视图</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Network className="w-5 h-5 text-blue-400" />
          <span className="text-sm">知识图谱可视化</span>
        </div>
      </header>
      <main className="p-6">
        <div className="max-w-7xl mx-auto">{content}</div>
      </main>
    </div>
  )
}
