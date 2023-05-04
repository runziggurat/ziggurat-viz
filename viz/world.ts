// @ts-nocheck

/// <reference path="../node_modules/@webgpu/types/dist/index.d.ts" />

import { IState, EShader, INode, EColorMode, ENodeType, IGeolocation } from './core'
import { CNode } from './node'
import { vec2, vec3, vec4, mat4 } from 'gl-matrix'
import { icosaGeometry } from './geomicosa'
import { gradientGeometry } from './geomgradient'
import { histogramGeometry } from './geomhistogram'
import { cubeGeometry } from './geomcube'
import { lineGeometry } from './geomline'
import { CPicker } from './picker';
import { CGroup } from './group';
import { PCamera } from './camera';
import { initWorldMap } from './worldmap'
import { glShaders } from './shaders';
import { createRandomTexture, loadTexture } from './util';
import { getHistogramTexture } from './histogram'

const NODE_TRANSFORM_SIZE: number = 28;
const CONNECTION_TRANSFORM_SIZE: number = 12;
const MAX_SUPERNODE_SCALE: number = 2.0;
const MIN_SUPERNODE_SCALE: number = 0.5;
const BEHIND_CAMERA_DISTANCE: number = 1000000;
const TINY_GRAPH_NODES: number = 400;
const COLOR_MAGENTA: vec4 = vec4.fromValues(0.9, 0.0, 0.9, 1.0);
const COLOR_BLACK: vec4 = vec4.fromValues(0.2, 0.2, 0.2, 1.0);

export class CWorld {
    public istate: IState;
    public nodes: CNode [];
    public singleNodes: CNode [];
    public superMap: Map<string, CNode>;
    public superNodes: CNode [];
    public  gl: WebGL2RenderingContext;
    private noiseTexture: WebGLTexture;
    private worldMapTexture: WebGLTexture;
    private gradientTexture: WebGLTexture;
    private histogramBTexture: WebGLTexture;
    private histogramCTexture: WebGLTexture;
    private histogramDTexture: WebGLTexture;
    private currentHistogramTexture: WebGLTexture;
    private picker: CPicker;

    public topTexture: WebGLTexture;
    public inDrag: boolean;
    public inTap: boolean;
    public inSwipe: boolean;
    private icosaGeometry: WebGLBuffer;
    private cubeGeometry: WebGLBuffer;
    private gradientGeometry: WebGLBuffer;
    private histogramGeometry: WebGLBuffer;
    private worldMapGeometry: WebGLBuffer;
    private lineGeometry: WebGLBuffer;

    private mainSingleGroup: CGroup;
    private mainSuperGroup: CGroup;
    private mainSubGroup: CGroup;

    private pickerSingleGroup: CGroup;
    private pickerSuperGroup: CGroup;
    private pickerSubGroup: CGroup;

    private connectionBuffer: WebGLBuffer;
    private selectedSuperNode: CNode;
    private connectionData: Float32Array;
    private worldMapVao: WebGLVertexArrayObject;
    private gradientVao: WebGLVertexArrayObject;
    private histogramVao: WebGLVertexArrayObject;
    private connectionVao: WebGLVertexArrayObject;
    public icosaVPLoc: WebGLUniformLocation;
    public worldMapVPLoc: WebGLUniformLocation;
    public connectionVPLoc: WebGLUniformLocation;
    public paramsLoc: WebGLUniformLocation;
    public noiseTextureLoc: WebGLUniformLocation;
    public worldMapTextureLoc: WebGLUniformLocation;
    public gradientTextureLoc: WebGLUniformLocation;
    public pickerVPLoc: WebGLUniformLocation;
    public pickerParamsLoc: WebGLUniformLocation;
    public pickerNoiseTextureLoc: WebGLUniformLocation;
    private startTime: number;
    private params: vec4;
    private selectedId: number;
    private white: vec4;;
    private maxConnections: number;
    private numConnections: number;
    private minConnections: number;
    private maxSubnodes: number;
    private drawConnections: boolean;
    private numConnectionsToDraw: number;
    public connectionMode: boolean;
    public displayCommand: boolean;
    public displayFps: boolean;
    public displayGradient: boolean;
    public displayHistogram: boolean;
    private minBetweenness: number;
    private maxBetweenness: number;
    private minCloseness: number;
    private maxCloseness: number;
    public colorMode: EColorMode;
    private canvas: HTMLCanvasElement;
    private camera: PCamera;
    private betweennessDescription: string;
    private closenessDescription: string;
    private degreeDescription: string;

    public timeNode: Text;
    public fpsNode: Text;
    public ipNode: Text;
    public networkTypeNode: Text;
    public betweennessNode: Text;
    public closenessNode: Text;
    public connectionsNode: Text;
    public latitudeNode: Text;
    public longitudeNode: Text;
    public cityNode: Text;
    public countryNode: Text;
    public subnodeIndexNode: Text;
    public numSubnodesNode: Text;
    public colorModeNode: Text;
    public gradientNode: Text;
    public initialized: boolean;
    public isTiny: boolean;

