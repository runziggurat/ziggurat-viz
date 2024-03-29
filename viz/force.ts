import ForceGraph3D, { ForceGraph3DInstance } from '3d-force-graph'
import { IState, INode, EColorMode } from './core'
import { NAVBAR_HEIGHT } from '../utils/constants'

const TINY_GRAPH_NODES: number = 400

let Graph: ForceGraph3DInstance | null

let maxConnections = 0
let minConnections = 10000
let minBetweenness = 100
let maxBetweenness = 0
let minCloseness = 100
let maxCloseness = 0
let colorMode = EColorMode.Close

export interface IForceNode {
  id: string
  name: string
  ip: string
  city: string
  degreeColor: string
  betweenColor: string
  closeColor: string
}

function updateStats(inode: INode) {
  if (inode.connections.length > maxConnections) {
    maxConnections = inode.connections.length
  }
  if (inode.connections.length < minConnections) {
    minConnections = inode.connections.length
  }
  if (inode.betweenness < minBetweenness) {
    minBetweenness = inode.betweenness
  }
  if (inode.betweenness > maxBetweenness) {
    maxBetweenness = inode.betweenness
  }
  if (inode.closeness < minCloseness) {
    minCloseness = inode.closeness
  }
  if (inode.closeness > maxCloseness) {
    maxCloseness = inode.closeness
  }
}

function colorToString(r: number, g: number, b: number): string {
  let rstr = Math.floor(r * 255).toString(16)
  if (rstr.length < 2) rstr = '0' + rstr
  let gstr = Math.floor(g * 255).toString(16)
  if (gstr.length < 2) gstr = '0' + gstr
  let bstr = Math.floor(b * 255).toString(16)
  if (bstr.length < 2) bstr = '0' + bstr
  let result = '#' + rstr + gstr + bstr
  return result
}

function colorFromNormalizedValue(v: number): string {
  if (v < 0.25) {
    // blue -> cyan
    v = v * 4
    return colorToString(0, v, 1)
  } else if (v < 0.5) {
    // cyan -> green
    v = (v - 0.25) * 4
    return colorToString(0, 1, 1 - v)
  } else if (v < 0.75) {
    // green -> yellow
    v = (v - 0.5) * 4
    return colorToString(v, 1, 0)
  } else {
    // yellow -> red
    v = (v - 0.75) * 4
    return colorToString(1, 1 - v, 0)
  }
}

function cycleColorMode() {
  if (!Graph) return
  colorMode++
  if (colorMode == EColorMode.Last) {
    colorMode = EColorMode.Between
  }
  if (colorMode == EColorMode.Between) {
    Graph.nodeColor(node => (node as any)['betweenColor'])
  } else if (colorMode == EColorMode.Close) {
    Graph.nodeColor(node => (node as any)['closeColor'])
  } else {
    Graph.nodeColor(node => (node as any)['degreeColor'])
  }
}

const onKeydownEvent = (evt: KeyboardEvent) => {
  if (evt.code == 'KeyC') {
    cycleColorMode()
  }
}

export function renderForceGraph(state: IState) {
  const graph = document.getElementById('graph')
  if (!graph) {
    return
  }
  let nodes = new Array()
  let links = new Array()
  let i = 0
  for (let node of state.nodes) {
    updateStats(node)
  }
  let isTiny = state.nodes.length < TINY_GRAPH_NODES
  for (let node of state.nodes) {
    let id = 'id' + i.toString()
    let name = 'node ' + i.toString()
    let ip = node.addr.substring(0, node.addr.indexOf(':'))

    let city = node.geolocation?.city || 'unknown'

    let b =
      (node.betweenness - minBetweenness) / (maxBetweenness - minBetweenness)
    let betweenColor = colorFromNormalizedValue(b)

    let c = (node.closeness - minCloseness) / (maxCloseness - minCloseness)
    let closeColor = colorFromNormalizedValue(c)

    let d =
      (node.connections.length - minConnections) /
      (maxConnections - minConnections)
    let degreeColor = colorFromNormalizedValue(d)

    nodes.push({ id, name, ip, city, degreeColor, betweenColor, closeColor })
    for (let connection of node.connections) {
      let cid = 'id' + connection.toString()
      let link = {
        source: id,
        target: cid,
      }
      links.push(link)
    }
    i++
  }
  const Data = {
    nodes,
    links,
  }

  Graph = ForceGraph3D()(graph)
    .linkVisibility(isTiny)
    .nodeColor(node => (node as any)['closeColor'])
    .nodeLabel(
      node =>
        `${(node as any)['name']}: ${(node as any)['ip']} ${(node as any)['city']
        }`
    )
    .graphData(Data)
  // TODO Only resolve when engine is ready.

  updateSize()
  setColors()
  window.addEventListener('resize', updateSize)
  window.addEventListener('color-scheme-change', setColors)
  window.addEventListener('keydown', onKeydownEvent)

  if (!isTiny && Graph) {
    Graph.onNodeClick(node => {
      if (Graph) {
        Graph.linkVisibility(link => {
          return (link.source as any)['name'] == (node as any)['name']
        })
      }
    })
  }
}

function setColors() {
  const darkColor = '#1a1b1e'
  const lightColor = '#ffff'

  const isLight =
    window.document.documentElement.getAttribute('data-color-scheme') ===
    'light'
  const bg = isLight ? lightColor : darkColor
  // const text = isLight ? darkColor : lightColor

  if (!Graph) return
  Graph.backgroundColor(bg)
}

function updateSize() {
  if (!Graph) return
  Graph.height(window.innerHeight - NAVBAR_HEIGHT).width(window.innerWidth)
}

export function destroyForceGraph() {
  window.removeEventListener('resize', updateSize)
  window.removeEventListener('color-scheme-change', setColors)
  window.removeEventListener('keydown', onKeydownEvent)

  Graph?.pauseAnimation()
  Graph?.resetProps()
  Graph?.graphData({
    nodes: [],
    links: [],
  })
  Graph = null
}
