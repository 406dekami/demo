// 模型类型常量
export const FILTER_TYPES = ['All', 'LLM', 'Embedding', 'Rerank', 'TTS', 'ASR', 'VLM', 'MODERATION', 'OCR'] as const

// Tag 映射表
export const TAG_MAP: Record<string, string> = {
  'LLM': 'LLM',
  'TEXT EMBEDDING': 'Embedding',
  'EMBEDDING': 'Embedding',
  'TEXT RE-RANK': 'Rerank',
  'RE-RANK': 'Rerank',
  'RERANK': 'Rerank',
  'TTS': 'TTS',
  'SPEECH2TEXT': 'ASR',
  'ASR': 'ASR',
  'IMAGE2TEXT': 'VLM',
  'VLM': 'VLM',
  'MODERATION': 'MODERATION',
  'OCR': 'OCR',
}

/**
 * 解析 tags
 */
export const parseTags = (tags: unknown): string[] => {
  if (!tags) return []
  if (Array.isArray(tags)) {
    return tags
      .flatMap(t => {
        if (typeof t === 'string' && t.includes(',')) {
          return t.split(',').map(s => s.trim()).filter(Boolean)
        }
        return t
      })
      .filter(Boolean)
  }
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags)
      return Array.isArray(parsed) ? parseTags(parsed) : [tags]
    } catch {
      return tags.split(',').map(t => t.trim()).filter(Boolean)
    }
  }
  return []
}

/**
 * 标准化 tag
 */
export const normalizeTag = (rawTag: string): string | null => {
  const normalized = TAG_MAP[rawTag.trim().toUpperCase()]
  return normalized || null
}
