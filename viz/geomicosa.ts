
const ICOSA_SCALE: number = 1.5
const positions = [
    0.000000, -0.525731, 0.850651,
    0.850651, 0.000000, 0.525731,
    0.850651, 0.000000, -0.525731,
    -0.850651, 0.000000, -0.525731,
    -0.850651, 0.000000, 0.525731,
    -0.525731, 0.850651, 0.000000,
    0.525731, 0.850651, 0.000000,
    0.525731, -0.850651, 0.000000,
    -0.525731, -0.850651, 0.000000,
    0.000000, -0.525731, -0.850651,
    0.000000, 0.525731, -0.850651,
    0.000000, 0.525731, 0.850651,
]
const normals = [
    0.934172, 0.356822, 0.000000,
    0.934172, -0.356822, 0.000000,
    -0.934172, 0.356822, 0.000000,
    -0.934172, -0.356822, 0.000000,
    0.000000, 0.934172, 0.356822,
    0.000000, 0.934172, -0.356822,
    0.356822, 0.000000, -0.934172,
    -0.356822, 0.000000, -0.934172,
    0.000000, -0.934172, -0.356822,
    0.000000, -0.934172, 0.356822,
    0.356822, 0.000000, 0.934172,
    -0.356822, 0.000000, 0.934172,
    0.577350, 0.577350, -0.577350,
    0.577350, 0.577350, 0.577350,
    -0.577350, 0.577350, -0.577350,
    -0.577350, 0.577350, 0.577350,
    0.577350, -0.577350, -0.577350,
    0.577350, -0.577350, 0.577350,
    -0.577350, -0.577350, -0.577350,
    -0.577350, -0.577350, 0.577350,
]

// 1..12, copied from OBJ file
const indices = [
    2, 3, 7,
    2, 8, 3,
    4, 5, 6,
    5, 4, 9,
    7, 6, 12,
    6, 7, 11,
    10, 11, 3,
    11, 10, 4,
    8,  9, 10,
    9, 8, 1,
    12, 1, 2,
    1, 12, 5,
    7, 3, 11,
    2, 7, 12,
    4, 6, 11,
    6, 5, 12,
    3, 8, 10,
    8, 2, 1,
    4, 10, 9,
    5, 9, 1
]

export function icosaGeometry(gl: WebGL2RenderingContext) : WebGLBuffer|null {
    let size = 20 * 3 * 6;
    let icosaData : Float32Array = new Float32Array(size)
    let i = 0;
    let scale = ICOSA_SCALE;
    for (let poly = 0; poly < 20; poly++) {
        for (let vert = 0; vert < 3; vert++) {
            let index = indices[poly*3 + vert] - 1
            // set vertex position
            icosaData[i++] = positions[index*3 + 0] * scale;
            icosaData[i++] = positions[index*3 + 1] * scale;
            icosaData[i++] = positions[index*3 + 2] * scale;
            // set normal, same for all face vertices
            icosaData[i++] = normals[poly*3 + 0];
            icosaData[i++] = normals[poly*3 + 1];
            icosaData[i++] = normals[poly*3 + 2];
        }
    }

    let icosaBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, icosaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, icosaData, gl.STATIC_DRAW);
    return icosaBuffer;
}
