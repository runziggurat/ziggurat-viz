import { mat4, vec3 } from 'gl-matrix'
import { NAVBAR_HEIGHT } from '../utils/constants'

const HALF_ROOT_THREE = 0.866025403784439
export class PCamera {
  private near: number
  private far: number
  private fovx: number
  private canvas: HTMLCanvasElement
  public x: number
  public y: number
  public z: number
  public worldWidth: number
  public worldHeight: number
  matView: mat4
  matViewProjection: mat4
  matProjection: mat4
  nodeScale: number

  public constructor(
    x: number,
    y: number,
    z: number,
    canvas: HTMLCanvasElement
  ) {
    this.near = 16
    this.far = 4096
    this.x = x
    this.y = y
    this.z = z
    this.fovx = (60 * Math.PI) / 180
    this.canvas = canvas
    this.matView = mat4.create()
    this.matProjection = mat4.create()
    this.matViewProjection = mat4.create()
    this.nodeScale = 1.0
    this.worldWidth = 640
    this.worldHeight = 360
    this.update()
  }

  public update(): void {
    let aspect = this.canvas.width / (this.canvas.height - NAVBAR_HEIGHT)
    // 60 degrees field-of-view
    this.worldWidth = this.z / HALF_ROOT_THREE
    this.worldHeight = this.worldWidth / aspect
    mat4.perspective(
      this.matProjection,
      this.fovx / aspect,
      aspect,
      this.near,
      this.far
    )
    let rx = mat4.create()
    mat4.fromXRotation(rx, 0)
    let matWorld = mat4.create()
    mat4.translate(matWorld, matWorld, vec3.fromValues(this.x, this.y, this.z))
    mat4.multiply(matWorld, matWorld, rx)
    mat4.invert(this.matView, matWorld)
    mat4.multiply(this.matViewProjection, this.matProjection, this.matView)
  }

  public drag(dx: number, dy: number) {
    let x = (dx / this.canvas.width) * this.worldWidth
    let y = (dy / (this.canvas.height - NAVBAR_HEIGHT)) * this.worldHeight
    this.x -= x
    this.y += y
    this.update()
  }
}
