
import { colorToId } from './util'

const PICKER_TEXTURE_SIZE: number = 2048;

export class CPicker {
    private gl: WebGL2RenderingContext;
    private fb: WebGLFramebuffer | null;
    public renderTarget: WebGLTexture | null;
    private pixelBuffer: Uint8Array;
    textureWidth: number;
    textureHeight: number;
    x: number;
    y: number;
    public constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.renderTarget = null;
        this.pixelBuffer = new Uint8Array(4);
        this.textureWidth = PICKER_TEXTURE_SIZE;
        this.textureHeight = PICKER_TEXTURE_SIZE;
        this.fb = null;
        this.initialize();
        this.x = 0;
        this.y = 0;
    }

    private initialize() {
        let gl = this.gl
        this.renderTarget = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.renderTarget);

        const level = 0;
        const internalFormat = gl.RGBA;
        const border = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        const data = null;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  this.textureWidth, this.textureHeight, border,
                  format, type, data);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);

        const attachmentPoint = gl.COLOR_ATTACHMENT0;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, this.renderTarget, level);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }


    public preRender(x: number, y: number) {
        this.x = x;
        this.y = y;
        let gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
        gl.bindTexture(gl.TEXTURE_2D, this.renderTarget);
        gl.viewport(0, 0, this.textureWidth, this.textureHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    public postRender() : number {
        let gl = this.gl;
        let offsetX = Math.floor(this.x * this.textureWidth);
        let offsetY = Math.floor(this.y * this.textureWidth);
        this.readTarget(gl, offsetX, offsetY);

        const color =
          (this.pixelBuffer[0] << 16) |
          (this.pixelBuffer[1] <<  8) |
          (this.pixelBuffer[2]      );

        let id = colorToId(color);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        return id;
    }

    // read a single BGRA pixel from the render target
    private readTarget(gl: WebGL2RenderingContext, offsetX : number, offsetY : number) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.renderTarget);
        gl.readPixels(offsetX, offsetY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.pixelBuffer);
    }
}
