import { mat4, vec3 } from 'gl-matrix'
import { NAVBAR_HEIGHT } from '../utils/constants'

// const HALF_ROOT_THREE = 0.866025403784439
export class PCamera {
  private near = 16
  private far = 4096
  // twice arctan 0.5
  private fovx = 0.46364761 * 2.0
  private canvas: HTMLCanvasElement
  public x: number
  public y: number
  public z: number
  public worldWidth = 1920
  public worldHeight = 1080
  public aspectRatio = 16 / 9
  matView = mat4.create()
  matViewProjection = mat4.create()
  matProjection = mat4.create()
  nodeScale = 1

  public constructor(
    x: number,
    y: number,
    z: number,
    canvas: HTMLCanvasElement
  ) {
    this.x = x
    this.y = y
    this.z = z
    this.canvas = canvas
    this.update()
  }

  public update(): void {
    this.aspectRatio = this.canvas.width / this.canvas.height
    console.log('aspect ratio:', this.aspectRatio)
    // 53.13 degrees field-of-view: screen width = distance to camera
    this.worldWidth = this.z
    this.worldHeight = this.worldWidth / this.aspectRatio
    mat4.perspective(
      this.matProjection,
      this.fovx,
      this.aspectRatio,
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
    let x = (dx / this.canvas.width) * this.worldWidth * this.aspectRatio
    let y = (dy / this.canvas.height) * this.worldWidth
    this.x -= x
    this.y += y
    this.update()
  }
}
