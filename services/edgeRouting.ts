import { Node } from 'reactflow'

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

const NODE_PADDING = 20
const DEFAULT_NODE_WIDTH = 140
const DEFAULT_NODE_HEIGHT = 60

export const getNodeBounds = (node: Node): Rect => {
  const width = node.width ?? DEFAULT_NODE_WIDTH
  const height = node.height ?? DEFAULT_NODE_HEIGHT
  
  return {
    x: node.position.x - NODE_PADDING,
    y: node.position.y - NODE_PADDING,
    width: width + NODE_PADDING * 2,
    height: height + NODE_PADDING * 2,
  }
}

const lineIntersectsRect = (
  p1: Point,
  p2: Point,
  rect: Rect
): boolean => {
  const left = rect.x
  const right = rect.x + rect.width
  const top = rect.y
  const bottom = rect.y + rect.height

  const lineIntersectsSegment = (
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number,
    x4: number, y4: number
  ): boolean => {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
    if (Math.abs(denom) < 0.0001) return false

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1
  }

  return (
    lineIntersectsSegment(p1.x, p1.y, p2.x, p2.y, left, top, right, top) ||
    lineIntersectsSegment(p1.x, p1.y, p2.x, p2.y, right, top, right, bottom) ||
    lineIntersectsSegment(p1.x, p1.y, p2.x, p2.y, left, bottom, right, bottom) ||
    lineIntersectsSegment(p1.x, p1.y, p2.x, p2.y, left, top, left, bottom)
  )
}

const pointInRect = (point: Point, rect: Rect): boolean => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

export const findBlockingNodes = (
  sourcePoint: Point,
  targetPoint: Point,
  nodes: Node[],
  sourceId: string,
  targetId: string
): Node[] => {
  return nodes.filter(node => {
    if (node.id === sourceId || node.id === targetId) return false
    
    const bounds = getNodeBounds(node)
    
    if (pointInRect(sourcePoint, bounds) || pointInRect(targetPoint, bounds)) {
      return false
    }
    
    return lineIntersectsRect(sourcePoint, targetPoint, bounds)
  })
}

const getRouteDirection = (
  source: Point,
  target: Point,
  blocker: Rect
): 'above' | 'below' | 'left' | 'right' => {
  const blockerCenterX = blocker.x + blocker.width / 2
  const blockerCenterY = blocker.y + blocker.height / 2
  
  const dx = Math.abs(target.x - source.x)
  const dy = Math.abs(target.y - source.y)
  
  if (dx > dy) {
    const midY = (source.y + target.y) / 2
    return midY < blockerCenterY ? 'above' : 'below'
  } else {
    const midX = (source.x + target.x) / 2
    return midX < blockerCenterX ? 'left' : 'right'
  }
}

export const findRoutingWaypoints = (
  sourcePoint: Point,
  targetPoint: Point,
  blockingNodes: Node[]
): Point[] => {
  if (blockingNodes.length === 0) return []
  
  const waypoints: Point[] = []
  
  const sortedBlockers = [...blockingNodes].sort((a, b) => {
    const distA = Math.hypot(a.position.x - sourcePoint.x, a.position.y - sourcePoint.y)
    const distB = Math.hypot(b.position.x - sourcePoint.x, b.position.y - sourcePoint.y)
    return distA - distB
  })
  
  for (const blocker of sortedBlockers) {
    const bounds = getNodeBounds(blocker)
    const direction = getRouteDirection(sourcePoint, targetPoint, bounds)
    
    const ROUTE_OFFSET = 30
    
    switch (direction) {
      case 'above': {
        const routeY = bounds.y - ROUTE_OFFSET
        waypoints.push({ x: sourcePoint.x, y: routeY })
        waypoints.push({ x: targetPoint.x, y: routeY })
        break
      }
      case 'below': {
        const routeY = bounds.y + bounds.height + ROUTE_OFFSET
        waypoints.push({ x: sourcePoint.x, y: routeY })
        waypoints.push({ x: targetPoint.x, y: routeY })
        break
      }
      case 'left': {
        const routeX = bounds.x - ROUTE_OFFSET
        waypoints.push({ x: routeX, y: sourcePoint.y })
        waypoints.push({ x: routeX, y: targetPoint.y })
        break
      }
      case 'right': {
        const routeX = bounds.x + bounds.width + ROUTE_OFFSET
        waypoints.push({ x: routeX, y: sourcePoint.y })
        waypoints.push({ x: routeX, y: targetPoint.y })
        break
      }
    }
    
    break
  }
  
  return waypoints
}

export const generateRoutedPath = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  waypoints: Point[]
): string => {
  if (waypoints.length === 0) {
    return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
  }
  
  let path = `M ${sourceX} ${sourceY}`
  
  for (const wp of waypoints) {
    path += ` L ${wp.x} ${wp.y}`
  }
  
  path += ` L ${targetX} ${targetY}`
  
  return path
}

export const generateSmoothRoutedPath = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  waypoints: Point[],
  borderRadius: number = 8
): string => {
  const allPoints: Point[] = [
    { x: sourceX, y: sourceY },
    ...waypoints,
    { x: targetX, y: targetY },
  ]
  
  if (allPoints.length < 2) {
    return `M ${sourceX} ${sourceY}`
  }
  
  if (allPoints.length === 2) {
    return `M ${allPoints[0].x} ${allPoints[0].y} L ${allPoints[1].x} ${allPoints[1].y}`
  }
  
  let path = `M ${allPoints[0].x} ${allPoints[0].y}`
  
  for (let i = 1; i < allPoints.length - 1; i++) {
    const prev = allPoints[i - 1]
    const curr = allPoints[i]
    const next = allPoints[i + 1]
    
    const toPrev = { x: prev.x - curr.x, y: prev.y - curr.y }
    const toNext = { x: next.x - curr.x, y: next.y - curr.y }
    
    const lenPrev = Math.hypot(toPrev.x, toPrev.y)
    const lenNext = Math.hypot(toNext.x, toNext.y)
    
    const radius = Math.min(borderRadius, lenPrev / 2, lenNext / 2)
    
    const startX = curr.x + (toPrev.x / lenPrev) * radius
    const startY = curr.y + (toPrev.y / lenPrev) * radius
    const endX = curr.x + (toNext.x / lenNext) * radius
    const endY = curr.y + (toNext.y / lenNext) * radius
    
    path += ` L ${startX} ${startY}`
    path += ` Q ${curr.x} ${curr.y} ${endX} ${endY}`
  }
  
  const last = allPoints[allPoints.length - 1]
  path += ` L ${last.x} ${last.y}`
  
  return path
}