    private initTextNodes() {
        // Create text nodes to save some time for the browser.
        this.timeNode = document.createTextNode("");
        this.fpsNode = document.createTextNode("");
        this.ipNode = document.createTextNode("");
        this.networkTypeNode = document.createTextNode("");
        this.betweennessNode = document.createTextNode("");
        this.closenessNode = document.createTextNode("");
        this.connectionsNode = document.createTextNode("");
        this.latitudeNode = document.createTextNode("");
        this.longitudeNode = document.createTextNode("");
        this.subnodeIndexNode = document.createTextNode("");
        this.numSubnodesNode = document.createTextNode("");
        this.cityNode = document.createTextNode("");
        this.countryNode = document.createTextNode("");
        this.colorModeNode = document.createTextNode("");
        this.gradientNode = document.createTextNode("");

        this.updateColorDisplay();
        this.updateNodeColors();

        // Add those text nodes where they need to go
        document.querySelector("#time").appendChild(this.timeNode);
        document.querySelector("#fps").appendChild(this.fpsNode);
        document.querySelector("#ip").appendChild(this.ipNode);
        document.querySelector("#networktype").appendChild(this.networkTypeNode);
        document.querySelector("#betweenness").appendChild(this.betweennessNode);
        document.querySelector("#closeness").appendChild(this.closenessNode);
        document.querySelector("#connections").appendChild(this.connectionsNode);
        document.querySelector("#latitude").appendChild(this.latitudeNode);
        document.querySelector("#longitude").appendChild(this.longitudeNode);
        document.querySelector("#subnode").appendChild(this.subnodeIndexNode);
        document.querySelector("#numsubnodes").appendChild(this.numSubnodesNode);
        document.querySelector("#city").appendChild(this.cityNode);
        document.querySelector("#country").appendChild(this.countryNode);
        document.querySelector("#colormode").appendChild(this.colorModeNode);
        document.querySelector("#gradient").appendChild(this.gradientNode);
        document.getElementById("overlayRight").style.visibility = "hidden";
    }

    public constructor(istate: IState, gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, camera: PCamera) {
        this.istate = istate;
        this.canvas = canvas;
        this.camera = camera;
        this.gl = gl;
        this.inDrag = false;
        this.nodes = new Array();
        this.singleNodes = new Array();
        this.superNodes = new Array();
        this.superMap = new Map();
        this.startTime = Date.now();
        this.params = vec4.create();
        this.picker = new CPicker(gl);
        this.selectedId = -1;
        this.white = vec4.fromValues(1, 1, 1, 1);
        this.maxConnections = 0;
        this.numConnections = 0;
        this.minConnections = 10000;
        this.drawConnections = false;
        this.numConnectionsToDraw = 0;
        this.connectionMode = false;
        this.displayCommand = true;
        this.displayFps = true;
        this.displayGradient = true;
        this.displayHistogram = false;
        this.minBetweenness = 100;
        this.maxBetweenness = 0;
        this.minCloseness = 100;
        this.maxCloseness = 0;
        this.colorMode = EColorMode.Degree
        this.initTextNodes();
        this.initialized = false;
        this.mainSingleGroup = new CGroup();
        this.pickerSingleGroup = new CGroup();
        this.mainSuperGroup = new CGroup();
        this.pickerSuperGroup = new CGroup();
        this.mainSubGroup = new CGroup();
        this.pickerSubGroup = new CGroup();
        this.selectedSuperNode = null;
        this.maxSubnodes = 0;
    };

    private updateNodeColors() {
        let n: number = 0;
        for (let node of this.singleNodes) {
            this.mainSingleGroup.transformData.set(node.getCurrentColor(this.colorMode), n);
            n += NODE_TRANSFORM_SIZE;
        }
        n = 0;
        if (this.selectedSuperNode && this.selectedSuperNode.isOpenedSuper) {
            for (let node of this.selectedSuperNode.subNodes) {
                this.mainSubGroup.transformData.set(node.getCurrentColor(this.colorMode), n);
                n += NODE_TRANSFORM_SIZE;
            }
        }
    }

    public updateColorDisplay() {
        switch (this.colorMode) {
            case EColorMode.Between:
                this.colorModeNode.nodeValue = 'betweenness';
                this.currentHistogramTexture = this.histogramBTexture;
                document.getElementById("gradient").textContent = this.betweennessDescription;
                break;
            case EColorMode.Close:
                this.colorModeNode.nodeValue = 'closeness';
                this.currentHistogramTexture = this.histogramCTexture;
                document.getElementById("gradient").textContent = this.closenessDescription;
                break;
            case EColorMode.Degree:
                this.colorModeNode.nodeValue = 'degree';
                this.currentHistogramTexture = this.histogramDTexture;
                document.getElementById("gradient").textContent = this.degreeDescription;
                break;
        }
        console.log('updateColorDisplay this.degreeDescription ', this.degreeDescription);
        document.getElementById("gradient").style.visibility = this.displayGradient ? "visible" : "hidden";
    }

    public cycleColorMode() {
        this.colorMode++;
        if (this.colorMode == EColorMode.Last) {
            this.colorMode = EColorMode.Between;
        }
        this.updateColorDisplay();
        this.updateNodeColors();
    }

    public getNode(id: number) : CNode {
        if (id < this.istate.nodes.length) {
            return this.nodes[id];
        } else {
            return this.superNodes[id-this.istate.nodes.length];
        }
    }

    public update() {
        if (!this.mainSingleGroup) {
            return;
        }
        // let now = Date.now();
        for (let node of this.nodes) {
            if (node.inode.ignore) continue;
            node.incRotationY(2 * Math.PI / 180 * node.numConnections / 2400);
            node.updateMatrix();
        }
        for (let node of this.superNodes) {
            node.incRotationY(2 * Math.PI / 180 * (0.36 + node.inode.num_subnodes/2400));
            node.updateMatrix();
        }
        this.updateSingleNodeData();
        this.updateSuperNodeData();
        this.updateSubNodeData();
        this.updatePickerData();
    }

