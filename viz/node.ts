/// <reference path="../node_modules/@webgpu/types/dist/index.d.ts" />

import {
  INode,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  EColorMode,
  ENodeType,
  ENetworkType,
} from './core'
import { mat4, vec3, vec4, vec2 } from 'gl-matrix'
import { idToColor, zoomLogToScale } from './util'
import { PCamera } from './camera'

const COLOR_BLACK: vec4 = vec4.fromValues(0.2, 0.2, 0.2, 1.0)
const MAX_SUBNODE_POSITIONS = 37

// hexagonal placement in concentric rings
const SUBNODE_POSITIONS: vec2[] = [
  // 0th ring, 1 node
  vec2.fromValues(0, 0),

  // 1st ring, 6 nodes
  //    a b
  //   f O c
  //    e d
  vec2.fromValues(-1, 1), // a
  vec2.fromValues(1, 1), // b
  vec2.fromValues(2, 0), // c
  vec2.fromValues(1, -1), // d
  vec2.fromValues(-1, -1), // e
  vec2.fromValues(-2, 0), // f

  // 2nd ring, 12 nodes (a..l)
  //   a b c
  //  l x x d
  // k x c x e
  //  j x x f
  //   i h g
  vec2.fromValues(-2, 2), // a
  vec2.fromValues(0, 2), // b
  vec2.fromValues(2, 2), // c
  vec2.fromValues(3, 1), // d
  vec2.fromValues(4, 0), // e
  vec2.fromValues(3, -1), // f
  vec2.fromValues(2, -2), // g
  vec2.fromValues(0, -2), // h
  vec2.fromValues(-2, -2), // i
  vec2.fromValues(-3, -1), // j
  vec2.fromValues(-4, 0), // k
  vec2.fromValues(-3, 1), // l

  // 3nd ring, 18 nodes (a..r)
  //   a b c d
  //  r a b c e
  // q l x x d f
  //p k x c x e g
  // n j x x f h
  //  n i g h i
  //   m l k j
  vec2.fromValues(-3, 3), // a
  vec2.fromValues(-1, 3), // b
  vec2.fromValues(1, 3), // c
  vec2.fromValues(3, 3), // d
  vec2.fromValues(4, 2), // e
  vec2.fromValues(5, 1), // f
  vec2.fromValues(6, 0), // g
  vec2.fromValues(5, -1), // h
  vec2.fromValues(4, -2), // i
  vec2.fromValues(3, -3), // j
  vec2.fromValues(1, -3), // k
  vec2.fromValues(-1, -3), // l
  vec2.fromValues(-3, -3), // m
  vec2.fromValues(-4, -2), // n
  vec2.fromValues(-5, -1), // o
  vec2.fromValues(-6, 0), // p
  vec2.fromValues(-5, 1), // q
  vec2.fromValues(-4, 2), // r
]

export class CNode {
  public node: INode
  public betweenColor: vec4
  public closeColor: vec4
  public degreeColor: vec4
  public idColor: vec4
  public id: number
  public index: number
  public metadata: vec4
  public position: vec3
  public subnodeOffset: vec3
  public rotation: vec3
  public matWorld: mat4
  public matMV: mat4
  public matMVP: mat4
  public scale: number
  public numConnections: number
  private camera: PCamera
  public nodeType: ENodeType
  public superNode: CNode | null
  public subNodes: CNode[]
  public isOpenedSuper: boolean
  private abstand: number

  public getConnectionPosition(): vec3 {
    if (this.nodeType == ENodeType.Sub && this.superNode) {
      return this.superNode.isOpenedSuper
        ? this.position
        : this.superNode.position
    }
    return this.position
  }

  public setRotationZ(z: number) {
    this.rotation[2] = z
    this.updateMatrix()
  }
  public incRotationY(y: number) {
    this.rotation[1] += y
    this.updateMatrix()
  }
  public setRotationX(x: number) {
    this.rotation[0] = x
    this.updateMatrix()
  }
  public getRotationZ(): number {
    return this.rotation[2]
  }
  public getRotationX(): number {
    return this.rotation[0]
  }

  public getCurrentColor(colorMode: EColorMode): vec4 {
    if (this.nodeType == ENodeType.Super) {
      return this.degreeColor
    }
    if (this.node.network_type == ENetworkType.Unknown) {
      return COLOR_BLACK
    }
    if (colorMode == EColorMode.Between) {
      return this.betweenColor
    } else if (colorMode == EColorMode.Degree) {
      return this.degreeColor
    } else {
      return this.closeColor
    }
  }

  public updateOverlayUniformsGl(proj: mat4, view: mat4) {
    this.updateMatrix()
    mat4.multiply(this.matMV, view, this.matWorld)
    mat4.multiply(this.matMVP, proj, this.matMV)
  }

