import { initShadersGl } from './shaders'
import { IState, INITIAL_CAMERA_Z } from './core'
import { Events } from './events'
import { CWorld } from './world'
import { PCamera } from './camera'
import { EKeyId, IKeyAction } from './core'
import { zoomLogToScale } from './util'
import { vec2 } from 'gl-matrix'
import { NAVBAR_HEIGHT } from '../utils/constants'

const APP_VERSION = '0.1.10'

export class CApp {
  private events: Events | null = null
  private initialized: boolean = false
  private startTime: number
  private lastTime: number = 0
  private iter: number = 0
  public gl: WebGL2RenderingContext
  private canvas: HTMLCanvasElement
  public camera: PCamera
  private world: CWorld | null = null

  public activeActions: EKeyId[] = []
  private velPanX: number = 0
  private velPanY: number = 0
  private velZoom: number = 0
  private zoomLogarithm: number = 1
  private lastUpdateTime: number
  public zoomInTicks: number = 0
  public zoomOutTicks: number = 0
  public zoomAnchor: vec2 = vec2.create()

  public constructor(
    canvas: HTMLCanvasElement,
  ) {
    this.canvas = canvas
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight - NAVBAR_HEIGHT
    this.camera = new PCamera(0, 0, INITIAL_CAMERA_Z, this.canvas)

    console.log('p2p-viz version: ', APP_VERSION)
    console.log('Use WebGL')
    let gl = canvas.getContext('webgl2')
    if (!gl) {
      throw new Error('WebGL2 not supported')
    }
    this.gl = gl

    this.startTime = Date.now() / 1000
    this.lastUpdateTime = Date.now()
  }

  async create(state: IState) {
    this.initialize()
    this.initializeWebGl(this.gl)
    this.world = new CWorld(state, this.gl, this.canvas, this.camera)
    await this.world.initialize()
    this.initialized = true
    this.events = new Events({
      onClick: this.handleClick,
      onResize: this.handleResize,
      onKeyPress: this.handleKeyPress,
      onKeyRelease: this.handleKeyRelease,
      onZoom: this.handleZoom,
      onSlide: (_x, _y, dx, dy) => this.handleDrag(dx, dy),
      element: this.canvas,
    }).create()

    return this
  }

  public destroy() {
    this.events?.destroy()
  }

  initializeWebGl(gl: WebGL2RenderingContext) {
    gl.clearColor(1, 1, 1, 1.0)
    gl.clearDepth(1.0)
    gl.clearStencil(0.0)
    gl.enable(gl.DEPTH_TEST)
    gl.frontFace(gl.CW)
    gl.cullFace(gl.BACK)
    gl.enable(gl.CULL_FACE)
    gl.lineWidth(4.0)
    initShadersGl(gl)
  }

  private updateFps() {
    this.iter++
    if (this.iter % 15 == 0) {
      let now = Date.now()
      let delta = now - this.lastTime
      this.lastTime = now
      let fps = (1000 * 15) / delta
      if (this.world) this.world.fpsNode.nodeValue = fps.toFixed(6)
    }
  }

  private maybeSetColor() {
    const bgDark = [26 / 255, 27 / 255, 30 / 255, 1] as const
    const bgLight = [1, 1, 1, 1] as const

    const isLight =
      window.document.documentElement.getAttribute('data-color-scheme') ===
      'light'
    const bgColor = isLight ? bgLight : bgDark
    const currentColor = this.gl.getParameter(this.gl.COLOR_CLEAR_VALUE)
    // only change the bg color if it's different
    if (
      currentColor[0].toFixed(2) === bgColor[0].toFixed(2) &&
      currentColor[1].toFixed(2) === bgColor[1].toFixed(2) &&
      currentColor[2].toFixed(2) === bgColor[2].toFixed(2)
    ) {
      return
    }
    console.log('changing bg color')
    this.gl.clearColor(...bgColor)
  }

  public renderGl() {
    this.updateFps()
    this.maybeSetColor()
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
    if (this.world) {
      this.world.timeNode.nodeValue = (
        Date.now() / 1000 -
        this.startTime
      ).toFixed(2)
      this.update()
      this.world.renderGl()
    }
  }

  public render() {
    if (!this.initialized || !this.gl) {
      return
    }
    this.renderGl()
  }

