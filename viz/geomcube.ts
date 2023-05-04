// @ts-nocheck

const CUBE_SCALE: number = 1.4;
const CUBE_POLYS: number = 12;
const positions: number [] = [
    // top left front: v 0
    -1, 1, 1,
    // top right front: v 1
    1, 1, 1,
    // bottom left front: v 2
    -1, -1, 1,
    // bottom right front: v 3
    1, -1, 1,
    // top left back: v 4
    -1, 1, -1,
    // top right back: v 5
    1, 1, -1,
    // bottom left back: v 6
    -1, -1, -1,
    // bottom right back: v 7
    1, -1, -1,
];

const normals = [
    // front
    0, 0, -1,
    0, 0, -1,
    // back
    0, 0, 1,
    0, 0, 1,
    // top
    0, 1, 0,
    0, 1, 0,
    // bottom
    0, -1, 0,
    0, -1, 0,
    // left
    1, 0, 0,
    1, 0, 0,
    // right
    -1, 0, 0,
    -1, 0, 0
];

const indices = [
    // front
    0, 1, 2,
    1, 3, 2,
    // back
    5, 4, 7,
    4, 6, 7,
    // top
    4, 5, 0,
    5, 1, 0,
    // bottom
    2, 3, 6,
    3, 7, 6,
    // left
    4, 2, 6,
    4, 0, 2,
    // right
    1, 5, 3,
    5, 7, 3
]

export function cubeGeometry(gl: WebGL2RenderingContext) : WebGLBuffer {
    // 6 sides, 2 polys per side = 12 polys
    const VERTEX_SIZE = 6;
    let size = 3 * CUBE_POLYS * VERTEX_SIZE;
    let cubeData : Float32Array = new Float32Array(size)
    let scale = CUBE_SCALE;
    let i = 0;
    for (let poly = 0; poly < CUBE_POLYS; poly++) {
        for (let vert = 0; vert < 3; vert++) {
            let index = indices[poly*3 + vert]
            // set vertex position
            cubeData[i++] = positions[index*3 + 0] * scale;
            cubeData[i++] = positions[index*3 + 1] * scale;
            cubeData[i++] = positions[index*3 + 2] * scale;
            // set normal, same for all face vertices
            cubeData[i++] = normals[poly*3 + 0];
            cubeData[i++] = normals[poly*3 + 1];
            cubeData[i++] = normals[poly*3 + 2];
        }
    }

    let cubeBuffer : WebGLBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeData, gl.STATIC_DRAW);
    return cubeBuffer;
}
