import type { MindMapNode } from '@/api/mindMap'

export type Node = MindMapNode

export type LayoutNode = {
  node: Node
  x: number
  y: number
  width: number
  titleWidth: number
  depth: number
  active: boolean
  inPath: boolean
  done: boolean
  children: LayoutNode[]
}

export type Edge = {
  id: string
  path: string
  active: boolean
}

export type TooltipState = { x: number; y: number; node: Node } | null

export const BOX = 18
export const BOX_GAP = 14
export const NODE_H = 38
export const LEAF_GAP = 84
const LEVEL_GAP = 120
const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#c084fc']
const textMeasureCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
const textMeasureContext = textMeasureCanvas?.getContext('2d') ?? null

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const colorOf = (level = 0) => COLORS[level] || COLORS[COLORS.length - 1]
export const fontSizeOf = (depth: number) => Math.max(12, 16 - depth)

export const titleWidthOf = (node: Node, depth: number) => {
  const fontSize = fontSizeOf(depth)
  const fontWeight = depth === 0 ? 700 : 600
  const min = depth === 0 ? 240 : 148
  const max = depth === 0 ? 520 : 460

  if (textMeasureContext) {
    textMeasureContext.font = `${fontWeight} ${fontSize}px sans-serif`
    const measured = Math.ceil(textMeasureContext.measureText(node.title).width) + 34
    return clamp(measured, min, max)
  }

  const estimated = Math.ceil(node.title.length * fontSize * 1.05) + 56
  return clamp(estimated, min, max)
}

export const findNode = (node: Node | null, id: string): Node | null => {
  if (!node) return null
  if (node.id === id) return node
  for (const child of node.children || []) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

export const findPath = (node: Node | null, id: string): Node[] => {
  if (!node) return []
  if (node.id === id) return [node]
  for (const child of node.children || []) {
    const childPath = findPath(child, id)
    if (childPath.length) return [node, ...childPath]
  }
  return []
}

export const layoutTree = (
  node: Node,
  collapsedIds: Set<string>,
  selectedId: string | null,
  pathIds: Set<string>,
  doneIds: Set<string>,
  depth = 0,
  x = 0,
  cursor = { y: 0 }
): LayoutNode => {
  const titleWidth = titleWidthOf(node, depth)
  const width = BOX + BOX_GAP + titleWidth
  const nextX = x + width + LEVEL_GAP
  const visibleChildren = collapsedIds.has(node.id) ? [] : (node.children || [])
  const children = visibleChildren.map((child) =>
    layoutTree(child, collapsedIds, selectedId, pathIds, doneIds, depth + 1, nextX, cursor)
  )
  const y = children.length
    ? (children[0].y + children[children.length - 1].y) / 2
    : (() => {
        const current = cursor.y
        cursor.y += LEAF_GAP
        return current
      })()

  return {
    node,
    x,
    y,
    width,
    titleWidth,
    depth,
    active: node.id === selectedId,
    inPath: pathIds.has(node.id),
    done: doneIds.has(node.id),
    children,
  }
}

export const flattenNodes = (root: LayoutNode): LayoutNode[] => [root, ...root.children.flatMap(flattenNodes)]

export const buildEdges = (root: LayoutNode): Edge[] =>
  root.children.flatMap((child) => {
    const startX = root.x + root.width + 18
    const endX = child.x + BOX / 2
    const room = Math.max(36, endX - startX)
    const branchX = startX + Math.min(64, Math.max(30, room * 0.35))
    return [
      {
        id: `${root.node.id}-${child.node.id}`,
        active: root.inPath && child.inPath,
        path: `M ${startX} ${root.y} H ${branchX} V ${child.y} H ${endX}`,
      },
      ...buildEdges(child),
    ]
  })

export const getBounds = (nodes: LayoutNode[]) => ({
  width: Math.max(...nodes.map((node) => node.x + node.width), 0) + 220,
  height: Math.max(...nodes.map((node) => node.y), 0) + 180,
})