  onActionStart(id: EKeyId) {
    if (!this.world) {
      return
    }
    switch (id) {
      case EKeyId.ToggleConnection: {
        this.world.connectionMode = !this.world.connectionMode
        break
      }
      case EKeyId.ToggleCommand: {
        this.world.displayCommand = !this.world.displayCommand
        let el = document.getElementById('instructions')
        if (el) {
          el.style.visibility = this.world.displayCommand ? 'visible' : 'hidden'
        }
        break
      }
      case EKeyId.ToggleFps: {
        this.world.displayFps = !this.world.displayFps
        let el2 = document.getElementById('overlayLeft')
        if (el2) {
          el2.style.visibility = this.world.displayFps ? 'visible' : 'hidden'
        }
        break
      }
      case EKeyId.ToggleGradient: {
        this.world.displayGradient = !this.world.displayGradient
        let el = document.getElementById('gradient')
        if (el)
          el.style.visibility = this.world.displayGradient
            ? 'visible'
            : 'hidden'
        break
      }
      case EKeyId.ToggleHistogram: {
        this.world.displayHistogram = !this.world.displayHistogram
        break
      }
      case EKeyId.ToggleColorMode: {
        this.world.cycleColorMode()
      }
      case EKeyId.ArrowUp:
      case EKeyId.ArrowDown:
      case EKeyId.ArrowLeft:
      case EKeyId.ArrowRight:
      case EKeyId.ZoomIn:
      case EKeyId.ZoomOut: {
        this.activeActions.push(id)
      }
    }
  }

  onActionEnd(id: EKeyId) {
    this.activeActions = this.activeActions.filter((a) => a !== id)
  }

  public handleKeyPress = (key: string) => {
    switch (key) {
      case 'ArrowUp':
        this.onActionStart(EKeyId.ArrowUp)
        break
      case 'ArrowDown':
        this.onActionStart(EKeyId.ArrowDown)
        break
      case 'ArrowLeft':
        this.onActionStart(EKeyId.ArrowLeft)
        break
      case 'ArrowRight':
        this.onActionStart(EKeyId.ArrowRight)
        break
      case 'KeyC':
        this.onActionStart(EKeyId.ToggleColorMode)
        break
      case 'KeyG':
        this.onActionStart(EKeyId.ToggleGradient)
        break
      case 'KeyH':
        this.onActionStart(EKeyId.ToggleHistogram)
        break
      case 'KeyN':
        this.onActionStart(EKeyId.ToggleConnection)
        break
      case 'KeyX':
        this.onActionStart(EKeyId.ToggleCommand)
        break
      case 'KeyF':
        this.onActionStart(EKeyId.ToggleFps)
        break
      case 'KeyI':
        this.onActionStart(EKeyId.ZoomIn)
        break
      case 'KeyO':
        this.onActionStart(EKeyId.ZoomOut)
        break
      default:
        break
    }
  }

  public handleKeyRelease = (key: string) => {
    switch (key) {
      case 'ArrowUp':
        this.onActionEnd(EKeyId.ArrowUp)
        break
      case 'ArrowDown':
        this.onActionEnd(EKeyId.ArrowDown)
        break
      case 'ArrowLeft':
        this.onActionEnd(EKeyId.ArrowLeft)
        break
      case 'ArrowRight':
        this.onActionEnd(EKeyId.ArrowRight)
        break
      case 'KeyI':
        this.onActionEnd(EKeyId.ZoomIn)
        break
      case 'KeyO':
        this.onActionEnd(EKeyId.ZoomOut)
        break
    }
  }

  public handleDrag = (dx: number, dy: number) => {
    this.world?.handleDrag(dx, dy)
  }

  public handleZoom = (x: number, y: number, delta: number) => {
    this.zoomAnchor = vec2.fromValues(x, y - NAVBAR_HEIGHT)
    if (delta > 0) {
      this.zoomOutTicks += delta / 16
      if (this.zoomOutTicks > 10) {
        this.zoomOutTicks = 10
      }
    } else {
      this.zoomInTicks += -delta / 16
      if (this.zoomInTicks > 10) {
        this.zoomInTicks = 10
      }
    }
  }

  public handleClick = (x: number, y: number) => {
    this.world?.handleClick(x, y)
  }

  public handleResize = () => {
    const bounds = this.canvas.getBoundingClientRect()
    this.canvas.width = this.canvas.getBoundingClientRect().width
    this.canvas.height = this.canvas.getBoundingClientRect().height
    this.gl?.viewport(0, 0, bounds.width, bounds.height)
    this.camera?.update()
  }

