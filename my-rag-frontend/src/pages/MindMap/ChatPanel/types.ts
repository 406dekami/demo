export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  title: string
  nodeId: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

export interface ChatPanelProps {
  node: any
  onToggleCollapse: () => void
  isCollapsed: boolean
  parentTitle?: string
}
