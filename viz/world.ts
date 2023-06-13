import {
  IState,
  EShader,
  INode,
  EColorMode,
  ENodeType,
  IGeolocation,
  NODE_INFO_ID,
  GRADIENT_INFO_ID,
  COLOR_MODE_ID,
  IP_ID,
  NETWORK_TYPE_ID,
  BETWEENNESS_ID,
  CLOSENESS_ID,
  CONNECTIONS_ID,
  LATITUDE_ID,
  LONGITUDE_ID,
  CITY_ID,
  COUNTRY_ID,
  NUM_SUBNODES_ID,
  KEYMAPS_INFO_ID,
  STATS_INFO_ID,
} from './core'
import { CNode } from './node'
import { vec3, vec4 } from 'gl-matrix'
import { icosaGeometry } from './geo-icosa'
import { gradientGeometry } from './geo-gradient'
import { histogramGeometry } from './geo-histogram'
import { cubeGeometry } from './geo-cube'
import { lineGeometry } from './geo-line'
import { CPicker } from './picker'
import { CGroup } from './group'
import { PCamera } from './camera'
import { initWorldMap } from './worldmap'
import { glShaders } from './shaders'
import { createRandomTexture, loadTexture } from './util'
import { getHistogramTexture } from './histogram'
import { element } from '../utils/dom'

const NODE_TRANSFORM_SIZE: number = 28
const CONNECTION_TRANSFORM_SIZE: number = 12
const MAX_SUPERNODE_SCALE: number = 2.0
const MIN_SUPERNODE_SCALE: number = 0.5
const BEHIND_CAMERA_DISTANCE: number = 1000000
const TINY_GRAPH_NODES: number = 500
const COLOR_MAGENTA: vec4 = vec4.fromValues(0.9, 0.0, 0.9, 1.0)
const COLOR_BLACK: vec4 = vec4.fromValues(0.2, 0.2, 0.2, 1.0)
const COLOR_YELLOW: vec4 = vec4.fromValues(0.9, 0.9, 0.0, 1.0)
const SUBNODE_DISTANCE: number = 2.9

export class CWorld {
  public state: IState
  public nodes: CNode[] = new Array()
  public singleNodes: CNode[] = new Array()
  public superMap: Map<string, CNode> = new Map()
  public superNodes: CNode[] = new Array()
  public gl: WebGL2RenderingContext
  private noiseTexture: WebGLTexture | null = null
  private worldMapTexture: WebGLTexture | null = null
  private gradientTexture: WebGLTexture | null = null
  private histogramBTexture: WebGLTexture | null = null
  private histogramCTexture: WebGLTexture | null = null
  private histogramDTexture: WebGLTexture | null = null
  private currentHistogramTexture: WebGLTexture | null = null
  private picker: CPicker

  private icosaGeometry: WebGLBuffer | null = null
  private cubeGeometry: WebGLBuffer | null = null
  private gradientGeometry: WebGLBuffer | null = null
  private histogramGeometry: WebGLBuffer | null = null
  private worldMapGeometry: WebGLBuffer | null = null
  private lineGeometry: WebGLBuffer | null = null

  private mainSingleGroup: CGroup = new CGroup()
  private mainSuperGroup: CGroup = new CGroup()
  private mainSubGroup: CGroup = new CGroup()

  private pickerSingleGroup: CGroup = new CGroup()
  private pickerSuperGroup: CGroup = new CGroup()
  private pickerSubGroup: CGroup = new CGroup()

  private connectionBuffer: WebGLBuffer | null = null
  private selectedSuperNode: CNode | null = null
  private connectionData: Float32Array = new Float32Array(4)
  private worldMapVao: WebGLVertexArrayObject | null = null
  private gradientVao: WebGLVertexArrayObject | null = null
  private histogramVao: WebGLVertexArrayObject | null = null
  private connectionVao: WebGLVertexArrayObject | null = null
  public icosaVPLoc: WebGLUniformLocation | null = null
  public worldMapVPLoc: WebGLUniformLocation | null = null
  public connectionVPLoc: WebGLUniformLocation | null = null
  public paramsLoc: WebGLUniformLocation | null = null
  public noiseTextureLoc: WebGLUniformLocation | null = null
  public worldMapTextureLoc: WebGLUniformLocation | null = null
  public gradientTextureLoc: WebGLUniformLocation | null = null
  public pickerVPLoc: WebGLUniformLocation | null = null
  public pickerParamsLoc: WebGLUniformLocation | null = null
  public pickerNoiseTextureLoc: WebGLUniformLocation | null = null
  private startTime: number = Date.now()
  private params: vec4 = vec4.create()
  private selectedNode: CNode | null = null
  private white: vec4 = vec4.fromValues(1, 1, 1, 1)
  private maxConnections: number = 0
  private numConnections: number = 0
  private minConnections: number = 10000
  private maxSubnodes: number = 0
  private numConnectionsToDraw: number = 0
  private _displayAllConnections: boolean = false
  private _displayKeymaps: boolean = true
  private _displayStats: boolean = true
  private _displayGradient: boolean = true
  public displayHistogram: boolean = false
  private minBetweenness: number = 100
  private maxBetweenness: number = 0
  private minCloseness: number = 100
  private maxCloseness: number = 0
  public colorMode: EColorMode = EColorMode.Degree
  private canvas: HTMLCanvasElement
  private camera: PCamera

  public initialized: boolean = false
  public isTiny: boolean = false

