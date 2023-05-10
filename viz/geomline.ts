
const positions = [
    0, 0, 0,
    1, 1, 1,
];

export function lineGeometry(gl: WebGL2RenderingContext) : WebGLBuffer | null {
    let lineData : Float32Array = new Float32Array(positions);
    let lineBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.STATIC_DRAW);
    return lineBuffer;
}
