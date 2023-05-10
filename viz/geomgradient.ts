
const HEIGHT = 0.04;
const LEFT = -0.4
const RIGHT = 0.4;
const TOP = -0.87
const BOTTOM = TOP - HEIGHT;
const positions = [
    // top left
    LEFT, TOP, 0.001, 0.5,
    // bottom right
    RIGHT, BOTTOM, 0.999, 0.5,
    // bottom left
    LEFT, BOTTOM, 0.001, 0.5,
    // top left
    LEFT, TOP, 0.001, 0.5,
    // top right
    RIGHT, TOP, 0.999, 0.5,
    // bottom right
    RIGHT,BOTTOM, 0.999, 0.5,
];

export function gradientGeometry(gl: WebGL2RenderingContext) : WebGLBuffer|null {
    let gradientData : Float32Array = new Float32Array(positions);
    let gradientBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gradientBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, gradientData, gl.STATIC_DRAW);
    return gradientBuffer;
}
