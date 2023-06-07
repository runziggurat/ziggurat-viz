import { initShadersGl } from './shaders'
import { IState, CAMERA_INITIAL_Z, CAMERA_MIN_Z, CAMERA_MAX_Z } from './core'
import { Events } from './events'
import { CWorld } from './world'
import { PCamera } from './camera'
import { Action } from './core'
import { NAVBAR_HEIGHT } from '../utils/constants'
import { bound } from '../utils/helpers'

const APP_VERSION = '0.1.10'

export class CApp {
  private events: Events | null = null
  private initialized: boolean = false
  private startTime: number
  private lastTime: number = 0
  private iter: number = 0
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private camera: PCamera
  private world: CWorld | null = null

  private activeActions: Action[] = []
  private lastUpdateTime: number

  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight - NAVBAR_HEIGHT
    this.camera = new PCamera(0, 0, CAMERA_INITIAL_Z, this.canvas)

    console.log('p2p-viz version: ', APP_VERSION)
    let gl = canvas.getContext('webgl2')
    if (!gl) {
      throw new Error('WebGL2 not supported')
    }
    this.gl = gl

    this.startTime = Date.now() / 1000
    this.lastUpdateTime = Date.now()
  }

  public async create(state: IState) {
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

  private initializeWebGl(gl: WebGL2RenderingContext) {
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
    this.gl.clearColor(...bgColor)
  }

  private renderGl() {
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

  private onActionStart(ac: Action) {
    if (!this.world) {
      return
    }
    switch (ac) {
      case Action.ToggleConnection: {
        this.world.connectionMode = !this.world.connectionMode
        break
      }
      case Action.ToggleCommand: {
        this.world.displayCommand = !this.world.displayCommand
        let el = document.getElementById('instructions')
        if (el) {
          el.style.visibility = this.world.displayCommand ? 'visible' : 'hidden'
        }
        break
      }
      case Action.ToggleFps: {
        this.world.displayFps = !this.world.displayFps
        let el2 = document.getElementById('overlayLeft')
        if (el2) {
          el2.style.visibility = this.world.displayFps ? 'visible' : 'hidden'
        }
        break
      }
      case Action.ToggleGradient: {
        this.world.displayGradient = !this.world.displayGradient
        let el = document.getElementById('gradient')
        if (el)
          el.style.visibility = this.world.displayGradient
            ? 'visible'
            : 'hidden'
        break
      }
      case Action.ToggleHistogram: {
        this.world.displayHistogram = !this.world.displayHistogram
        break
      }
      case Action.ToggleColorMode: {
        this.world.cycleColorMode()
      }
      case Action.ArrowUp:
      case Action.ArrowDown:
      case Action.ArrowLeft:
      case Action.ArrowRight:
      case Action.ZoomIn:
      case Action.ZoomOut: {
        this.activeActions.push(ac)
      }
    }
  }

  private onActionEnd(ac: Action) {
    this.activeActions = this.activeActions.filter((a) => a !== ac)
  }

  public handleKeyPress = (key: string) => {
    switch (key) {
      case 'ArrowUp':
        this.onActionStart(Action.ArrowUp)
        break
      case 'ArrowDown':
        this.onActionStart(Action.ArrowDown)
        break
      case 'ArrowLeft':
        this.onActionStart(Action.ArrowLeft)
        break
      case 'ArrowRight':
        this.onActionStart(Action.ArrowRight)
        break
      case 'KeyC':
        this.onActionStart(Action.ToggleColorMode)
        break
      case 'KeyG':
        this.onActionStart(Action.ToggleGradient)
        break
      case 'KeyH':
        this.onActionStart(Action.ToggleHistogram)
        break
      case 'KeyN':
        this.onActionStart(Action.ToggleConnection)
        break
      case 'KeyX':
        this.onActionStart(Action.ToggleCommand)
        break
      case 'KeyF':
        this.onActionStart(Action.ToggleFps)
        break
      case 'KeyI':
        this.onActionStart(Action.ZoomIn)
        break
      case 'KeyO':
        this.onActionStart(Action.ZoomOut)
        break
      default:
        break
    }
  }

  public handleKeyRelease = (key: string) => {
    switch (key) {
      case 'ArrowUp':
        this.onActionEnd(Action.ArrowUp)
        break
      case 'ArrowDown':
        this.onActionEnd(Action.ArrowDown)
        break
      case 'ArrowLeft':
        this.onActionEnd(Action.ArrowLeft)
        break
      case 'ArrowRight':
        this.onActionEnd(Action.ArrowRight)
        break
      case 'KeyI':
        this.onActionEnd(Action.ZoomIn)
        break
      case 'KeyO':
        this.onActionEnd(Action.ZoomOut)
        break
    }
  }

  public handleDrag = (dx: number, dy: number) => {
    this.world?.handleDrag(dx, dy)
  }

  public handleZoom = (x: number, y: number, delta: number) => {
    const zoom = delta / 500
    const z = bound(Math.exp(Math.log(this.camera.z) + zoom), CAMERA_MIN_Z, CAMERA_MAX_Z)

    const bounds = this.canvas.getBoundingClientRect()
    const normalX =
      x / bounds.width
    const normalY =
      1 - y / bounds.height
    const aspectRatio = bounds.width / bounds.height

    this.camera.x +=
      (normalX - 0.5) * aspectRatio * (this.camera.z - z)
    this.camera.y += (normalY - 0.5) * (this.camera.z - z)
    this.camera.z = z
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

  private updateActions() {
    const duration = Date.now() - this.lastUpdateTime
    const MAX_DRAG = 5
    const MAX_ZOOM = 30
    // TODO decelerate
    const x = Math.min(duration / 10, MAX_DRAG)
    const y = Math.min(duration / 10, MAX_DRAG)
    const z = Math.min(duration, MAX_ZOOM)
    for (let ac of this.activeActions) {
      switch (ac) {
        case Action.ArrowLeft: {
          this.handleDrag(-x, 0)
          break
        }
        case Action.ArrowRight: {
          this.handleDrag(x, 0)
          break
        }
        case Action.ArrowDown: {
          this.handleDrag(0, y)
          break
        }
        case Action.ArrowUp: {
          this.handleDrag(0, -y)
          break
        }
        case Action.ZoomIn: {
          const x = this.canvas.width / 2
          const y = this.canvas.height / 2
          this.handleZoom(x, y, -z)
          break
        }
        case Action.ZoomOut: {
          const x = this.canvas.width / 2
          const y = this.canvas.height / 2
          this.handleZoom(x, y, z)
          break
        }
      }
    }
  }

  private update() {
    this.updateActions()
    this.camera.update()
    this.world?.update()

    this.lastUpdateTime = Date.now()
  }
}