  private updateActions(delta: number) {
    const ZOOM_INC = 0.025
    if (this.zoomInTicks > 0) {
      this.incZoomLogarithm(-ZOOM_INC, true)
      this.zoomInTicks--
    }
    if (this.zoomOutTicks > 0) {
      this.incZoomLogarithm(ZOOM_INC, true)
      this.zoomOutTicks--
    }
    // reach maximum velocity in 200 ms
    const ACC = 2.5
    const MAXVEL = 0.7
    let accelX: number = 0
    let accelY: number = 0
    let accelZ: number = 0
    for (let id of this.activeActions) {
      switch (id) {
        case EKeyId.ArrowLeft:
          accelX = (-ACC * delta) / 1500
          this.velPanX += accelX
          if (this.velPanX < -MAXVEL) {
            this.velPanX = -MAXVEL
          }
          break
        case EKeyId.ArrowRight:
          accelX = (ACC * delta) / 1500
          this.velPanX += accelX
          if (this.velPanX > MAXVEL) {
            this.velPanX = MAXVEL
          }
          break
        case EKeyId.ArrowDown:
          accelY = (ACC * delta) / 1500
          this.velPanY += accelY
          if (this.velPanY > MAXVEL) {
            this.velPanY = MAXVEL
          }
          break
        case EKeyId.ArrowUp:
          accelY = (-ACC * delta) / 1500
          this.velPanY += accelY
          if (this.velPanY < -MAXVEL) {
            this.velPanY = -MAXVEL
          }
          break
        case EKeyId.ZoomIn:
          accelZ = (-ACC * delta) / 1000
          this.velZoom += accelZ
          if (this.velZoom < -MAXVEL) {
            this.velZoom = -MAXVEL
          }
          break
        case EKeyId.ZoomOut:
          accelZ = (ACC * delta) / 1000
          this.velZoom += accelZ
          if (this.velZoom > MAXVEL) {
            this.velZoom = MAXVEL
          }
          break
      }
    }

    // if no acceleration, apply deacceleration to any current velocities
    if (accelX == 0 && this.velPanX != 0) {
      accelX = (ACC * 2 * delta) / 1000
      if (this.velPanX > 0) {
        this.velPanX -= accelX
        if (this.velPanX < 0) {
          this.velPanX = 0
        }
      } else {
        this.velPanX += accelX
        if (this.velPanX > 0) {
          this.velPanX = 0
        }
      }
    }

    if (accelY == 0 && this.velPanY != 0) {
      accelY = (ACC * 2 * delta) / 1000
      if (this.velPanY > 0) {
        this.velPanY -= accelY
        if (this.velPanY < 0) {
          this.velPanY = 0
        }
      } else {
        this.velPanY += accelY
        if (this.velPanY > 0) {
          this.velPanY = 0
        }
      }
    }

    if (accelZ == 0 && this.velZoom != 0) {
      accelZ = (ACC * 2 * delta) / 1000
      if (this.velZoom > 0) {
        this.velZoom -= accelZ
        if (this.velZoom < 0) {
          this.velZoom = 0
        }
      } else {
        this.velZoom += accelZ
        if (this.velZoom > 0) {
          this.velZoom = 0
        }
      }
    }

    // apply pan velocity
    if (this.velPanX || this.velPanY) {
      let dimen: number =
        this.camera.worldWidth > this.camera.worldHeight
          ? this.camera.worldWidth
          : this.camera.worldHeight
      let dx = ((this.velPanX * delta) / 1000) * dimen
      let dy = ((this.velPanY * delta) / 1000) * dimen
      this.camera.x += dx
      this.camera.y -= dy
      this.camera.update()
    }

    // apply zoom velocity
    if (this.velZoom) {
      let dz = (this.velZoom * delta) / 1000
      this.incZoomLogarithm(dz, false)
    }
  }

  public incZoomLogarithm(dz: number, useAnchor: boolean) {
    this.zoomLogarithm += dz
    if (this.zoomLogarithm > 8.14786) {
      this.zoomLogarithm = 8.14786
      this.velZoom = 0
    }
    if (this.zoomLogarithm < 3.158883) {
      this.zoomLogarithm = 3.158883
      this.velZoom = 0
    }
    this.camera.nodeScale = zoomLogToScale(this.zoomLogarithm)
    this.camera.z = Math.exp(this.zoomLogarithm)
    if (useAnchor) {
      // convert anchor point to world coordinates
      let normalX =
        this.zoomAnchor[0] / this.canvas.getBoundingClientRect().width
      let normalY =
        1 - this.zoomAnchor[1] / this.canvas.getBoundingClientRect().height
      let worldX =
        (normalX - 0.5) * this.camera.worldWidth * this.camera.aspectRatio +
        this.camera.x
      let worldY = (normalY - 0.5) * this.camera.worldWidth + this.camera.y

      // compute new world width/height based on camera z
      this.camera.update()

      // determine new camera position based on new offset
      this.camera.x =
        worldX +
        (0.5 - normalX) * this.camera.worldWidth * this.camera.aspectRatio
      this.camera.y = worldY + (0.5 - normalY) * this.camera.worldWidth
    }
    this.camera.update()
  }

  public update() {
    let time = Date.now()
    let delta = time - this.lastUpdateTime
    this.lastUpdateTime = time
    this.updateActions(delta)
    this.camera.update()
    this.world?.update()
  }

  public initialize() {
    this.zoomLogarithm = Math.log(INITIAL_CAMERA_Z)
    this.camera.nodeScale = zoomLogToScale(this.zoomLogarithm)
    this.camera.update()
  }
}
