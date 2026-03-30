import { type FC } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import retypeRaw from 'rehype-raw'

interface MarkdownContentProps {
  content: string
}

export const MarkdownContent: FC<MarkdownContentProps> = ({ content }) => {
  return (
    <div className="markdown-content text-sm text-gray-300 leading-relaxed space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[retypeRaw]}
        components={{
          h1: (props) => <h1 className="text-lg font-bold text-white mb-3 mt-5" {...props} />,
          h2: (props) => <h2 className="text-base font-semibold text-white mb-2 mt-4" {...props} />,
          h3: (props) => <h3 className="text-sm font-semibold text-white mb-1 mt-3" {...props} />,
          strong: (props) => <strong className="font-bold text-white" {...props} />,
          em: (props) => <em className="italic text-gray-300" {...props} />,
          
          ul: (props) => <ul className="list-disc list-inside space-y-2 ml-1 text-gray-300" {...props} />,
          ol: (props) => <ol className="list-decimal list-inside space-y-2 ml-1 text-gray-300" {...props} />,
          li: (props) => <li className="pl-1 flex items-start gap-2" {...props} />,
          
          p: (props) => <p className="mb-4 leading-relaxed whitespace-pre-wrap break-words" {...props} />,
          
          code: (props) => <code className="bg-gray-700/50 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-300" {...props} />,
          pre: (props) => <pre className="bg-gray-800/80 p-3 rounded-lg overflow-x-auto my-3 border border-gray-700" {...props} />,
          
          blockquote: (props) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-400 my-3 bg-gray-800/30 py-2 rounded-r" {...props} />,
          
          table: (props) => <table className="w-full border-collapse my-4 text-sm text-gray-300 bg-gray-800/50 rounded-lg overflow-hidden" {...props} />,
          thead: (props) => <thead className="bg-gray-700/80 text-gray-200" {...props} />,
          tbody: (props) => <tbody {...props} />,
          tr: (props) => <tr className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors" {...props} />,
          th: (props) => <th className="border border-gray-600 px-3 py-2 text-left font-semibold whitespace-nowrap" {...props} />,
          td: (props) => <td className="border border-gray-700 px-3 py-2 whitespace-pre-wrap break-words align-top" {...props} />,
          
          hr: (props) => <hr className="border-gray-700 my-6" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
