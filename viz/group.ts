/// <reference path="../node_modules/@webgpu/types/dist/index.d.ts" />

export class CGroup {
  public vao: WebGLVertexArrayObject | null
  public transformBuffer: WebGLBuffer | null
  public transformData: Float32Array | null

  public constructor() {
    this.vao = null
    this.transformBuffer = null
    this.transformData = null
  }
}
