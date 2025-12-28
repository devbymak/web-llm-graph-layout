import { memo } from 'react'
import {
  EdgeProps,
  useNodes,
  getSmoothStepPath,
  BaseEdge,
} from 'reactflow'
import {
  findBlockingNodes,
  findRoutingWaypoints,
  generateSmoothRoutedPath,
  Point,
} from '../services/edgeRouting'

const RoutedEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  markerStart,
}: EdgeProps) => {
  const nodes = useNodes()

  const sourcePoint: Point = { x: sourceX, y: sourceY }
  const targetPoint: Point = { x: targetX, y: targetY }

  const blockingNodes = findBlockingNodes(
    sourcePoint,
    targetPoint,
    nodes,
    source,
    target
  )

  if (blockingNodes.length === 0) {
    const [edgePath] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 8,
    })

    return (
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
    )
  }

  const waypoints = findRoutingWaypoints(sourcePoint, targetPoint, blockingNodes)
  const customPath = generateSmoothRoutedPath(
    sourceX,
    sourceY,
    targetX,
    targetY,
    waypoints,
    8
  )

  return (
    <BaseEdge
      id={id}
      path={customPath}
      style={style}
      markerEnd={markerEnd}
      markerStart={markerStart}
    />
  )
}

export default memo(RoutedEdge)

