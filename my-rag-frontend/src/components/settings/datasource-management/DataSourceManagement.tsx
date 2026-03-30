// DataSourceManagement.tsx
import {type FC } from 'react'

interface DataSource {
  id: string
  name: string
  description: string
  icon: string
  category: 'cloud' | 'collaboration' | 'communication' | 'storage' | 'email' | 'project'
  connected?: boolean
}

const DATA_SOURCES: DataSource[] = [
  {
    id: 'confluence',
    name: 'Confluence',
    description: '连接你的 Confluence 工作区以搜索文档内容。',
    icon: '📘',
    category: 'collaboration',
  },
  {
    id: 's3',
    name: 'S3',
    description: '连接你的 AWS S3 存储桶以导入和同步文件。',
    icon: '🪣',
    category: 'storage',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: '同步 Notion 页面与数据库，用于知识检索。',
    icon: '📝',
    category: 'collaboration',
  },
  {
    id: 'discord',
    name: 'Discord',
    description: '连接你的 Discord 服务器以访问和分析聊天数据。',
    icon: '👾',
    category: 'communication',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: '通过 OAuth 连接 Google Drive，并同步指定的文件夹或云端硬盘。',
    icon: '📁',
    category: 'storage',
  },
  {
    id: 'moodle',
    name: 'Moodle',
    description: 'Connect to your Moodle LMS to sync course content, forums, and resources.',
    icon: '🎓',
    category: 'collaboration',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: '通过 OAuth 连接 Gmail，用于同步邮件。',
    icon: '📧',
    category: 'email',
  },
  {
    id: 'jira',
    name: 'Jira',
    description: '接入 Jira 工作区，持续同步 Issues、评论与附件。',
    icon: '📋',
    category: 'project',
  },
]

export const DataSourceManagement: FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-gs text-2xl font-semibold dark:text-white text-gray-900 mb-2">数据源</h2>
        <p className="dark:text-gray-400 text-gray-600 text-sm">管理您的数据源和连接</p>
      </div>

      {/* 空状态提示 */}
      <div className="text-center py-16">
        <p className="dark:text-gray-400 text-gray-600 text-sm">暂未添加任何数据源，请从下方选择一个进行连接。</p>
      </div>

      {/* 可用数据源 */}
      <div>
        <h3 className="font-gs text-xl font-semibold dark:text-white text-gray-900 mb-4">可用数据源</h3>
        <p className="dark:text-gray-400 text-gray-600 text-sm mb-6">选择要添加的数据源</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DATA_SOURCES.map((source) => (
            <div
              key={source.id}
              className="group dark:bg-gray-800/30 bg-gray-100 backdrop-blur-sm dark:border-gray-700/50 border-gray-200 rounded-xl p-5 dark:hover:border-blue-500/50 hover:border-blue-500 dark:hover:bg-gray-800/50 hover:bg-gray-50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{source.icon}</div>
                <div className="flex-1">
                  <h4 className="font-gs font-medium dark:text-white text-gray-900 dark:group-hover:text-blue-400 group-hover:text-blue-600 transition-colors duration-200">
                    {source.name}
                  </h4>
                  <p className="text-sm dark:text-gray-400 text-gray-600 mt-1.5 leading-relaxed">
                    {source.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
