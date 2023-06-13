import { initShadersGl } from './shaders'
import { IState, CAMERA_INITIAL_Z, CAMERA_MIN_Z, CAMERA_MAX_Z, FPS_ID, TIME_ID } from './core'
import { Events, Keys } from './events'
import { CWorld } from './world'
import { PCamera } from './camera'
import { Action } from './core'
import { bound, normalize } from '../utils/helpers'
import { element } from '../utils/dom'

const APP_VERSION = '0.1.10'

export class CApp {
  private events: Events
  private initialized: boolean = false
  private startTime: number
  private lastTime: number = 0
  private iter: number = 0
  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private camera: PCamera
  private world: CWorld

  private activeActions: { action: Action; start: number }[] = []
  private lastUpdateTime: number

  public constructor(canvas: HTMLCanvasElement, state: IState) {
    console.log('p2p-viz version: ', APP_VERSION)
    let gl = canvas.getContext('webgl2')
    if (!gl) {
      throw new Error('WebGL2 not supported')
    }

    this.canvas = canvas
    this.gl = gl
    this.camera = new PCamera(0, 0, CAMERA_INITIAL_Z, this.canvas)
    this.world = new CWorld(state, this.gl, this.canvas, this.camera)
    this.events = new Events({
      onClick: this.handleClick,
      onResize: this.handleResize,
      onKeyPress: this.handleKeyPress,
      onKeyRelease: this.handleKeyRelease,
      onZoom: this.handleZoom,
      onSlide: (_x, _y, dx, dy) => this.handleDrag(dx, dy),
      element: this.canvas,
    })

    this.startTime = Date.now() / 1000
    this.lastUpdateTime = Date.now()
  }

  public async initialize() {
    this.initializeWebGl()
    await this.world.initialize()
    this.events.initialize()

    this.initialized = true
  }

  public destroy() {
    this.events.destroy()
  }

  private initializeWebGl() {
    let gl = this.gl
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
    if (!this.world.displayStats) {
      return
    }
    this.iter++
    if (this.iter % 15 == 0) {
      let now = Date.now()
      let delta = now - this.lastTime
      this.lastTime = now
      let fps = (1000 * 15) / delta
      element(FPS_ID).setText(fps.toFixed(2))
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
    this.update()
    this.world.renderGl()
    if (this.world.displayStats) {
      const time = (Date.now() / 1000 - this.startTime).toFixed(2)
      element(TIME_ID).setText(time)
    }
  }

  public render() {
    if (!this.initialized || !this.gl) {
      return
    }
    this.renderGl()
  }

  private isContinuousAction(action: Action) {
    switch (action) {
      case Action.MoveUp:
      case Action.MoveDown:
      case Action.MoveLeft:
      case Action.MoveRight:
      case Action.ZoomIn:
      case Action.ZoomOut:
        return true
      default:
        return false
    }
  }

  private onActionStart(action: Action) {
    if (this.activeActions.find(a => a.action === action)) {
      return
    }
    switch (action) {
      case Action.ToggleAllConnections: {
        this.world.displayAllConnections = !this.world.displayAllConnections
        break
      }
      case Action.ToggleKeymaps: {
        this.world.displayKeymaps = !this.world.displayKeymaps
        break
      }
      case Action.ToggleStats: {
        this.world.displayStats = !this.world.displayStats
        break
      }
      case Action.ToggleGradient: {
        this.world.displayGradient = !this.world.displayGradient
        break
      }
      case Action.ToggleHistogram: {
        this.world.displayHistogram = !this.world.displayHistogram
        break
      }
      case Action.ToggleColorMode: {
        this.world.cycleColorMode()
      }
      default: {
        if (this.isContinuousAction(action)) {
          this.activeActions.push({ action, start: Date.now() })
        }
      }
    }
  }

  private onActionEnd(ac: Action) {
    this.activeActions = this.activeActions.filter(
      ({ action }) => action !== ac
    )
  }

  public handleKeyPress = (key: string, mod: Keys) => {
    if (mod !== Keys.None) {
      // ignore keypresses with modifiers
      return
    }
    switch (key) {
      case 'ArrowUp':
        this.onActionStart(Action.MoveUp)
        break
      case 'ArrowDown':
        this.onActionStart(Action.MoveDown)
        break
      case 'ArrowLeft':
        this.onActionStart(Action.MoveLeft)
        break
      case 'ArrowRight':
        this.onActionStart(Action.MoveRight)
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
        this.onActionStart(Action.ToggleAllConnections)
        break
      case 'KeyX':
        this.onActionStart(Action.ToggleKeymaps)
        break
      case 'KeyF':
        this.onActionStart(Action.ToggleStats)
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
        this.onActionEnd(Action.MoveUp)
        break
      case 'ArrowDown':
        this.onActionEnd(Action.MoveDown)
        break
      case 'ArrowLeft':
        this.onActionEnd(Action.MoveLeft)
        break
      case 'ArrowRight':
        this.onActionEnd(Action.MoveRight)
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
    this.world.handleDrag(dx, dy)
  }

  public handleZoom = (x: number, y: number, delta: number) => {
    const zoom = delta / 500
    const z = bound(
      Math.exp(Math.log(this.camera.z) + zoom),
      CAMERA_MIN_Z,
      CAMERA_MAX_Z
    )

    const bounds = this.canvas.getBoundingClientRect()
    const normalX = x / bounds.width
    const normalY = 1 - y / bounds.height
    const aspectRatio = bounds.width / bounds.height

    this.camera.x += (normalX - 0.5) * aspectRatio * (this.camera.z - z)
    this.camera.y += (normalY - 0.5) * (this.camera.z - z)
    this.camera.z = z
  }

  public handleClick = (x: number, y: number) => {
    this.world.handleClick(x, y)
  }

  public handleResize = () => {
    const bounds = this.canvas.getBoundingClientRect()
    this.canvas.width = this.canvas.getBoundingClientRect().width
    this.canvas.height = this.canvas.getBoundingClientRect().height
    this.gl.viewport(0, 0, bounds.width, bounds.height)
    this.camera.update()
  }

  private updateActions() {
    const duration = Date.now() - this.lastUpdateTime
    const MAX_DELTA = 30
    const x = Math.min(duration, MAX_DELTA)
    const y = Math.min(duration, MAX_DELTA)
    const z = Math.min(duration, MAX_DELTA)
    for (let { action, start } of this.activeActions) {
      const norm = 1 - normalize(Math.log(Date.now() - start), 5, 12)
      switch (action) {
        case Action.MoveLeft: {
          this.handleDrag(x * norm, 0)
          break
        }
        case Action.MoveRight: {
          this.handleDrag(-x * norm, 0)
          break
        }
        case Action.MoveDown: {
          this.handleDrag(0, -y * norm)
          break
        }
        case Action.MoveUp: {
          this.handleDrag(0, y * norm)
          break
        }
        case Action.ZoomIn: {
          const x = this.canvas.width / 2
          const y = this.canvas.height / 2
          this.handleZoom(x, y, -z * norm)
          break
        }
        case Action.ZoomOut: {
          const x = this.canvas.width / 2
          const y = this.canvas.height / 2
          this.handleZoom(x, y, z * norm)
          break
        }
      }
    }
  }

  private update() {
    this.updateActions()
    this.camera.update()
    this.world.update()

    this.lastUpdateTime = Date.now()
  }
}
