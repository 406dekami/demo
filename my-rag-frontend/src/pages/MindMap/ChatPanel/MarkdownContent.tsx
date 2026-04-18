import {type FC} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import retypeRaw from 'rehype-raw'
import {useTheme} from '@/hooks/useTheme'

interface MarkdownContentProps {
  content: string
}

export const MarkdownContent: FC<MarkdownContentProps> = ({ content }) => {
  const { isDark } = useTheme()
  return (
    <div className={`markdown-content text-sm leading-relaxed space-y-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[retypeRaw]}
        components={{
          h1: (props) => <h1 className={`text-lg font-bold mb-3 mt-5 ${isDark ? 'text-white' : 'text-slate-900'}`} {...props} />,
          h2: (props) => <h2 className={`text-base font-semibold mb-2 mt-4 ${isDark ? 'text-white' : 'text-slate-900'}`} {...props} />,
          h3: (props) => <h3 className={`text-sm font-semibold mb-1 mt-3 ${isDark ? 'text-white' : 'text-slate-900'}`} {...props} />,
          strong: (props) => <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`} {...props} />,
          em: (props) => <em className={`italic ${isDark ? 'text-gray-300' : 'text-slate-700'}`} {...props} />,
          
          ul: (props) => <ul className={`list-disc list-inside space-y-2 ml-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`} {...props} />,
          ol: (props) => <ol className={`list-decimal list-inside space-y-2 ml-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`} {...props} />,
          li: (props) => <li className="pl-1 flex items-start gap-2" {...props} />,
          
          p: (props) => <p className="mb-4 leading-relaxed whitespace-pre-wrap break-words" {...props} />,
          
          code: (props) => <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-gray-700/50 text-indigo-300' : 'bg-slate-200 text-indigo-600'}`} {...props} />,
          pre: (props) => <pre className={`p-3 rounded-lg overflow-x-auto my-3 border ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-slate-100 border-slate-300'}`} {...props} />,
          
          blockquote: (props) => <blockquote className={`border-l-4 pl-4 italic my-3 py-2 rounded-r ${isDark ? 'border-indigo-500 text-gray-400 bg-gray-800/30' : 'border-indigo-500 text-slate-600 bg-slate-50'}`} {...props} />,
          
          table: (props) => <table className={`w-full border-collapse my-4 text-sm rounded-lg overflow-hidden ${isDark ? 'text-gray-300 bg-gray-800/50' : 'text-slate-700 bg-slate-50'}`} {...props} />,
          thead: (props) => <thead className={`${isDark ? 'bg-gray-700/80 text-gray-200' : 'bg-slate-200 text-slate-900'}`} {...props} />,
          tbody: (props) => <tbody {...props} />,
          tr: (props) => <tr className={`border-b hover:bg-opacity-50 transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700/30' : 'border-slate-300 hover:bg-slate-100'}`} {...props} />,
          th: (props) => <th className={`border px-3 py-2 text-left font-semibold whitespace-nowrap ${isDark ? 'border-gray-600' : 'border-slate-300'}`} {...props} />,
          td: (props) => <td className={`border px-3 py-2 whitespace-pre-wrap break-words align-top ${isDark ? 'border-gray-700' : 'border-slate-300'}`} {...props} />,
          
          hr: (props) => <hr className={`my-6 ${isDark ? 'border-gray-700' : 'border-slate-300'}`} {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
