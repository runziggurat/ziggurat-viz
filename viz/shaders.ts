
import { EShader, IShader } from './core'

export var glShaders : (WebGLProgram|null) []

export function createProgram(shader: IShader, gl: WebGL2RenderingContext) : WebGLProgram|null {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) return null;
    gl.shaderSource(vertexShader, shader.vertex);
    gl.compileShader(vertexShader);
  
    var compiled = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
    var compilationLog = gl.getShaderInfoLog(vertexShader);
  
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) return null;
    gl.shaderSource(fragmentShader, shader.fragment);
    gl.compileShader(fragmentShader);
  
    compiled = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
    compilationLog = gl.getShaderInfoLog(fragmentShader);
  
    let program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
  
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return null;
    }
    return program
}

export function initShadersGl(gl: WebGL2RenderingContext) {
    glShaders = new Array(EShader.Last)
    for (let i = 0; i < EShader.Last; i++) {
      glShaders[i] = createProgram(glslSrc[i], gl);
    }
}

const glslIcosa : IShader = {
    vertex: `#version 300 es
  uniform mat4 u_viewProjection;
  uniform sampler2D u_noiseTexture;
  uniform vec4 u_params;
  in vec3 a_position;
  in vec3 a_normal;
  in vec4 a_color;
  in vec4 a_metadata;
  in mat4 a_model;
  out vec4 vColor;
  void main(){
    float secs = u_params.x * a_metadata.x * 0.000005;
    vec4 brownian = texture(u_noiseTexture, vec2(secs,0.5)) * 1.2;
    vec3 lightDirection = normalize(vec3(0.2, 0.2, -1.0));
    mat4 normalMatrix = inverse(a_model);
    mat4 transposed = transpose(normalMatrix);
    vec3 transformedNormal = normalize((transposed * vec4(a_normal, 1.0)).xyz);
    float light = dot(transformedNormal, lightDirection);
    light = 0.3 + light * 0.7;
    vColor = vec4(a_color.r * light, a_color.g * light, a_color.b * light, 1.0);
    gl_Position = u_viewProjection * a_model * vec4(a_position.xyz, 1.0);
  }
  `,
    fragment: `#version 300 es
  precision highp float;
  in vec4 vColor;
  out vec4 fragColor;
  void main() {
    fragColor = vColor;
  }
  `
  }

  const glslPicker : IShader = {
    vertex: `#version 300 es
  uniform mat4 u_viewProjection;
  uniform sampler2D u_noiseTexture;
  uniform vec4 u_params;
  in vec3 a_position;
  in vec4 a_pickerColor;
  in vec4 a_metadata;
  in mat4 a_model;
  out vec4 vColor;
  void main(){
    float secs = u_params.x * a_metadata.x * 0.000005;
    vec4 brownian = texture(u_noiseTexture, vec2(secs,0.5)) * 1.2;
    vColor = a_pickerColor;
    gl_Position = u_viewProjection * a_model * vec4(a_position.xyz, 1.0);
  }
  `,
    fragment: `#version 300 es
  precision highp float;
  in vec4 vColor;
  out vec4 fragColor;
  void main() {
    fragColor = vColor;
  }
  `
  }

  const glslWorldMap : IShader = {
    vertex: `#version 300 es
  uniform mat4 u_viewProjection;
  in vec2 a_position;
  in vec2 a_uv;
  out vec2 vUv;

  void main(){
    vUv = a_uv;
    gl_Position = u_viewProjection * vec4(a_position, 0.0, 1.0);
  }
  `,
  fragment: `#version 300 es
  precision highp float;
  in vec2 vUv;
  uniform sampler2D u_worldMapTexture;
  out vec4 fragColor;
  void main() {
    float latitude = vUv.x - 0.5;
    float longitude = vUv.y - 0.5;
    float theta = asin(1.732050808*longitude);
    float x = latitude / cos(theta) + 0.5;
    vec2 transformedUv = vec2(x, vUv.y);
    if (transformedUv.x < 0.0 || transformedUv.x > 1.0) {
        fragColor = vec4(0.0);
    } else {
        vec4 pixel = texture(u_worldMapTexture, transformedUv);
        fragColor = vec4(pixel.rgb * 0.3 + vec3(0.2, 0.2, 0.2), 1.0);
    }
  }
  `
  }

  const glslConnection : IShader = {
    vertex: `#version 300 es
  uniform mat4 u_viewProjection;
  in vec3 a_position;
  in vec4 a_color;
  in vec3 a_vertex1;
  in vec3 a_vertex2;
  out vec4 vColor;
  void main(){
    vColor = a_color;
    vec3 vertex = a_vertex1 + a_vertex2 * a_position.x;
    gl_Position = u_viewProjection * vec4(vertex.xyz, 1.0);
  }
  `,
    fragment: `#version 300 es
  precision highp float;
  in vec4 vColor;
  out vec4 fragColor;
  void main() {
    fragColor = vColor;
  }
  `
  }

  const glslGradient : IShader = {
    vertex: `#version 300 es
  in vec2 a_position;
  in vec2 a_uv;
  out vec2 vUv;

  void main(){
    vUv = a_uv;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
  `,
  fragment: `#version 300 es
  precision highp float;
  in vec2 vUv;
  uniform sampler2D u_gradientTexture;
  out vec4 fragColor;
  void main() {
     fragColor = texture(u_gradientTexture, vUv);
  }
  `
  }

let glslSrc : IShader [] = [
    glslIcosa,
    glslPicker,
    glslWorldMap,
    glslConnection,
    glslGradient
]
