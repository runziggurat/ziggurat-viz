import { IHistogram } from './core'

const HISTOGRAM_WIDTH: number = 512

function createHistogramTexture(
  gl: WebGL2RenderingContext,
  summary: IHistogram
): WebGLTexture | null {
  // we draw the histogram on its side, and then rotate 90 degress when displaying
  // each row of texture corresponds to one column of the histogram, whose height varies
  // with the corresponding count for that entry.
  let height = summary.counts.length
  const npixels = HISTOGRAM_WIDTH * height
  const data = new Uint8Array(npixels * 4)
  let n = 0
  for (let y = 0; y < height; y++) {
    let h = Math.floor(
      (summary.counts[y] / summary.max_count) * HISTOGRAM_WIDTH + 0.5
    )
    // Fudge, that if count is > 0, show at least 1 notch in graph
    if (h == 0 && summary.counts[y] > 0) {
      h = 1
    }
    for (let x = 0; x < HISTOGRAM_WIDTH; x++) {
      if (x < h) {
        // use yellow where the data is valid
        data[n + 0] = 255
        data[n + 1] = 255
        data[n + 2] = 128
      } else {
        // black for background
        data[n + 0] = 0
        data[n + 1] = 0
        data[n + 2] = 0
      }
      data[n + 3] = 255
      n += 4
    }
  }
  const level = 0
  const internalFormat = gl.RGBA
  const border = 0
  const srcFormat = gl.RGBA
  const srcType = gl.UNSIGNED_BYTE
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    HISTOGRAM_WIDTH,
    height,
    border,
    srcFormat,
    srcType,
    data
  )

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

  return texture
}

export function getHistogramTexture(
  gl: WebGL2RenderingContext,
  histograms: IHistogram[],
  label: string
): WebGLTexture | null {
  for (let histogram of histograms) {
    if (histogram.label == label) {
      return createHistogramTexture(gl, histogram)
    }
  }
  return null
}
