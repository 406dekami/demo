// 模型类型常量
export const LlmModelType = {
  Chat: 'chat',
  Image2text: 'image2text',
  Embedding: 'embedding',
  Speech2text: 'speech2text',
  Rerank: 'rerank',
  TTS: 'tts'
} as const

export type LlmModelType = typeof LlmModelType[keyof typeof LlmModelType]