  public get displayAllConnections(): boolean {
    return this._displayAllConnections
  }
  public set displayAllConnections(value: boolean) {
    if (!this.isTiny && value) {
      return
    }
    this._displayAllConnections = value
    this.updateConnectionsData()
  }
  public get displayKeymaps(): boolean {
    return this._displayKeymaps
  }
  public set displayKeymaps(value: boolean) {
    this._displayKeymaps = value
    element(KEYMAPS_INFO_ID).setStyle('visibility', value ? 'visible' : 'hidden')
  }
  public get displayGradient(): boolean {
    return this._displayGradient
  }
  public set displayGradient(value: boolean) {
    this._displayGradient = value
    element(GRADIENT_INFO_ID).setStyle('visibility', value ? 'visible' : 'hidden')
  }
  public get displayStats(): boolean {
    return this._displayStats
  }
  public set displayStats(value: boolean) {
    this._displayStats = value
    element(STATS_INFO_ID).setStyle('visibility', value ? 'visible' : 'hidden')
  }


  public constructor(
    state: IState,
    gl: WebGL2RenderingContext,
    canvas: HTMLCanvasElement,
    camera: PCamera
  ) {
    this.state = state
    this.canvas = canvas
    this.camera = camera
    this.gl = gl
    this.picker = new CPicker(gl)
  }

  public async initialize() {
    this.initNodes()
    this.updateNodeColors()
    this.updateColorDisplay()
    this.setAuxColors()
    await this.initTexturesGl()
    this.initNodesGl()
    this.initPickerGl()
    this.initWorldMapGl()
    this.initConnectionsGl()
    this.initGradientGl()
    this.initHistogramGl()
  }

  private updateNodeColors() {
    let n: number = 0
    for (let node of this.singleNodes) {
      this.mainSingleGroup.transformData?.set(
        node.getCurrentColor(this.colorMode),
        n
      )
      n += NODE_TRANSFORM_SIZE
    }
    n = 0
    if (this.selectedSuperNode && this.selectedSuperNode.isOpenedSuper) {
      // TODO fix Uncaught RangeError: offset is out of bounds at Float32Array.set(<anonymous>)
      // for (let node of this.selectedSuperNode.subNodes) {
      //   this.mainSingleGroup.transformData?.set(
      //     node.getCurrentColor(this.colorMode),
      //     n
      //   )
      //   n += NODE_TRANSFORM_SIZE
      // }
    }
  }

  private formatGradientText(
    name: string,
    min: number | string,
    max: number | string
  ) {
    return 'MIN: ' + min + ` ------- ${name.toUpperCase()} ------ MAX: ` + max
  }

  private updateColorDisplay() {
    let gradientText = ''
    let colorModeText = ''
    switch (this.colorMode) {
      case EColorMode.Between:
        colorModeText = 'betweenness'
        gradientText = this.formatGradientText(
          'betweenness',
          this.minBetweenness.toFixed(4),
          this.maxBetweenness.toFixed(4)
        )
        this.currentHistogramTexture = this.histogramBTexture
        break
      case EColorMode.Close:
        colorModeText = 'closeness'
        gradientText = this.formatGradientText(
          'closeness',
          this.minCloseness.toFixed(4),
          this.maxCloseness.toFixed(4)
        )
        this.currentHistogramTexture = this.histogramCTexture
        break
      case EColorMode.Degree:
        colorModeText = 'degree'
        gradientText = this.formatGradientText(
          'degree',
          this.minConnections,
          this.maxConnections
        )
        this.currentHistogramTexture = this.histogramDTexture
        break
    }
    element(GRADIENT_INFO_ID)
      .setStyle('visibility', this.displayGradient ? 'visible' : 'hidden')
      .setText(gradientText)
    element(COLOR_MODE_ID).setText(colorModeText)
  }

  public cycleColorMode() {
    this.colorMode++
    if (this.colorMode == EColorMode.Last) {
      this.colorMode = EColorMode.Between
    }
    this.updateColorDisplay()
    this.updateNodeColors()
  }

  private getNode(id: number): CNode | null {
    if (id < this.state.nodes.length) {
      return this.nodes[id] || null
    } else {
      return this.superNodes[id - this.state.nodes.length] || null
    }
  }

  public update() {
    if (!this.mainSingleGroup) {
      return
    }
    for (let node of this.nodes) {
      if (node.node.ignore) continue
      node.incRotationY((((2 * Math.PI) / 180) * node.numConnections) / 2400)
      node.updateMatrix()
    }
    for (let node of this.superNodes) {
      node.incRotationY(
        ((2 * Math.PI) / 180) * (0.36 + node.node.num_subnodes / 2400)
      )
      node.updateMatrix()
    }
    this.updateSingleNodeData()
    this.updateSuperNodeData()
    this.updateSubNodeData()
    this.updatePickerData()
  }

  private maybeOpenSuperNode(node: CNode | null) {
    if (
      this.selectedSuperNode &&
      this.selectedSuperNode !== node &&
      node?.superNode !== this.selectedSuperNode
    ) {
      // close the previously opened super node
      if (this.selectedSuperNode.isOpenedSuper) {
        this.selectedSuperNode.isOpenedSuper = false
        this.selectedSuperNode.position[2] -= BEHIND_CAMERA_DISTANCE
      }
      this.selectedSuperNode = null
    }

    if (!node || node.nodeType !== ENodeType.Super) {
      return
    }

    if (!this.selectedSuperNode || node.isOpenedSuper) {
      this.selectedSuperNode = node
      return
    }

    // open up the super node
    node.isOpenedSuper = true
    this.selectedSuperNode.position[2] += BEHIND_CAMERA_DISTANCE
    this.updateNodeColors()
    let n = 0
    for (let subnode of node.subNodes) {
      let td = this.mainSubGroup.transformData
      td?.set(subnode.getCurrentColor(this.colorMode), n)
      td?.set(subnode.metadata, n + 4)
      td?.set(subnode.idColor, n + 8)
      td?.set(subnode.matWorld, n + 12)
      n += NODE_TRANSFORM_SIZE
    }
  }

