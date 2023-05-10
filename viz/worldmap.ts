
import { WORLD_WIDTH, WORLD_HEIGHT } from './core'

const NUM_XTILES: number = 6
const NUM_YTILES: number = 3
const POLYS_PER_TILE: number = 2
const VERTEX_SIZE: number = 4

export function initWorldMap(gl: WebGL2RenderingContext) : WebGLBuffer|null {
    console.log('initWorldMap')
    let nverts = NUM_XTILES * NUM_YTILES * POLYS_PER_TILE * 3;
    console.log('nverts ', nverts)
    let worldMapData : Float32Array = new Float32Array(nverts * VERTEX_SIZE)
    let i: number = 0;
    let udelta = 1 / NUM_XTILES
    let vdelta = 1 / NUM_YTILES
    for (let y = 0; y < NUM_YTILES; y++) {
        for (let x = 0; x < NUM_XTILES; x++) {
            let x1 = -WORLD_WIDTH/2 + x * WORLD_WIDTH/NUM_XTILES;
            let y1 = WORLD_HEIGHT/2 - y * WORLD_HEIGHT/NUM_YTILES;
            let x2 = x1 + WORLD_WIDTH/NUM_XTILES;
            let y2 = y1 - WORLD_HEIGHT/NUM_YTILES;
            let u1 = x/NUM_XTILES
            let v1 = y/NUM_YTILES
            let u2 = u1 + udelta;
            let v2 = v1 + vdelta;

            // top left
            worldMapData[i+0] = x1;
            worldMapData[i+1] = y1;
            worldMapData[i+2] = u1;
            worldMapData[i+3] = v1;
            i+= 4
            // bottom right
            worldMapData[i+0] = x2;
            worldMapData[i+1] = y2;
            worldMapData[i+2] = u2;
            worldMapData[i+3] = v2;
            i+= 4
            // bottom LEFT
            worldMapData[i+0] = x1;
            worldMapData[i+1] = y2;
            worldMapData[i+2] = u1;
            worldMapData[i+3] = v2;
            i+= 4
            // top left
            worldMapData[i+0] = x1;
            worldMapData[i+1] = y1;
            worldMapData[i+2] = u1;
            worldMapData[i+3] = v1;
            i+= 4
            // top right
            worldMapData[i+0] = x2;
            worldMapData[i+1] = y1;
            worldMapData[i+2] = u2;
            worldMapData[i+3] = v1;
            i+= 4
            // bottom right
            worldMapData[i+0] = x2;
            worldMapData[i+1] = y2;
            worldMapData[i+2] = u2;
            worldMapData[i+3] = v2;
            i+= 4
        }
    }
    console.log('worldMapData len ', worldMapData.length);
    let worldMapBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, worldMapBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, worldMapData, gl.STATIC_DRAW);
    return worldMapBuffer;

}