  public initializePosition(isTiny: boolean) {
    const zScale = 0.4
    let x: number = (this.node.geolocation.coordinates.longitude + 180) / 360
    let y: number = (this.node.geolocation.coordinates.latitude + 90) / 180
    let z: number = 1.0 * zScale
    if (this.node.num_subnodes > 1) {
      isTiny
        ? this.setSubnodeOffsetTiny(this.node.subnode_index)
        : this.setSubnodeOffset(
          this.node.subnode_index,
          this.node.num_subnodes
        )
    }

    let longitude = x - 0.5
    let latitude = y - 0.5
    // normalize and perform Wager VI projection on longitude/x
    // https://en.wikipedia.org/wiki/Wagner_VI_projection
    // shader does inverse
    let transformedX = 0.5 + longitude * Math.sqrt(1 - 3 * latitude * latitude)
    this.setPosition(
      transformedX * WORLD_WIDTH - WORLD_WIDTH / 2,
      y * WORLD_HEIGHT - WORLD_HEIGHT / 2,
      z
    )
  }

  public constructor(
    inode: INode,
    id: number,
    index: number,
    camera: PCamera,
    nodeType: ENodeType,
    superNode: CNode | null,
    abstand: number,
    isTiny: boolean
  ) {
    this.node = inode
    this.id = id
    this.index = index
    this.camera = camera
    this.nodeType = nodeType
    this.numConnections = this.node.connections.length
    let isLocalHost = inode.addr.indexOf('127.0.0.1') >= 0
    this.superNode = superNode
    this.subNodes = new Array()
    this.isOpenedSuper = false
    this.abstand = abstand

    this.metadata = vec4.create()
    this.idColor = idToColor(id)
    this.scale = isLocalHost ? 4 : nodeType == ENodeType.Sub ? 0.7 : 1
    if (isLocalHost) {
      this.node.geolocation.city = 'n/a'
      this.node.geolocation.country = 'localhost'
    }

    this.position = vec3.create()
    this.subnodeOffset = vec3.create()
    this.rotation = vec3.create()
    this.matWorld = mat4.create()
    this.matMV = mat4.create()
    this.matMVP = mat4.create()

    this.betweenColor = COLOR_BLACK
    this.closeColor = COLOR_BLACK
    this.degreeColor = COLOR_BLACK

    // metadata = A-B-C-D
    //   Aggregate connections
    //   Betweenness
    //   Closeness
    //   iD (id, as integer)
    this.metadata[0] = this.numConnections
    this.metadata[1] = inode.betweenness
    this.metadata[2] = inode.closeness
    this.metadata[3] = id

    this.initializePosition(isTiny)
  }

  public setPosition(x: number, y: number, z: number) {
    this.position[0] = x + this.subnodeOffset[0]
    this.position[1] = y + this.subnodeOffset[1]
    this.position[2] = z + this.subnodeOffset[2]
    this.updateMatrix()
  }

  public setSubnodeOffset(index: number, size: number) {
    const edge = Math.ceil(Math.cbrt(size))
    const z = Math.floor(index / edge / edge)
    let remain = index - z * edge * edge
    const y = Math.floor(remain / edge)
    const x = remain % edge
    const width = this.abstand * (edge - 1)
    const offsetX = -width / 2
    const offsetY = -width / 2
    const offsetZ = this.abstand
    this.subnodeOffset = vec3.fromValues(
      offsetX + this.abstand * x,
      offsetY + this.abstand * y,
      offsetZ + this.abstand * z * 1.5
    )
  }

  public setSubnodeOffsetTiny(index: number) {
    let offset = SUBNODE_POSITIONS[index % MAX_SUBNODE_POSITIONS]
    let layer = Math.floor(index / MAX_SUBNODE_POSITIONS)

    // these are for hexagonal positioning
    let scaleX = 0.5
    let scaleY = 0.866

    const offsetX =
      offset[0] * this.abstand * scaleX + (this.abstand * layer) / 2
    const offsetY =
      offset[1] * this.abstand * scaleY + (this.abstand * layer) / 2
    const offsetZ = layer * this.abstand
    this.subnodeOffset = vec3.fromValues(offsetX, offsetY, offsetZ)
  }

  public updateMatrix() {
    let ry = mat4.create()
    let t = mat4.create()
    let scale = this.scale * zoomLogToScale(Math.log(this.camera.z))
    mat4.identity(this.matWorld)
    mat4.scale(
      this.matWorld,
      this.matWorld,
      vec3.fromValues(scale, scale, scale)
    )
    mat4.fromYRotation(ry, this.rotation[1])
    mat4.multiply(this.matWorld, ry, this.matWorld)
    mat4.fromTranslation(t, this.position)
    mat4.multiply(this.matWorld, t, this.matWorld)
    mat4.multiply(this.matMV, this.camera.matView, this.matWorld)
    mat4.multiply(this.matMVP, this.camera.matProjection, this.matMV)
  }
}
