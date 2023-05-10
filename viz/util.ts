
import { vec3, vec4 } from 'gl-matrix'

export function idToColor(id: number) : vec4 {
    let red = (id>>12) * 4 + 2;
    let green = ((id >> 6) & 63) * 4 + 2;
    let blue = (id & 63) * 4 + 2;
    let result = vec4.fromValues(red/255, green/255, blue/255, 1);
    return result
}

export function randomColor() : vec4 {
    let red = Math.random();
    let blue = Math.random();
    let green = Math.random();
    let result = vec4.fromValues(red, green, blue, 1);
    return result
}

export function colorToId(color: number) : number {
    if (!color) {
        return -1;
    }
    let r = (color >> 16) & 255;
    let g = (color >> 8) & 255;
    let b = color & 255;
    let red = Math.floor(r / 4);
    let green = Math.floor(g / 4);
    let blue = Math.floor(b / 4);
    let id = red * 4096 + green * 64 + blue;
    return id;
}

export async function loadTexture(gl: WebGL2RenderingContext, url: string) : Promise<WebGLTexture | null> {

    console.log('loadTexture url ' + url)
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Because images have to be downloaded over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);
  
    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.src = url;
    await image.decode();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                srcFormat, srcType, image);

    console.log(`loadTexture ${url}, width ${image.width}, height ${image.height}`)

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        // Yes, it's a power of 2. Generate mips.
        gl.generateMipmap(gl.TEXTURE_2D);
    } else {
        // No, it's not a power of 2. Turn off mips and set
        // wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    return texture;
}
  
export function createRandomTexture(gl: WebGL2RenderingContext, width: number, height: number) : WebGLTexture | null {
    const npixels = width * height;
    const data = new Uint8Array(npixels*4);
    let n = 0;
    for (let i = 0; i < npixels; i++) {
        data[n+0] = Math.floor(Math.random() * 256)
        data[n+1] = Math.floor(Math.random() * 256)
        data[n+2] = Math.floor(Math.random() * 256)
        data[n+3] = 255
        n += 4
    }
    console.log('data: ', data)
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return texture;
}

function isPowerOf2(value: number) {
    return (value & (value - 1)) == 0;
}

const maxLog = 7.6;
const minLog = 5.5;
const deltaLog = maxLog - minLog
const scaleMax = 3.2;
export function zoomLogToScale(zoomLogarithm: number) : number {
    let scale = 1.0;
    if (zoomLogarithm > maxLog) {
        scale = scaleMax;
    } else if (zoomLogarithm > minLog ){
        scale = 1 + (zoomLogarithm - minLog) * (scaleMax-1.0) / deltaLog;
    }
    return scale;
}
