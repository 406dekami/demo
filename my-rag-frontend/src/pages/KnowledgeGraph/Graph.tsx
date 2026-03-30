// my-rag-frontend/src/pages/KnowledgeGraph/KnowledgeGraphPage.tsx
import { useState, useEffect, useRef, type FC } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { getKnowledgeGraphData, type GraphNode, type GraphLink } from '@/api/knowledgeGraph'
import { Loader2, AlertTriangle } from 'lucide-react'

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
  categories: { name: string }[]
}

export const KnowledgeGraphPage: FC = () => {
  const chartRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // 加载知识图谱数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getKnowledgeGraphData()
        
        // 如果后端返回的数据缺少 categories，自己生成
        if (!data.categories) {
          console.log('后端返回的数据缺少 categories，自动生成...')
          // 从 nodes 中提取所有不同的 node_type，生成 categories
          const nodeTypes = Array.from(new Set(data.nodes.map(n => n.node_type)))
          
          // 英文到中文的映射
          const typeMap: Record<string, string> = {
            'Course': '课程',
            'Concept': '概念',
            'Principle': '原理',
            'Circuit': '电路',
            'Application': '应用'
          }
          
          data.categories = nodeTypes.map(type => ({ name: typeMap[type] || type }))
          
          // 同时确保每个 node 的 category 字段是数字索引
          data.nodes.forEach(node => {
            if (typeof node.category !== 'number') {
              node.category = nodeTypes.indexOf(node.node_type)
            }
          })
        }
        
        setGraphData(data)
      } catch (err) {
        console.error('加载知识图谱数据失败:', err)
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }

    loadData().catch(console.error)
  }, [])

  // 初始化图表
  useEffect(() => {
    if (!chartRef.current || !graphData) return
    
    // 确保数据完整性
    if (!graphData.nodes || !graphData.links || !graphData.categories) {
      console.error('图谱数据不完整:', graphData)
      return
    }

    // 初始化 ECharts 实例
    chartInstance.current = echarts.init(chartRef.current, undefined, {
      renderer: 'canvas',
      devicePixelRatio: window.devicePixelRatio,
    })

    // 配置项
    const option: EChartsOption = {
      title: {
        text: '知识图谱',
        subtext: '展示知识节点之间的关系',
        top: 'bottom',
        left: 'right',
        textStyle: {
          color: '#666',
          fontSize: 14,
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (params.dataType === 'node') {
            const nodeType = params.data.node_type || '未知'
            const nodeLevel = params.data.level !== undefined ? params.data.level : 'N/A'
            const levelText = typeof nodeLevel === 'number' 
              ? ['课程', '概念', '原理', '电路', '应用'][nodeLevel] || `级别${nodeLevel}`
              : nodeLevel
            
            return `
              <div style="padding: 8px; min-width: 150px;">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${params.name}</div>
                <div style="font-size: 12px; color: #666;">类型：${nodeType}</div>
                <div style="font-size: 12px; color: #666;">级别：${levelText}</div>
                ${params.data.description ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">${params.data.description}</div>` : ''}
              </div>
            `
          }
          return `${params.name}`
        },
      },
      legend: [{
        // selectedMode: 'single',
        data: graphData.categories.map((c) => c.name),
        bottom: 10,
        left: 'center',
        textStyle: {
          color: '#666',
        },
      }],
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: graphData.nodes.map((node) => ({
            ...node,
            symbolSize: node.symbolSize || 30,
            draggable: true,
            value: node.value || 0,
            category: node.category,
          })),
          links: graphData.links.map((link) => ({
            ...link,
            value: link.value || 1,
            lineStyle: {
              curveness: 0.3,
            },
          })),
          categories: graphData.categories,
          roam: true,
          label: {
            show: true,
            position: 'right',
            formatter: '{b}',
            color: '#333',
            fontSize: 12,
          },
          // 线段上的标签（显示关系类型）
          edgeLabel: {
            show: true,
            formatter: (params: any) => {
              const relationType = params.data.value || ''
              // 英文关系类型到中文的映射
              const relationMap: Record<string, string> = {
                'CONTAINS': '包含',
                'PREREQUISITE': '前置',
                'DERIVES': '衍生'
              }
              return relationMap[relationType] || relationType
            },
            fontSize: 10,
            color: '#999',
          },
          lineStyle: {
            color: 'source',
            width: 1.5,
            opacity: 0.7,
            curveness: 0.3,
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 3,
              opacity: 1,
            },
          },
          force: {
            repulsion: 300,
            edgeLength: 100,
            gravity: 0.1,
          },
          // 添加箭头配置
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: 8,
        },
      ],
    }

    chartInstance.current.setOption(option as EChartsOption, true)

    // 响应式调整
    const handleResize = () => {
      chartInstance.current?.resize()
    }

    window.addEventListener('resize', handleResize)

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
  }, [graphData])

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">正在加载知识图谱...</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  // 空数据或数据不完整状态
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0 || !graphData.categories) {
    console.log('知识图谱数据缺少 categories 字段，当前数据结构:', {
      hasNodes: !!graphData?.nodes,
      nodesCount: graphData?.nodes?.length,
      hasLinks: !!graphData?.links,
      linksCount: graphData?.links?.length,
      hasCategories: !!graphData?.categories,
      categoriesCount: graphData?.categories?.length
    })
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">暂无知识图谱数据</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            请先在后台添加知识节点和关系
          </p>
        </div>
      </div>
    )
  }

  // 渲染图表
  return (
    <div
      ref={chartRef}
      className="w-full"
      style={{ height: 'calc(100vh - 120px)', minHeight: '500px' }}
    />
  )
}