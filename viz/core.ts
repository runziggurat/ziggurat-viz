export const WORLD_WIDTH: number = 3600
export const WORLD_HEIGHT: number = 1800
export const INITIAL_CAMERA_Z: number = 1800
export const MAX_ZOOM: number = 8.14786
export const MIN_ZOOM: number = 3.158883

export enum EShader {
  Icosa = 0,
  Picker,
  WorldMap,
  Connection,
  Gradient,
  Last,
}

export enum EColorMode {
  Between = 0,
  Close,
  Degree,
  Last,
}

export enum ENodeType {
  Single = 0,
  Super,
  Sub,
  Hide,
}

export interface ICamera {
  position: [number, number, number]
}

export interface IShader {
  vertex: string
  fragment: string
}

export enum ENetworkType {
  Unknown = 'Unknown',
  Zcash = 'Zcash',
  Ripple = 'Ripple',
}

export enum Action {
  ArrowLeft = 'left',
  ArrowRight = 'right',
  ArrowUp = 'up',
  ArrowDown = 'down',
  ZoomIn = 'in',
  ZoomOut = 'out',
  ToggleConnection = 'conn',
  ToggleCommand = 'command',
  ToggleFps = 'fps',
  ToggleGradient = 'gradient',
  ToggleHistogram = 'histogram',
  ToggleColorMode = 'colormode',
}

export interface IHistogram {
  label: string
  counts: number[]
  max_count: number
}

export interface IGeolocation {
  country: string
  city: string
  coordinates: {
    latitude: number
    longitude: number
  }
  timezone: string
  isp: string
}

export interface INode {
  addr: string
  network_type: ENetworkType
  betweenness: number
  closeness: number
  num_subnodes: number
  subnode_index: number
  connections: number[]
  geolocation: IGeolocation
  geostr: string
  ignore: boolean
}

export interface IState {
  elapsed: number
  nodes: INode[]
  histograms: IHistogram[]
}