  private setNodeInfo(node: CNode) {
    let ip =
      node.nodeType != ENodeType.Super
        ? 'IP: ' + node.node.addr
        : `Super Node: ${node.subNodes.length} nodes`
    element(IP_ID).setText(ip)

    element(NETWORK_TYPE_ID).setText(node.node.network_type)

    let betweenness =
      node.nodeType != ENodeType.Super
        ? node.node.betweenness.toFixed(6)
        : '--'
    element(BETWEENNESS_ID).setText(betweenness)

    let closeness =
      node.nodeType != ENodeType.Super ? node.node.closeness.toFixed(6) : '--'
    element(CLOSENESS_ID).setText(closeness)

    let connections =
      node.nodeType != ENodeType.Super ? node.numConnections.toString() : '--'
    element(CONNECTIONS_ID).setText(connections)

    let latitude = node.node.geolocation.coordinates.latitude.toFixed(4)
    element(LATITUDE_ID).setText(latitude)

    let longitude = node.node.geolocation.coordinates.longitude.toFixed(4)
    element(LONGITUDE_ID).setText(longitude)

    let city = node.node.geolocation.city
    element(CITY_ID).setText(city)

    let country = node.node.geolocation.country
    element(COUNTRY_ID).setText(country)

    let subnode =
      node.node.num_subnodes <= 1 ? '--' : node.node.subnode_index.toString()
    element(subnode).setText(subnode)

    let numSubnodes =
      node.node.num_subnodes <= 1 ? '--' : node.node.num_subnodes.toString()
    element(NUM_SUBNODES_ID).setText(numSubnodes)

    element(NODE_INFO_ID).setStyle('visibility', 'visible')
  }

  private deselectNode(node: CNode) {
    if (this.selectedNode == node) {
      element(NODE_INFO_ID).setStyle('visibility', 'hidden')
      this.selectedNode = null
    }

    if (node.nodeType == ENodeType.Single) {
      this.mainSingleGroup.transformData?.set(
        this.singleNodes[node.index].getCurrentColor(this.colorMode),
        node.index * NODE_TRANSFORM_SIZE
      )
    } else if (node.nodeType == ENodeType.Super) {
      this.mainSuperGroup.transformData?.set(
        this.superNodes[node.index].getCurrentColor(this.colorMode),
        node.index * NODE_TRANSFORM_SIZE
      )
    } else if (
      node.nodeType == ENodeType.Sub &&
      this.selectedSuperNode &&
      node.superNode == this.selectedSuperNode
    ) {
      this.mainSubGroup.transformData?.set(
        this.selectedSuperNode.subNodes[node.index].getCurrentColor(
          this.colorMode
        ),
        node.index * NODE_TRANSFORM_SIZE
      )
    }
  }

  private selectNode(node: CNode) {
    this.selectedNode = node
    this.setNodeInfo(node)

    if (node.nodeType == ENodeType.Single) {
      this.mainSingleGroup.transformData?.set(
        this.white,
        node.index * NODE_TRANSFORM_SIZE
      )
    } else if (node.nodeType == ENodeType.Super) {
      this.mainSuperGroup.transformData?.set(
        this.white,
        node.index * NODE_TRANSFORM_SIZE
      )
    } else {
      this.mainSubGroup.transformData?.set(
        this.white,
        node.index * NODE_TRANSFORM_SIZE
      )
    }
  }

  public handleClick(x: number, y: number) {
    let screenCoords = [
      x / this.canvas.width,
      1 - y / this.canvas.height,
    ] as const

    let currNode = this.getNode(this.renderPicker(...screenCoords))
    this.maybeOpenSuperNode(currNode)

    if (currNode !== this.selectedNode) {
      if (this.selectedNode) {
        this.deselectNode(this.selectedNode)
      }
      if (currNode) {
        this.selectNode(currNode)
      }
    }
    this.updateConnectionsData()
  }

  public handleDrag(dx: number, dy: number) {
    this.camera.drag(dx, dy)
  }