    private updateSuperStatus(id) {
        // first, restore supernode to default state if opened
        if (id == -1) {
            if (this.selectedSuperNode && this.selectedSuperNode.id != id) {
                if (this.selectedSuperNode.isOpenedSuper) {
                    this.selectedSuperNode.isOpenedSuper = false;
                    this.selectedSuperNode.position[2] -= BEHIND_CAMERA_DISTANCE;
                }
                this.selectedSuperNode = null;
            }
            return;
        }

        let node = this.getNode(id);
        if (node.nodeType != ENodeType.Super) {
            return;
        }

        if (this.selectedSuperNode) {
            if (this.selectedSuperNode.id != id) {
                if (this.selectedSuperNode.isOpenedSuper) {
                    this.selectedSuperNode.isOpenedSuper = false;
                    this.selectedSuperNode.position[2] -= BEHIND_CAMERA_DISTANCE;
                }
                this.selectedSuperNode = null;
            }
            if (node == this.selectedSuperNode)  {
                if (!node.isOpenedSuper) {
                    // open up the super node
                    node.isOpenedSuper = true;
                    this.selectedSuperNode.position[2] += BEHIND_CAMERA_DISTANCE;
                    this.updateNodeColors();
                    let n = 0;
                    for (let subnode of node.subNodes) {
                        this.mainSubGroup.transformData.set(subnode.getCurrentColor(this.colorMode), n);
                        this.mainSubGroup.transformData.set(subnode.metadata, n+4);
                        this.mainSubGroup.transformData.set(subnode.idColor, n+8);
                        this.mainSubGroup.transformData.set(subnode.matWorld, n+12);
                        n += NODE_TRANSFORM_SIZE
                    }
                    console.log('new subnodes has length ', node.subNodes.length);
                }
            } else {
                this.selectedSuperNode = node;
                this.selectedSuperNode.isOpenedSuper = false;
            }
        } else {
            this.selectedSuperNode = node;
        }
    }

    public handleClick(x: number, y: number) {
        this.inDrag = true;
        let screenCoords : vec2 = vec2.fromValues(x/this.canvas.width, 1 - y/this.canvas.height )
        this.picker.preRender(screenCoords[0], screenCoords[1])
        this.renderPicker();
        let id = this.picker.postRender();
        console.log(`  got id ${id}`)
        if (id >= 0) {
            let node = this.getNode(id);
            this.ipNode.nodeValue = node.nodeType != ENodeType.Super ? 'IP: ' + node.inode.addr : `Super Node: ${node.subNodes.length} nodes`;
            this.networkTypeNode.nodeValue = node.inode.network_type;
            this.betweennessNode.nodeValue = node.nodeType != ENodeType.Super ? node.inode.betweenness.toFixed(6) : '--';
            this.closenessNode.nodeValue = node.nodeType != ENodeType.Super ? node.inode.closeness.toFixed(6) : '--';
            this.connectionsNode.nodeValue = node.nodeType != ENodeType.Super ? node.numConnections.toString() : '--';
            this.latitudeNode.nodeValue = node.inode.geolocation.coordinates.latitude.toFixed(4);
            this.longitudeNode.nodeValue = node.inode.geolocation.coordinates.longitude.toFixed(4);
            this.cityNode.nodeValue = node.inode.geolocation.city;
            this.countryNode.nodeValue = node.inode.geolocation.country;
            this.subnodeIndexNode.nodeValue = node.nodeType != ENodeType.Sub ? '--' : node.inode.subnode_index.toString();
            this.numSubnodesNode.nodeValue = node.nodeType != ENodeType.Sub ? '--' : node.inode.num_subnodes.toString();
            document.getElementById("overlayRight").style.visibility = "visible";
        } else {
            document.getElementById("overlayRight").style.visibility = "hidden";
        }
        this.updateSuperStatus(id);
        if (id == this.selectedId) return;
        if (this.selectedId != -1) {
            // restore color
            let node = this.getNode(this.selectedId);
            if (node.nodeType == ENodeType.Single) {
                this.mainSingleGroup.transformData.set(this.singleNodes[node.index].getCurrentColor(this.colorMode), node.index*NODE_TRANSFORM_SIZE);
            } else if (node.nodeType == ENodeType.Super) {
                this.mainSuperGroup.transformData.set(this.superNodes[node.index].getCurrentColor(this.colorMode), node.index*NODE_TRANSFORM_SIZE);
            } else if (node.nodeType == ENodeType.Sub && node.superNode == this.selectedSuperNode) {
                this.mainSubGroup.transformData.set(this.selectedSuperNode.subNodes[node.index].getCurrentColor(this.colorMode), node.index*NODE_TRANSFORM_SIZE);
            }
        }
        if (id != -1) {
            let node = this.getNode(id);
            if (node.nodeType == ENodeType.Single) {
                this.mainSingleGroup.transformData.set(this.white, node.index*NODE_TRANSFORM_SIZE);
            } else if (node.nodeType == ENodeType.Super) {
                this.mainSuperGroup.transformData.set(this.white, node.index*NODE_TRANSFORM_SIZE);
            } else {
                console.log('subnode offset: ', node.subnodeOffset);
                this.mainSubGroup.transformData.set(this.white, node.index*NODE_TRANSFORM_SIZE);
            }
            if (!this.isTiny) {
                this.numConnectionsToDraw = this.setConnectionData(node);
                this.drawConnections = this.numConnectionsToDraw > 0;
            }
        } else {
            if (!this.isTiny) {
                this.drawConnections = false;
            }
            this.inDrag = true;
        }
        this.selectedId = id
    }

