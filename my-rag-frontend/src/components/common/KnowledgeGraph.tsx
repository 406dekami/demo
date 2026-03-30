import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Loader2, Network, ArrowLeft } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  category: number;
  size?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
  value?: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  categories: Array<{ name: string }>;
}

interface KnowledgeGraphProps {
  notebookId?: string;
  knowledgeBaseId?: string;
  height?: string;
  onNodeClick?: (node: GraphNode) => void;
  asPage?: boolean; // 是否作为独立页面显示
  onClose?: () => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  notebookId,
  knowledgeBaseId,
  height = '500px',
  onNodeClick,
  asPage = false,
  onClose
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const initChart = async () => {
      setLoading(true);
      setError(null);

      try {
        // 确定 API 端点
        let apiUrl = '';
        if (notebookId) {
          apiUrl = `/api/v1/graph/notebook/${notebookId}?depth=3`;
        } else if (knowledgeBaseId) {
          apiUrl = `/api/v1/graph/knowledge-base/${knowledgeBaseId}/graph`;
        } else {
          setError('请指定 notebookId 或 knowledgeBaseId');
          setLoading(false);
          return;
        }

        // 获取图谱数据
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data: GraphData = await response.json();

        // 初始化 ECharts
        if (!chartRef.current) return;
        const chart = echarts.init(chartRef.current, 'dark', {
          renderer: 'canvas'
        });

        // 配置项
        const option: echarts.EChartsOption = {
          backgroundColor: 'transparent',
          title: {
            text: notebookId ? '笔记本知识图谱' : '知识库图谱',
            subtext: notebookId || knowledgeBaseId,
            top: 20,
            left: 20,
            textStyle: {
              color: '#fff',
              fontSize: 18,
              fontWeight: 'bold'
            },
            subtextStyle: {
              color: '#999',
              fontSize: 12
            }
          },
          tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(31, 41, 55, 0.9)',
            borderColor: '#374151',
            textStyle: {
              color: '#fff'
            },
            formatter: (params: any) => {
              if ((params as any).dataType === 'node') {
                const data = (params as any).data as GraphNode;
                return `
                  <div style="padding: 12px;">
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">${data.label}</div>
                    <div style="font-size: 13px; color: #9ca3af;">类型：${data.type}</div>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">ID: ${data.id}</div>
                  </div>
                `;
              } else {
                return `<div style="padding: 8px;">${(params as any).name}<br/><span style="color: #9ca3af;">关系：${(params as any).data?.type || ''}</span></div>`;
              }
            }
          },
          legend: [{
            data: data.categories.map(c => c.name),
            orient: 'horizontal',
            right: 20,
            top: 20,
            textStyle: {
              color: '#e5e7eb',
              fontSize: 13
            },
            itemGap: 20,
            itemWidth: 20,
            itemHeight: 20
          }],
          series: [{
            type: 'graph',
            layout: 'force',
            data: data.nodes.map(node => ({
              id: node.id,
              name: node.label,
              symbolSize: node.size || 20,
              category: node.category,
              value: node.type,
              draggable: true,
              itemStyle: {
                shadowBlur: 15,
                shadowColor: 'rgba(59, 130, 246, 0.5)',
                borderType: 'solid',
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.3)'
              }
            })),
            links: data.links.map(link => ({
              source: link.source,
              target: link.target,
              value: 1,
              lineStyle: {
                width: 2,
                curves: 0.2
              }
            })),
            categories: data.categories,
            roam: true,
            label: {
              show: true,
              position: 'right',
              formatter: '{b}',
              fontSize: 13,
              color: '#e5e7eb',
              textShadowBlur: 2,
              textShadowColor: 'rgba(0, 0, 0, 0.5)'
            },
            force: {
              repulsion: 800,
              edgeLength: [150, 250],
              gravity: 0.08
            },
            lineStyle: {
              color: 'source',
              width: 2,
              curveness: 0.3,
              opacity: 0.7
            },
            emphasis: {
              focus: 'adjacency',
              lineStyle: {
                width: 5,
                opacity: 1
              },
              itemStyle: {
                shadowBlur: 20,
                shadowColor: 'rgba(147, 51, 234, 0.8)'
              }
            }
          }]
        };

        chart.setOption(option);

        // 点击事件
        chart.on('click', (params: any) => {
          if ((params as any).dataType === 'node' && onNodeClick) {
            onNodeClick((params as any).data as GraphNode);
          }
        });

        // 响应式调整
        const handleResize = () => {
          chart.resize();
        };
        window.addEventListener('resize', handleResize);

        setLoading(false);

        // 清理函数
        return () => {
          window.removeEventListener('resize', handleResize);
          chart.dispose();
        };

      } catch (err) {
        console.error('加载图谱失败:', err);
        setError(err instanceof Error ? err.message : '加载失败');
        setLoading(false);
      }
    };

    initChart();
  }, [notebookId, knowledgeBaseId, onNodeClick]);

  if (asPage) {
    // 独立页面模式
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 font-roboto">
        {/* Header */}
        <header className="sticky top-0 z-20 h-16 border-b border-gray-800/80 bg-black/70 backdrop-blur-xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-label="返回"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="font-gs text-xl font-semibold text-white tracking-tight">
                {notebookId ? '笔记本知识图谱' : '知识库图谱'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {notebookId || knowledgeBaseId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-400">
              <Network className="w-5 h-5 text-blue-400" />
              <span className="text-sm">知识图谱可视化</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div 
              className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden"
              style={{ height: 'calc(100vh - 180px)', minHeight: '600px' }}
            >
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
              
              <div 
                ref={chartRef} 
                className="w-full h-full"
              />
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // 内嵌卡片模式
  return (
    <div 
      className="relative w-full rounded-2xl overflow-hidden bg-gray-800/30 backdrop-blur-sm border border-gray-700/50" 
      style={{ height: height || '500px' }}>
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
      
      <div 
        ref={chartRef} 
        className="w-full"
        style={{ height: height || '500px' }}
      />
    </div>
  );
};