  private initTransformData() {
    let gl = this.gl

    this.mainSingleGroup.transformData = new Float32Array(
      this.singleNodes.length * NODE_TRANSFORM_SIZE
    )
    let n: number = 0
    for (let node of this.singleNodes) {
      let td = this.mainSingleGroup.transformData
      td.set(node.getCurrentColor(EColorMode.Degree), n)
      td.set(node.metadata, n + 4)
      td.set(node.idColor, n + 8)
      td.set(node.matWorld, n + 12)
      n += NODE_TRANSFORM_SIZE
    }
    this.mainSingleGroup.transformBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mainSingleGroup.transformBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.mainSingleGroup.transformData,
      gl.STATIC_DRAW
    )
    this.pickerSingleGroup.transformBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pickerSingleGroup.transformBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.mainSingleGroup.transformData,
      gl.STATIC_DRAW
    )

    this.mainSuperGroup.transformData = new Float32Array(
      this.superNodes.length * NODE_TRANSFORM_SIZE
    )
    n = 0
    for (let node of this.superNodes) {
      let td = this.mainSuperGroup.transformData
      td.set(node.degreeColor, n)
      td.set(node.metadata, n + 4)
      td.set(node.idColor, n + 8)
      td.set(node.matWorld, n + 12)
      n += NODE_TRANSFORM_SIZE
    }

    this.mainSuperGroup.transformBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mainSuperGroup.transformBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.mainSuperGroup.transformData,
      gl.STATIC_DRAW
    )
    this.pickerSuperGroup.transformBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pickerSuperGroup.transformBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.mainSuperGroup.transformData,
      gl.STATIC_DRAW
    )

    this.mainSubGroup.transformData = new Float32Array(
      this.maxSubnodes * NODE_TRANSFORM_SIZE
    )
    this.mainSubGroup.transformBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mainSubGroup.transformBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.mainSubGroup.transformData,
      gl.STATIC_DRAW
    )
    this.pickerSubGroup.transformBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pickerSubGroup.transformBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.mainSubGroup.transformData,
      gl.STATIC_DRAW
    )
  }

  private initConnectionData(num: number) {
    let gl = this.gl
    this.connectionData = new Float32Array(num * CONNECTION_TRANSFORM_SIZE)
    this.connectionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.connectionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.connectionData, gl.STATIC_DRAW)
  }

  private updateConnectionsData() {
    let num = 0
    if (this.displayAllConnections) {
      num = this.setGlobalConnectionsData()
    }
    else if (this.selectedNode) {
      num = this.setNodeConnectionsData(this.selectedNode)
    }
    this.numConnectionsToDraw = num
  }

  private setNodeConnectionsData(node: CNode) {
    if (node.nodeType == ENodeType.Super) {
      return 0
    }
    let gl = this.gl
    let n: number = 0
    for (let index of node.node.connections) {
      let connection: CNode = this.nodes[index]
      if (connection.node.ignore) continue
      this.connectionData.set(connection.getCurrentColor(this.colorMode), n)
      this.connectionData.set(node.position, n + 4)
      let delta: vec3 = vec3.create()
      let connPosition: vec3 = connection.getConnectionPosition()
      vec3.sub(delta, connPosition, node.position)
      this.connectionData.set(delta, n + 8)
      n += 12
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.connectionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.connectionData, gl.STATIC_DRAW)

    return node.numConnections
  }

  private setGlobalConnectionsData() {
    let gl = this.gl
    let n = 0
    let i = 0
    for (let node of this.nodes) {
      for (let index of node.node.connections) {
        // draw connection only in one direction: if A < B
        if (i < index) {
          let selectedConnection =
            index == this.selectedNode?.id || i == this.selectedNode?.id
          let connection: CNode = this.nodes[index]
          if (connection.node.ignore) continue
          this.connectionData.set(
            selectedConnection ? COLOR_YELLOW : COLOR_BLACK,
            n
          )
          this.connectionData.set(node.position, n + 4)
          let delta: vec3 = vec3.create()
          let connPosition = connection.getConnectionPosition()
          vec3.sub(delta, connPosition, node.position)
          this.connectionData.set(delta, n + 8)
          n += 12
        }
      }
      i++
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.connectionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.connectionData, gl.STATIC_DRAW)

    return this.numConnections
  }

  private updateSingleNodeData() {
    let gl = this.gl
    let n: number = 12
    for (let node of this.singleNodes) {
      this.mainSingleGroup.transformData?.set(node.matWorld, n)
      n += 28
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mainSingleGroup.transformBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.mainSingleGroup.transformData,
      gl.STATIC_DRAW
    )
  }

  private updateSuperNodeData() {
    let gl = this.gl
    let n: number = 12
    for (let node of this.superNodes) {
      this.mainSuperGroup.transformData?.set(node.matWorld, n)
      n += 28
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mainSuperGroup.transformBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.mainSuperGroup.transformData,
      gl.STATIC_DRAW
    )
  }

  private updateSubNodeData() {
    let gl = this.gl
    if (!this.selectedSuperNode || !this.selectedSuperNode.isOpenedSuper) return

    let n: number = 12
    for (let node of this.selectedSuperNode.subNodes) {
      this.mainSubGroup.transformData?.set(node.matWorld, n)
      n += 28
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mainSubGroup.transformBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.mainSubGroup.transformData,
      gl.STATIC_DRAW
    )
  }

  private updatePickerData() {
    let gl = this.gl
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pickerSingleGroup.transformBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.mainSingleGroup.transformData,
      gl.STATIC_DRAW
    )

    gl.bindBuffer(gl.ARRAY_BUFFER, this.pickerSuperGroup.transformBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.mainSuperGroup.transformData,
      gl.STATIC_DRAW
    )
    if (!this.selectedSuperNode || !this.selectedSuperNode.isOpenedSuper) return

    gl.bindBuffer(gl.ARRAY_BUFFER, this.pickerSubGroup.transformBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.mainSubGroup.transformData,
      gl.STATIC_DRAW
    )
  }

  private initMainVao(group: CGroup, geometry: WebGLBuffer) {
    if (!glShaders[EShader.Icosa]) return
    let gl = this.gl
    let positionLoc = gl.getAttribLocation(
      glShaders[EShader.Icosa],
      'a_position'
    )
    let colorLoc = gl.getAttribLocation(glShaders[EShader.Icosa], 'a_color')
    let metadataLoc = gl.getAttribLocation(
      glShaders[EShader.Icosa],
      'a_metadata'
    )
    let modelLoc = gl.getAttribLocation(glShaders[EShader.Icosa], 'a_model')
    let normalLoc = gl.getAttribLocation(glShaders[EShader.Icosa], 'a_normal')
    group.vao = gl.createVertexArray()
    gl.bindVertexArray(group.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, group.transformBuffer)
    gl.enableVertexAttribArray(colorLoc)
    gl.vertexAttribPointer(
      colorLoc,
      4,
      gl.FLOAT,
      false,
      NODE_TRANSFORM_SIZE * 4,
      0
    )
    gl.enableVertexAttribArray(metadataLoc)
    gl.vertexAttribPointer(
      metadataLoc,
      4,
      gl.FLOAT,
      false,
      NODE_TRANSFORM_SIZE * 4,
      16
    )
    gl.enableVertexAttribArray(modelLoc)
    gl.vertexAttribPointer(
      modelLoc,
      4,
      gl.FLOAT,
      false,
      NODE_TRANSFORM_SIZE * 4,
      48
    )
    gl.enableVertexAttribArray(modelLoc + 1)
    gl.vertexAttribPointer(
      modelLoc + 1,
      4,
      gl.FLOAT,
      false,
      NODE_TRANSFORM_SIZE * 4,
      64
    )
    gl.enableVertexAttribArray(modelLoc + 2)
    gl.vertexAttribPointer(
      modelLoc + 2,
      4,
      gl.FLOAT,
      false,
      NODE_TRANSFORM_SIZE * 4,
      80
    )
    gl.enableVertexAttribArray(modelLoc + 3)
    gl.vertexAttribPointer(
      modelLoc + 3,
      4,
      gl.FLOAT,
      false,
      NODE_TRANSFORM_SIZE * 4,
      96
    )

    gl.vertexAttribDivisor(modelLoc, 1)
    gl.vertexAttribDivisor(modelLoc + 1, 1)
    gl.vertexAttribDivisor(modelLoc + 2, 1)
    gl.vertexAttribDivisor(modelLoc + 3, 1)
    gl.vertexAttribDivisor(colorLoc, 1)
    gl.vertexAttribDivisor(metadataLoc, 1)

    gl.bindBuffer(gl.ARRAY_BUFFER, geometry)
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 24, 0)
    gl.enableVertexAttribArray(normalLoc)
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 24, 12)
  }

  private initNodesGl() {
    if (!glShaders[EShader.Icosa]) return
    let gl = this.gl
    this.icosaVPLoc = gl.getUniformLocation(
      glShaders[EShader.Icosa],
      'u_viewProjection'
    )
    this.paramsLoc = gl.getUniformLocation(glShaders[EShader.Icosa], 'u_params')
    this.noiseTextureLoc = gl.getUniformLocation(
      glShaders[EShader.Icosa],
      'u_noiseTexture'
    )

    this.icosaGeometry = icosaGeometry(gl)
    this.cubeGeometry = cubeGeometry(gl)

    this.initTransformData()
    if (!this.icosaGeometry || !this.cubeGeometry || !this.icosaGeometry) return
    this.initMainVao(this.mainSingleGroup, this.icosaGeometry)
    this.initMainVao(this.mainSuperGroup, this.cubeGeometry)
    this.initMainVao(this.mainSubGroup, this.icosaGeometry)
  }

  private initPickerVao(group: CGroup, geometry: WebGLBuffer) {
    if (!glShaders[EShader.Picker]) return
    let gl = this.gl
    let positionLoc = gl.getAttribLocation(
      glShaders[EShader.Picker],
      'a_position'
    )
    let pickerColorLoc = gl.getAttribLocation(
      glShaders[EShader.Picker],
      'a_pickerColor'
    )
    let metadataLoc = gl.getAttribLocation(
      glShaders[EShader.Picker],
      'a_metadata'
    )
    let modelLoc = gl.getAttribLocation(glShaders[EShader.Picker], 'a_model')

    group.vao = gl.createVertexArray()
    gl.bindVertexArray(group.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, group.transformBuffer)
    gl.enableVertexAttribArray(metadataLoc)
    gl.vertexAttribPointer(
      metadataLoc,
      4,
      gl.FLOAT,
      false,
      NODE_TRANSFORM_SIZE * 4,
      16
    )
    gl.enableVertexAttribArray(pickerColorLoc)
    gl.vertexAttribPointer(
      pickerColorLoc,
      4,
      gl.FLOAT,
      false,
      NODE_TRANSFORM_SIZE * 4,
      32
    )
    gl.enableVertexAttribArray(modelLoc)
    gl.vertexAttribPointer(
      modelLoc + 0,
      4,
      gl.FLOAT,
      false,
      NODE_TRANSFORM_SIZE * 4,
      48
    )
    gl.enableVertexAttribArray(modelLoc + 1)
    gl.vertexAttribPointer(
      modelLoc + 1,
      4,
      gl.FLOAT,
      false,
      NODE_TRANSFORM_SIZE * 4,
      64
    )
    gl.enableVertexAttribArray(modelLoc + 2)
    gl.vertexAttribPointer(
      modelLoc + 2,
      4,
      gl.FLOAT,
      false,
      NODE_TRANSFORM_SIZE * 4,
      80
    )
    gl.enableVertexAttribArray(modelLoc + 3)
    gl.vertexAttribPointer(
      modelLoc + 3,
      4,
      gl.FLOAT,
      false,
      NODE_TRANSFORM_SIZE * 4,
      96
    )

    gl.vertexAttribDivisor(modelLoc + 0, 1)
    gl.vertexAttribDivisor(modelLoc + 1, 1)
    gl.vertexAttribDivisor(modelLoc + 2, 1)
    gl.vertexAttribDivisor(modelLoc + 3, 1)
    gl.vertexAttribDivisor(pickerColorLoc, 1)
    gl.vertexAttribDivisor(metadataLoc, 1)

    gl.bindBuffer(gl.ARRAY_BUFFER, geometry)
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 24, 0)
  }

  private initPickerGl() {
    let gl = this.gl
    if (!glShaders[EShader.Picker]) return
    this.pickerVPLoc = gl.getUniformLocation(
      glShaders[EShader.Picker],
      'u_viewProjection'
    )
    this.pickerParamsLoc = gl.getUniformLocation(
      glShaders[EShader.Picker],
      'u_params'
    )
    this.pickerNoiseTextureLoc = gl.getUniformLocation(
      glShaders[EShader.Picker],
      'u_noiseTexture'
    )

    if (!this.icosaGeometry || !this.cubeGeometry || !this.icosaGeometry) return
    this.initPickerVao(this.pickerSingleGroup, this.icosaGeometry)
    this.initPickerVao(this.pickerSuperGroup, this.cubeGeometry)
    this.initPickerVao(this.pickerSubGroup, this.icosaGeometry)
  }

  private initWorldMapGl() {
    if (!glShaders[EShader.WorldMap]) return
    let gl = this.gl
    this.worldMapVPLoc = gl.getUniformLocation(
      glShaders[EShader.WorldMap],
      'u_viewProjection'
    )
    this.worldMapTextureLoc = gl.getUniformLocation(
      glShaders[EShader.WorldMap],
      'u_worldMapTexture'
    )

    this.worldMapGeometry = initWorldMap(gl)
    this.worldMapVao = gl.createVertexArray()
    gl.bindVertexArray(this.worldMapVao)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.worldMapGeometry)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8)
  }

  private initGradientGl() {
    if (!glShaders[EShader.Gradient]) return
    let gl = this.gl
    this.gradientTextureLoc = gl.getUniformLocation(
      glShaders[EShader.Gradient],
      'u_gradientTexture'
    )
    this.gradientGeometry = gradientGeometry(gl)
    this.gradientVao = gl.createVertexArray()
    gl.bindVertexArray(this.gradientVao)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.gradientGeometry)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8)
  }

  private initHistogramGl() {
    if (!glShaders[EShader.Gradient]) return
    let gl = this.gl
    this.gradientTextureLoc = gl.getUniformLocation(
      glShaders[EShader.Gradient],
      'u_gradientTexture'
    )
    this.histogramGeometry = histogramGeometry(gl)
    this.histogramVao = gl.createVertexArray()
    gl.bindVertexArray(this.histogramVao)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.histogramGeometry)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8)
  }

  private initConnectionsGl() {
    if (!glShaders[EShader.Connection]) return
    let gl = this.gl
    let positionLoc = gl.getAttribLocation(
      glShaders[EShader.Connection],
      'a_position'
    )
    let colorLoc = gl.getAttribLocation(
      glShaders[EShader.Connection],
      'a_color'
    )
    let vertex1Loc = gl.getAttribLocation(
      glShaders[EShader.Connection],
      'a_vertex1'
    )
    let vertex2Loc = gl.getAttribLocation(
      glShaders[EShader.Connection],
      'a_vertex2'
    )
    this.connectionVPLoc = gl.getUniformLocation(
      glShaders[EShader.Connection],
      'u_viewProjection'
    )

    this.lineGeometry = lineGeometry(gl)
    this.connectionVao = gl.createVertexArray()
    gl.bindVertexArray(this.connectionVao)

    // connections include A->B, and B->A, so we only draw half of them (when A < B)
    this.initConnectionData(
      this.isTiny ? this.numConnections : this.maxConnections
    )

    gl.bindBuffer(gl.ARRAY_BUFFER, this.connectionBuffer)
    gl.enableVertexAttribArray(colorLoc)
    gl.vertexAttribPointer(
      colorLoc,
      4,
      gl.FLOAT,
      false,
      CONNECTION_TRANSFORM_SIZE * 4,
      0
    )
    gl.enableVertexAttribArray(vertex1Loc)
    gl.vertexAttribPointer(
      vertex1Loc,
      4,
      gl.FLOAT,
      false,
      CONNECTION_TRANSFORM_SIZE * 4,
      16
    )
    gl.enableVertexAttribArray(vertex2Loc)
    gl.vertexAttribPointer(
      vertex2Loc,
      4,
      gl.FLOAT,
      false,
      CONNECTION_TRANSFORM_SIZE * 4,
      32
    )

    gl.vertexAttribDivisor(colorLoc, 1)
    gl.vertexAttribDivisor(vertex1Loc, 1)
    gl.vertexAttribDivisor(vertex2Loc, 1)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineGeometry)
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 12, 0)
  }

  private async initTexturesGl() {
    let gl = this.gl
    this.noiseTexture = createRandomTexture(gl, 1024, 1)
    let width = gl.getParameter(gl.MAX_TEXTURE_SIZE)
    // let precision = gl.getParameter(gl.DEPTH_BITS)
    if (width >= 8192) {
      this.worldMapTexture = await loadTexture(gl, '/world-mono-8k.png')
    } else {
      this.worldMapTexture = await loadTexture(gl, '/world-mono-4k.png')
    }
    this.gradientTexture = await loadTexture(gl, '/gradient.jpeg')
    this.histogramBTexture = getHistogramTexture(
      gl,
      this.state.histograms,
      'betweenness'
    )
    this.histogramCTexture = getHistogramTexture(
      gl,
      this.state.histograms,
      'closeness'
    )
    this.histogramDTexture = getHistogramTexture(
      gl,
      this.state.histograms,
      'degree'
    )
    this.currentHistogramTexture = this.histogramDTexture
  }

  private updateStats(inode: INode) {
    this.numConnections += inode.connections.length
    if (inode.connections.length > this.maxConnections) {
      this.maxConnections = inode.connections.length
    }
    if (inode.connections.length < this.minConnections) {
      this.minConnections = inode.connections.length
    }
    if (inode.betweenness < this.minBetweenness) {
      this.minBetweenness = inode.betweenness
    }
    if (inode.betweenness > this.maxBetweenness) {
      this.maxBetweenness = inode.betweenness
    }
    if (inode.closeness < this.minCloseness) {
      this.minCloseness = inode.closeness
    }
    if (inode.closeness > this.maxCloseness) {
      this.maxCloseness = inode.closeness
    }
  }

  private colorFromNormalizedValue(v: number): vec4 {
    if (v < 0.25) {
      // blue -> cyan
      v = v * 4
      return vec4.fromValues(0, v, 1, 1)
    } else if (v < 0.5) {
      // cyan -> green
      v = (v - 0.25) * 4
      return vec4.fromValues(0, 1, 1 - v, 1)
    } else if (v < 0.75) {
      // green -> yellow
      v = (v - 0.5) * 4
      return vec4.fromValues(v, 1, 0, 1)
    } else {
      // yellow -> red
      v = (v - 0.75) * 4
      return vec4.fromValues(1, 1 - v, 0, 1)
    }
  }

  private setAuxColors() {
    for (let node of this.nodes) {
      let b =
        (node.node.betweenness - this.minBetweenness) /
        (this.maxBetweenness - this.minBetweenness)
      node.betweenColor = this.colorFromNormalizedValue(b)

      let c =
        (node.node.closeness - this.minCloseness) /
        (this.maxCloseness - this.minCloseness)
      node.closeColor = this.colorFromNormalizedValue(c)

      let d =
        (node.numConnections - this.minConnections) /
        (this.maxConnections - this.minConnections)
      node.degreeColor = this.colorFromNormalizedValue(d)
    }
  }

  private createGeoString(geolocation: IGeolocation): string {
    const DEGREE_RESOLUTION: number = 1.0 / 1.0

    let result: string =
      Math.floor(
        geolocation.coordinates.latitude * DEGREE_RESOLUTION
      ).toString() +
      ':' +
      Math.floor(
        geolocation.coordinates.longitude * DEGREE_RESOLUTION
      ).toString()

    geolocation.coordinates.latitude =
      Math.floor(geolocation.coordinates.latitude * DEGREE_RESOLUTION) /
      DEGREE_RESOLUTION +
      DEGREE_RESOLUTION / 2
    geolocation.coordinates.longitude =
      Math.floor(geolocation.coordinates.longitude * DEGREE_RESOLUTION) /
      DEGREE_RESOLUTION +
      DEGREE_RESOLUTION / 2
    return result
  }

  private assignSubNodes(nodes: INode[]) {
    let nogeo: number = 0
    let nodeMap: Map<string, INode[]> = new Map()

    for (let inode of nodes) {
      if (!inode.geolocation) {
        nogeo++
        inode.geolocation = {
          country: 'unknown',
          city: 'unknown',
          coordinates: {
            latitude: 0,
            longitude: -10,
          },
          timezone: '',
          isp: '',
        }
      }
      inode.geostr = this.createGeoString(inode.geolocation)
      if (inode.ignore) continue
      let group = nodeMap.get(inode.geostr)
      if (group) {
        inode.subnode_index = group.length
        group.push(inode)
      } else {
        inode.subnode_index = 0
        group = new Array()
        group.push(inode)
        nodeMap.set(inode.geostr, group)
      }
    }
    for (let [_, value] of nodeMap) {
      for (let inode of value) {
        inode.num_subnodes = value.length
      }
    }
  }

  private initNodes() {
    element(NODE_INFO_ID).setStyle('visibility', 'hidden')
    let id = 0
    this.assignSubNodes(this.state.nodes)
    this.isTiny = this.state.nodes.length < TINY_GRAPH_NODES
    let abstand: number = this.isTiny ? SUBNODE_DISTANCE : 2.0
    for (let node of this.state.nodes) {
      if (node.ignore) {
        let cNode = new CNode(
          node,
          id,
          0,
          this.camera,
          ENodeType.Hide,
          null,
          abstand,
          this.isTiny
        )
        this.nodes.push(cNode)
        id++
        continue
      }
      // if we're working with a small graph, we do not create any supernodes or subnodes.
      // All nodes are therefore a single node.
      if (node.subnode_index == 0 || this.isTiny) {
        if (node.num_subnodes > 1 && !this.isTiny) {
          // new super node
          let superNode = new CNode(
            node,
            this.state.nodes.length + this.superNodes.length,
            this.superNodes.length,
            this.camera,
            ENodeType.Super,
            null,
            0,
            this.isTiny
          )
          // make super nodes magenta
          superNode.degreeColor = COLOR_MAGENTA

          this.superMap.set(node.geostr, superNode)
          this.superNodes.push(superNode)
          let cNode = new CNode(
            node,
            id,
            superNode.subNodes.length,
            this.camera,
            ENodeType.Sub,
            superNode,
            abstand,
            this.isTiny
          )
          this.nodes.push(cNode)
          superNode.subNodes.push(cNode)
        } else {
          // new single node
          let cNode = new CNode(
            node,
            id,
            this.singleNodes.length,
            this.camera,
            ENodeType.Single,
            null,
            abstand,
            this.isTiny
          )
          this.nodes.push(cNode)
          this.singleNodes.push(cNode)
        }
      } else {
        let superNode = this.superMap.get(node.geostr)
        if (!superNode) {
          // TODO Does this need to be an error?
          console.warn('Could not find supernode for geostr ', node.geostr)
          console.warn('Could not find supernode for inode ', node)
        } else {
          let cNode = new CNode(
            node,
            id,
            superNode.subNodes.length,
            this.camera,
            ENodeType.Sub,
            superNode,
            abstand,
            this.isTiny
          )
          this.nodes.push(cNode)
          superNode.subNodes.push(cNode)
          if (superNode.subNodes.length > this.maxSubnodes) {
            this.maxSubnodes = superNode.subNodes.length
          }
        }
      }
      id++
    }

    for (let inode of this.state.nodes) {
      this.updateStats(inode)
    }
    // we only draw half the connection (only A->B, not B->A)
    this.numConnections = this.numConnections / 2

    let minSuperNodeSize = Math.sqrt(2)
    let maxSuperNodeSize = Math.sqrt(this.maxSubnodes)
    for (let superNode of this.superNodes) {
      let size = Math.sqrt(superNode.subNodes.length)
      superNode.scale =
        ((size - minSuperNodeSize) / maxSuperNodeSize) *
        (MAX_SUPERNODE_SCALE - MIN_SUPERNODE_SCALE) +
        MIN_SUPERNODE_SCALE
    }
  }

  private renderWorldMap() {
    let gl = this.gl
    gl.depthMask(false)
    gl.useProgram(glShaders[EShader.WorldMap])
    gl.uniformMatrix4fv(
      this.worldMapVPLoc,
      false,
      this.camera.matViewProjection
    )
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.worldMapTexture)
    gl.uniform1i(this.worldMapTextureLoc, 0)
    gl.bindVertexArray(this.worldMapVao)
    gl.drawArrays(gl.TRIANGLES, 0, 108)
  }

  private renderGradient() {
    let gl = this.gl
    gl.depthMask(false)
    gl.useProgram(glShaders[EShader.Gradient])
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.gradientTexture)
    gl.uniform1i(this.gradientTextureLoc, 0)
    gl.bindVertexArray(this.gradientVao)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  private renderHistogram() {
    let gl = this.gl
    gl.depthMask(false)
    gl.useProgram(glShaders[EShader.Gradient])
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.currentHistogramTexture)
    gl.uniform1i(this.gradientTextureLoc, 0)
    gl.bindVertexArray(this.histogramVao)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  private renderConnections() {
    if (!this.numConnectionsToDraw) {
      return
    }
    let gl = this.gl
    gl.useProgram(glShaders[EShader.Connection])
    gl.uniformMatrix4fv(
      this.connectionVPLoc,
      false,
      this.camera.matViewProjection
    )
    gl.bindVertexArray(this.connectionVao)
    gl.drawArraysInstanced(gl.LINES, 0, 2, this.numConnectionsToDraw)
  }

  private renderNodes() {
    let gl = this.gl
    gl.depthMask(true)
    gl.useProgram(glShaders[EShader.Icosa])
    gl.uniformMatrix4fv(this.icosaVPLoc, false, this.camera.matViewProjection)
    gl.uniform4fv(this.paramsLoc, this.params)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture)
    gl.uniform1i(this.noiseTextureLoc, 0)

    gl.bindVertexArray(this.mainSingleGroup.vao)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 60, this.singleNodes.length)
    if (this.selectedSuperNode && this.selectedSuperNode.isOpenedSuper) {
      gl.bindVertexArray(this.mainSubGroup.vao)
      gl.drawArraysInstanced(
        gl.TRIANGLES,
        0,
        60,
        this.selectedSuperNode.subNodes.length
      )
    }

    gl.bindVertexArray(this.mainSuperGroup.vao)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, this.superNodes.length)
  }

  public renderGl() {
    let elapsed = this.startTime - Date.now()
    this.params[0] = elapsed / 1000.0
    this.renderWorldMap()
    this.renderConnections()
    this.renderNodes()
    if (this.displayGradient) {
      this.renderGradient()
    }
    if (this.displayHistogram) {
      this.renderHistogram()
    }
  }

  private renderPicker(x: number, y: number) {
    this.picker.preRender(x, y)
    let gl = this.gl
    gl.useProgram(glShaders[EShader.Picker])
    gl.uniformMatrix4fv(this.pickerVPLoc, false, this.camera.matViewProjection)
    gl.uniform4fv(this.pickerParamsLoc, this.params)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture)
    gl.uniform1i(this.pickerNoiseTextureLoc, 0)
    gl.bindVertexArray(this.pickerSingleGroup.vao)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 60, this.singleNodes.length)

    if (this.selectedSuperNode && this.selectedSuperNode.isOpenedSuper) {
      gl.bindVertexArray(this.pickerSubGroup.vao)
      gl.drawArraysInstanced(
        gl.TRIANGLES,
        0,
        60,
        this.selectedSuperNode.subNodes.length
      )
    }

    gl.bindVertexArray(this.pickerSuperGroup.vao)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, this.superNodes.length)

    return this.picker.postRender()
  }
}