    public handleMouseMove(dx: number, dy: number) {
        if (this.inDrag) {
            this.camera.drag(dx, dy);
        }
    }


    public handleClickRelease(x: number, y: number) {
        if (this.inDrag) {
            this.inDrag = false;
        }
    }

    private initTransformData() {
        let gl = this.gl;

        this.mainSingleGroup.transformData = new Float32Array(this.singleNodes.length * NODE_TRANSFORM_SIZE);
        let n: number = 0;
        for (let node of this.singleNodes) {
            this.mainSingleGroup.transformData.set(node.getCurrentColor(EColorMode.Degree), n);
            this.mainSingleGroup.transformData.set(node.metadata, n+4);
            this.mainSingleGroup.transformData.set(node.idColor, n+8);
            this.mainSingleGroup.transformData.set(node.matWorld, n+12);
            n += NODE_TRANSFORM_SIZE
        }
        this.mainSingleGroup.transformBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mainSingleGroup.transformBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.mainSingleGroup.transformData, gl.STATIC_DRAW);
        this.pickerSingleGroup.transformBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pickerSingleGroup.transformBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.mainSingleGroup.transformData, gl.STATIC_DRAW);

        this.mainSuperGroup.transformData = new Float32Array(this.superNodes.length * NODE_TRANSFORM_SIZE);
        console.log('superNodes size ',this.superNodes.length);
        n = 0;
        for (let node of this.superNodes) {
            this.mainSuperGroup.transformData.set(node.degreeColor, n);
            this.mainSuperGroup.transformData.set(node.metadata, n+4);
            this.mainSuperGroup.transformData.set(node.idColor, n+8);
            this.mainSuperGroup.transformData.set(node.matWorld, n+12);
            n += NODE_TRANSFORM_SIZE;
        }

        this.mainSuperGroup.transformBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mainSuperGroup.transformBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.mainSuperGroup.transformData, gl.STATIC_DRAW);
        this.pickerSuperGroup.transformBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pickerSuperGroup.transformBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.mainSuperGroup.transformData, gl.STATIC_DRAW);

        this.mainSubGroup.transformData = new Float32Array(this.maxSubnodes * NODE_TRANSFORM_SIZE);
        this.mainSubGroup.transformBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mainSubGroup.transformBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.mainSubGroup.transformData, gl.STATIC_DRAW);
        this.pickerSubGroup.transformBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pickerSubGroup.transformBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.mainSubGroup.transformData, gl.STATIC_DRAW);

    }

    private initConnectionData(numConnections: number) {
        let gl = this.gl
        this.connectionData = new Float32Array(numConnections * CONNECTION_TRANSFORM_SIZE);
        this.connectionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.connectionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.connectionData, gl.STATIC_DRAW);
    }

    private setConnectionData(node: CNode) : number {
        if (node.nodeType == ENodeType.Super) {
            return 0;
        }
        let gl = this.gl;
        let n: number = 0;
        for (let index of node.inode.connections) {
            let connection: CNode = this.nodes[index];
            if (connection.inode.ignore) continue;
            this.connectionData.set(connection.getCurrentColor(this.colorMode), n);
            this.connectionData.set(node.position, n+4);
            let delta: vec3 = vec3.create();
            let connPosition: vec3 = connection.getConnectionPosition();
            vec3.sub(delta, connPosition, node.position);
            this.connectionData.set(delta, n+8);
            n += 12;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.connectionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.connectionData, gl.STATIC_DRAW);
        return node.numConnections;
    }

    private setGlobalsConnectionData() {
        let gl = this.gl;
        let n: number = 0;
        for (let node of this.nodes) {
            for (let index of node.inode.connections) {
                let connection: CNode = this.nodes[index];
                if (connection.inode.ignore) continue;
                this.connectionData.set(this.isTiny ? COLOR_BLACK : connection.getCurrentColor(this.colorMode), n);
                this.connectionData.set(node.position, n+4);
                let delta: vec3 = vec3.create();
                let connPosition: vec3 = connection.getConnectionPosition();
                vec3.sub(delta, connPosition, node.position);
                this.connectionData.set(delta, n+8);
                n += 12;
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.connectionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.connectionData, gl.STATIC_DRAW);
    }

    private updateSingleNodeData() {
        let gl = this.gl
        let n: number = 12;
        for (let node of this.singleNodes) {
            this.mainSingleGroup.transformData.set(node.matWorld, n);
            n += 28
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mainSingleGroup.transformBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.mainSingleGroup.transformData, gl.STATIC_DRAW);
    }

    private updateSuperNodeData() {
        let gl = this.gl
        let n: number = 12;
        for (let node of this.superNodes) {
            this.mainSuperGroup.transformData.set(node.matWorld, n);
            n += 28
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mainSuperGroup.transformBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.mainSuperGroup.transformData, gl.STATIC_DRAW);
    }

    private updateSubNodeData() {
        let gl = this.gl
        if (!this.selectedSuperNode || !this.selectedSuperNode.isOpenedSuper) return;

        let n: number = 12;
        for (let node of this.selectedSuperNode.subNodes) {
            this.mainSubGroup.transformData.set(node.matWorld, n);
            n += 28
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mainSubGroup.transformBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.mainSubGroup.transformData, gl.STATIC_DRAW);
    }

    private updatePickerData() {
        let gl = this.gl
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pickerSingleGroup.transformBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.mainSingleGroup.transformData, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.pickerSuperGroup.transformBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.mainSuperGroup.transformData, gl.STATIC_DRAW);
        if (!this.selectedSuperNode || !this.selectedSuperNode.isOpenedSuper) return;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.pickerSubGroup.transformBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.mainSubGroup.transformData, gl.STATIC_DRAW);
    }

    private initMainVao(group: CGroup, geometry: WebGLBuffer) {
        let gl = this.gl
        let positionLoc = gl.getAttribLocation(glShaders[EShader.Icosa], 'a_position');
        let colorLoc = gl.getAttribLocation(glShaders[EShader.Icosa], 'a_color');
        let metadataLoc = gl.getAttribLocation(glShaders[EShader.Icosa], 'a_metadata');
        let modelLoc = gl.getAttribLocation(glShaders[EShader.Icosa], 'a_model');
        let normalLoc = gl.getAttribLocation(glShaders[EShader.Icosa], 'a_normal');
        group.vao = gl.createVertexArray();
        gl.bindVertexArray(group.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, group.transformBuffer);
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, NODE_TRANSFORM_SIZE*4, 0);
        gl.enableVertexAttribArray(metadataLoc);
        gl.vertexAttribPointer(metadataLoc, 4, gl.FLOAT, false, NODE_TRANSFORM_SIZE*4, 16);
        gl.enableVertexAttribArray(modelLoc);
        gl.vertexAttribPointer(modelLoc, 4, gl.FLOAT, false, NODE_TRANSFORM_SIZE*4, 48);
        gl.enableVertexAttribArray(modelLoc+1);
        gl.vertexAttribPointer(modelLoc+1, 4, gl.FLOAT, false, NODE_TRANSFORM_SIZE*4, 64);
        gl.enableVertexAttribArray(modelLoc+2);
        gl.vertexAttribPointer(modelLoc+2, 4, gl.FLOAT, false, NODE_TRANSFORM_SIZE*4, 80);
        gl.enableVertexAttribArray(modelLoc+3);
        gl.vertexAttribPointer(modelLoc+3, 4, gl.FLOAT, false, NODE_TRANSFORM_SIZE*4, 96);

        gl.vertexAttribDivisor(modelLoc,1);
        gl.vertexAttribDivisor(modelLoc+1,1);
        gl.vertexAttribDivisor(modelLoc+2,1);
        gl.vertexAttribDivisor(modelLoc+3,1);
        gl.vertexAttribDivisor(colorLoc,1);
        gl.vertexAttribDivisor(metadataLoc,1);

        gl.bindBuffer(gl.ARRAY_BUFFER, geometry);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(normalLoc);
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 24, 12);
    }


    private initNodesGl() {
        let gl = this.gl;
        this.icosaVPLoc = gl.getUniformLocation(glShaders[EShader.Icosa], 'u_viewProjection');
        this.paramsLoc = gl.getUniformLocation(glShaders[EShader.Icosa], 'u_params');
        this.noiseTextureLoc = gl.getUniformLocation(glShaders[EShader.Icosa], 'u_noiseTexture');

        this.icosaGeometry = icosaGeometry(gl);
        this.cubeGeometry = cubeGeometry(gl);

        this.initTransformData();
        this.initMainVao(this.mainSingleGroup, this.icosaGeometry);
        this.initMainVao(this.mainSuperGroup, this.cubeGeometry);
        this.initMainVao(this.mainSubGroup, this.icosaGeometry);
    }

    private initPickerVao(group: CGroup, geometry: WebGLBuffer) {
        let gl = this.gl
        let positionLoc = gl.getAttribLocation(glShaders[EShader.Picker], 'a_position');
        let pickerColorLoc = gl.getAttribLocation(glShaders[EShader.Picker], 'a_pickerColor');
        let metadataLoc = gl.getAttribLocation(glShaders[EShader.Picker], 'a_metadata');
        let modelLoc = gl.getAttribLocation(glShaders[EShader.Picker], 'a_model');

        group.vao = gl.createVertexArray();
        gl.bindVertexArray(group.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, group.transformBuffer);
        gl.enableVertexAttribArray(metadataLoc);
        gl.vertexAttribPointer(metadataLoc, 4, gl.FLOAT, false, NODE_TRANSFORM_SIZE*4, 16);
        gl.enableVertexAttribArray(pickerColorLoc);
        gl.vertexAttribPointer(pickerColorLoc, 4, gl.FLOAT, false, NODE_TRANSFORM_SIZE*4, 32);
        gl.enableVertexAttribArray(modelLoc);
        gl.vertexAttribPointer(modelLoc+0, 4, gl.FLOAT, false, NODE_TRANSFORM_SIZE*4, 48);
        gl.enableVertexAttribArray(modelLoc+1);
        gl.vertexAttribPointer(modelLoc+1, 4, gl.FLOAT, false, NODE_TRANSFORM_SIZE*4, 64);
        gl.enableVertexAttribArray(modelLoc+2);
        gl.vertexAttribPointer(modelLoc+2, 4, gl.FLOAT, false, NODE_TRANSFORM_SIZE*4, 80);
        gl.enableVertexAttribArray(modelLoc+3);
        gl.vertexAttribPointer(modelLoc+3, 4, gl.FLOAT, false, NODE_TRANSFORM_SIZE*4, 96);

        gl.vertexAttribDivisor(modelLoc+0,1);
        gl.vertexAttribDivisor(modelLoc+1,1);
        gl.vertexAttribDivisor(modelLoc+2,1);
        gl.vertexAttribDivisor(modelLoc+3,1);
        gl.vertexAttribDivisor(pickerColorLoc,1);
        gl.vertexAttribDivisor(metadataLoc,1);

        gl.bindBuffer(gl.ARRAY_BUFFER, geometry);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 24, 0);
    }

    private initPickerGl() {
        let gl = this.gl;
        this.pickerVPLoc = gl.getUniformLocation(glShaders[EShader.Picker], 'u_viewProjection');
        this.pickerParamsLoc = gl.getUniformLocation(glShaders[EShader.Picker], 'u_params');
        this.pickerNoiseTextureLoc = gl.getUniformLocation(glShaders[EShader.Picker], 'u_noiseTexture');

        this.initPickerVao(this.pickerSingleGroup, this.icosaGeometry);
        this.initPickerVao(this.pickerSuperGroup, this.cubeGeometry);
        this.initPickerVao(this.pickerSubGroup, this.icosaGeometry);
    }

    private initWorldMapGl() {
        let gl = this.gl;
        this.worldMapVPLoc = gl.getUniformLocation(glShaders[EShader.WorldMap], 'u_viewProjection');
        this.worldMapTextureLoc = gl.getUniformLocation(glShaders[EShader.WorldMap], 'u_worldMapTexture');

        this.worldMapGeometry = initWorldMap(gl)
        this.worldMapVao = gl.createVertexArray();
        gl.bindVertexArray(this.worldMapVao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.worldMapGeometry);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    }

    private initGradientGl() {
        let gl = this.gl;
        this.gradientTextureLoc = gl.getUniformLocation(glShaders[EShader.Gradient], 'u_gradientTexture');
        this.gradientGeometry = gradientGeometry(gl)
        this.gradientVao = gl.createVertexArray();
        gl.bindVertexArray(this.gradientVao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.gradientGeometry);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    }
    private initHistogramGl() {
        let gl = this.gl;
        this.gradientTextureLoc = gl.getUniformLocation(glShaders[EShader.Gradient], 'u_gradientTexture');
        this.histogramGeometry = histogramGeometry(gl)
        this.histogramVao = gl.createVertexArray();
        gl.bindVertexArray(this.histogramVao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.histogramGeometry);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    }

    initConnectionsGl() {
        let gl = this.gl;
        let positionLoc = gl.getAttribLocation(glShaders[EShader.Connection], 'a_position');
        let colorLoc = gl.getAttribLocation(glShaders[EShader.Connection], 'a_color');
        let vertex1Loc = gl.getAttribLocation(glShaders[EShader.Connection], 'a_vertex1');
        let vertex2Loc = gl.getAttribLocation(glShaders[EShader.Connection], 'a_vertex2');
        this.connectionVPLoc = gl.getUniformLocation(glShaders[EShader.Connection], 'u_viewProjection');

        this.lineGeometry = lineGeometry(gl)
        this.connectionVao = gl.createVertexArray();
        gl.bindVertexArray(this.connectionVao);

        this.initConnectionData(this.isTiny ? this.numConnections: this.maxConnections);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.connectionBuffer);
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, CONNECTION_TRANSFORM_SIZE*4, 0);
        gl.enableVertexAttribArray(vertex1Loc);
        gl.vertexAttribPointer(vertex1Loc, 4, gl.FLOAT, false, CONNECTION_TRANSFORM_SIZE*4, 16);
        gl.enableVertexAttribArray(vertex2Loc);
        gl.vertexAttribPointer(vertex2Loc, 4, gl.FLOAT, false, CONNECTION_TRANSFORM_SIZE*4, 32);

        gl.vertexAttribDivisor(colorLoc,1);
        gl.vertexAttribDivisor(vertex1Loc,1);
        gl.vertexAttribDivisor(vertex2Loc,1);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.lineGeometry);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 12, 0);
        if (this.isTiny) {
            this.setGlobalsConnectionData();
        }
    }

    public async initTexturesGl() {
        let gl = this.gl;
        this.noiseTexture = createRandomTexture(gl, 1024, 1);
        let width = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        console.log('max width is ', width);
        let precision = gl.getParameter(gl.DEPTH_BITS) ;
        console.log('precision is ', precision);
        if (width >= 8192) {
            this.worldMapTexture = await loadTexture(gl, "/data/world-mono-8k.png");
        } else {
            this.worldMapTexture = await loadTexture(gl, "/data/world-mono-4k.png");
        }
        this.gradientTexture = await loadTexture(gl, "/data/gradient.jpeg");
        this.histogramBTexture = getHistogramTexture(gl, this.istate.histograms, 'betweenness');
        console.log('this.histogramBTexture ', this.histogramBTexture);
        this.histogramCTexture = getHistogramTexture(gl, this.istate.histograms, 'closeness');
        console.log('this.histogramCTexture ', this.histogramCTexture);
        this.histogramDTexture = getHistogramTexture(gl, this.istate.histograms, 'degree');
        console.log('this.histogramDTexture ', this.histogramDTexture);
        this.currentHistogramTexture = this.histogramDTexture;

    }

    private updateStats(inode: INode) {
        this.numConnections += inode.connections.length;
        if (inode.connections.length > this.maxConnections) {
            this.maxConnections = inode.connections.length;
        }
        if (inode.connections.length < this.minConnections) {
            this.minConnections = inode.connections.length;
        }
        if (inode.betweenness < this.minBetweenness) {
            this.minBetweenness = inode.betweenness;
        }
        if (inode.betweenness > this.maxBetweenness) {
            this.maxBetweenness = inode.betweenness;
        }
        if (inode.closeness < this.minCloseness) {
            this.minCloseness = inode.closeness;
        }
        if (inode.closeness > this.maxCloseness) {
            this.maxCloseness = inode.closeness;
        }
    }

    private colorFromNormalizedValue(v: number) : vec4 {
        if (v < 0.25) {
            // blue -> cyan
            v = v * 4;
            return vec4.fromValues(0, v, 1, 1);
        } else if (v < 0.5) {
            // cyan -> green
            v = (v-0.25) * 4;
            return vec4.fromValues(0, 1, 1-v, 1);
        } else if (v < 0.75) {
            // green -> yellow
            v = (v-0.50) * 4;
            return vec4.fromValues(v, 1, 0, 1);
        } else {
            // yellow -> red
            v = (v-0.75) * 4;
            return vec4.fromValues(1, 1-v, 0, 1);
        }
    }

    private setAuxColors() {
        for (let node of this.nodes) {
            let b = (node.inode.betweenness - this.minBetweenness) / (this.maxBetweenness - this.minBetweenness);
            node.betweenColor = this.colorFromNormalizedValue(b);

            let c =  (node.inode.closeness - this.minCloseness) / (this.maxCloseness - this.minCloseness);
            node.closeColor = this.colorFromNormalizedValue(c);

            let d =  (node.numConnections - this.minConnections) / (this.maxConnections - this.minConnections);
            node.degreeColor = this.colorFromNormalizedValue(d);
        }
    }

    private setDescriptions() {
        this.betweennessDescription = 'MIN: ' + this.minBetweenness.toFixed(6) + ' ---- BETWEENNESS ---- MAX: ' + this.maxBetweenness.toFixed(6);
        this.closenessDescription = 'MIN: ' + this.minCloseness.toFixed(4) +     ' ----- CLOSENESS ----- MAX: ' + this.maxCloseness.toFixed(4);
        this.degreeDescription = 'MIN: ' + this.minConnections +                    ' ------- DEGREE ------ MAX: ' + this.maxConnections;
        console.log(this.betweennessDescription);
        console.log(this.closenessDescription);
        console.log(this.degreeDescription);
    }

    private createGeoString(geolocation: IGeolocation) : string {
        const DEGREE_RESOLUTION: number = 1.0 / 0.2;
        let result: string = Math.floor(geolocation.coordinates.latitude * DEGREE_RESOLUTION).toString() + ':' + Math.floor(geolocation.coordinates.longitude * DEGREE_RESOLUTION).toString();
        return result;
    }

    private assignSubNodes(nodes: INode []) {
        let nogeo: number = 0;
        let nodeMap: Map<string, INode []> = new Map();

        for (let inode of nodes) {
            // remove port number from addr string.
            inode.addr = inode.addr.substring(0, inode.addr.indexOf(':'));
            if (!inode.geolocation) {
                nogeo++;
                // console.log(`no geo location: ${nogeo}`, inode);
                inode.geolocation = {
                    country: 'unknown',
                    city: 'unknown',
                    coordinates: {
                        latitude: 0,
                        longitude: -10
                    },
                    timezone: '',
                    isp: ''
                }
            }
            inode.geostr = this.createGeoString(inode.geolocation);
            if (inode.ignore) continue;
            let group = nodeMap.get(inode.geostr);
            if (group) {
                inode.subnode_index = group.length;
                group.push(inode);
            } else {
                inode.subnode_index = 0;
                group = new Array();
                group.push(inode);
                nodeMap.set(inode.geostr, group);
            }
        }
        for (let [key, value] of nodeMap) {
            for (let inode of value) {
                inode.num_subnodes = value.length;
            }
        }
        console.log('nodeMap length ', nodeMap.size);
    }
 
    public async initialize() {
        console.log('world::initialize, num nodes: ' + this.istate.nodes.length);
        let gl = this.gl;
        let id = 0;
        this.assignSubNodes(this.istate.nodes);
        this.isTiny = this.istate.nodes.length < TINY_GRAPH_NODES;
        let abstand: number = this.isTiny ? 4.0 : 2.0;
        for (let inode of this.istate.nodes) {
            if (inode.ignore) {
                let node = new CNode(inode, id, 0, this.camera, ENodeType.Hide, null, abstand);
                this.nodes.push(node);
                id++;
                continue;
            }
            // if we're working with a small graph, we do not create any supernodes or subnodes.
            // All nodes are therefore a single node.
            if (inode.subnode_index == 0 || this.isTiny) {
                if (inode.num_subnodes > 1 && !this.isTiny) {
                    // new super node
                    let superNode = new CNode(inode, this.istate.nodes.length+this.superNodes.length, this.superNodes.length, this.camera, ENodeType.Super, null, 0);
                    // make super nodes magenta
                    superNode.degreeColor = COLOR_MAGENTA;

                    this.superMap.set(inode.geostr,superNode);
                    this.superNodes.push(superNode);
                    let node = new CNode(inode, id, superNode.subNodes.length, this.camera, ENodeType.Sub, superNode, abstand);
                    this.nodes.push(node);
                    superNode.subNodes.push(node);
                 } else {
                    // new single node
                    let node = new CNode(inode, id, this.singleNodes.length, this.camera, ENodeType.Single, null, abstand);
                    this.nodes.push(node);
                    this.singleNodes.push(node);
                }
            } else {
                let superNode = this.superMap.get(inode.geostr);
                if (!superNode) {
                    console.log('  could not find supernode for geostr ', inode.geostr);
                    console.log('  could not find supernode for inode ', inode);
                }
                let node = new CNode(inode, id, superNode.subNodes.length, this.camera, ENodeType.Sub, superNode, abstand);
                this.nodes.push(node);
                superNode.subNodes.push(node);
                if (superNode.subNodes.length > this.maxSubnodes) {
                    this.maxSubnodes = superNode.subNodes.length;
                }
            }
            id++;
        }

        for (let inode of this.istate.nodes) {
            this.updateStats(inode);
        }

        let minSuperNodeSize = Math.sqrt(2);
        let maxSuperNodeSize = Math.sqrt(this.maxSubnodes);
        for (let superNode of this.superNodes) {
            let size = Math.sqrt(superNode.subNodes.length);
            superNode.scale = (size-minSuperNodeSize)/maxSuperNodeSize * (MAX_SUPERNODE_SCALE-MIN_SUPERNODE_SCALE) + MIN_SUPERNODE_SCALE;
        }

        this.setDescriptions();
        this.updateColorDisplay();
        this.setAuxColors();
        await this.initTexturesGl();
        this.initNodesGl();
        this.initPickerGl();
        this.initWorldMapGl();
        this.initConnectionsGl();
        this.initGradientGl();
        this.initHistogramGl();
    }

    private renderWorldMap() {
        let gl = this.gl
        gl.depthMask(false);
        gl.useProgram(glShaders[EShader.WorldMap]);
        gl.uniformMatrix4fv(this.worldMapVPLoc, false, this.camera.matViewProjection);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.worldMapTexture);
        gl.uniform1i(this.worldMapTextureLoc, 0);
        gl.bindVertexArray(this.worldMapVao);
        gl.drawArrays(gl.TRIANGLES, 0, 108);
    }

    private renderGradient() {
        let gl = this.gl
        gl.depthMask(false);
        gl.useProgram(glShaders[EShader.Gradient]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.gradientTexture);
        gl.uniform1i(this.gradientTextureLoc, 0);
        gl.bindVertexArray(this.gradientVao);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    private renderHistogram() {
        let gl = this.gl
        gl.depthMask(false);
        gl.useProgram(glShaders[EShader.Gradient]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.currentHistogramTexture);
        gl.uniform1i(this.gradientTextureLoc, 0);
        gl.bindVertexArray(this.histogramVao);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    renderConnections() {
        let gl = this.gl
        gl.useProgram(glShaders[EShader.Connection]);
        gl.uniformMatrix4fv(this.connectionVPLoc, false, this.camera.matViewProjection);
        gl.bindVertexArray(this.connectionVao);
        gl.drawArraysInstanced(gl.LINES, 0, 2, this.isTiny ? this.numConnections : this.numConnectionsToDraw);
    }

    renderNodes() {
        let gl = this.gl
        gl.depthMask(true);
        gl.useProgram(glShaders[EShader.Icosa]);
        gl.uniformMatrix4fv(this.icosaVPLoc, false, this.camera.matViewProjection);
        gl.uniform4fv(this.paramsLoc, this.params);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
        gl.uniform1i(this.noiseTextureLoc, 0);

        gl.bindVertexArray(this.mainSingleGroup.vao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 60, this.singleNodes.length);
        if (this.selectedSuperNode && this.selectedSuperNode.isOpenedSuper) {
            gl.bindVertexArray(this.mainSubGroup.vao);
            gl.drawArraysInstanced(gl.TRIANGLES, 0, 60, this.selectedSuperNode.subNodes.length);
        }

        gl.bindVertexArray(this.mainSuperGroup.vao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, this.superNodes.length);
    }

    public renderGl() {
        let elapsed = this.startTime - Date.now()
        this.params[0] = elapsed / 1000.0;
        this.renderWorldMap()
        if ((this.drawConnections || this.isTiny) && this.connectionMode) {
            this.renderConnections()
        }
        this.renderNodes()
        if (this.displayGradient) {
            this.renderGradient();
        }
        if (this.displayHistogram) {
            this.renderHistogram();
        }
    }

    public renderPicker() {
        let gl = this.gl
        gl.useProgram(glShaders[EShader.Picker]);
        gl.uniformMatrix4fv(this.pickerVPLoc, false, this.camera.matViewProjection);
        gl.uniform4fv(this.pickerParamsLoc, this.params);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
        gl.uniform1i(this.pickerNoiseTextureLoc, 0);
        gl.bindVertexArray(this.pickerSingleGroup.vao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 60, this.singleNodes.length);

        if (this.selectedSuperNode && this.selectedSuperNode.isOpenedSuper) {
            gl.bindVertexArray(this.pickerSubGroup.vao);
            gl.drawArraysInstanced(gl.TRIANGLES, 0, 60, this.selectedSuperNode.subNodes.length);
        }

        gl.bindVertexArray(this.pickerSuperGroup.vao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, this.superNodes.length);
    }
}
