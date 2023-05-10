
// centered on screen, 
// width = 50% of screen width
// height = 40% of screen height
const HEIGHT = 0.6;
const LEFT = -0.5
const RIGHT = 0.5;
const TOP = 0.3
const BOTTOM = TOP - HEIGHT;

const positions = [
    // top left
    LEFT, TOP, 1, 0,
    // bottom right
    RIGHT, BOTTOM, 0, 1,
    // bottom left
    LEFT, BOTTOM, 0, 0,
    // top left
    LEFT, TOP, 1, 0,
    // top right
    RIGHT, TOP, 1, 1,
    // bottom right
    RIGHT,BOTTOM, 0, 1,
];


export function histogramGeometry(gl: WebGL2RenderingContext) : WebGLBuffer|null {
    let histogramData = new Float32Array(positions);
    let histogramBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, histogramBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, histogramData, gl.STATIC_DRAW);
    return histogramBuffer;
}
