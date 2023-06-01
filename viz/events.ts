import { EKeyId } from './core'

interface Opts {
  onClick?: (x: number, y: number) => void
  onKeyPress?: (key: string) => void
  onKeyRelease?: (key: string) => void
  onSlide?: (x: number, y: number, dx: number, dy: number) => void
  onZoom?: (x: number, y: number, delta: number) => void
  onResize?: () => void
  element?: HTMLElement
}

export class Events {
  private listeners: {
    [key in keyof Opts]: NonNullable<Opts[key]>
  } = {}
  private element?: HTMLElement

  constructor({
    onClick,
    onKeyPress,
    onKeyRelease,
    onResize,
    onSlide,
    onZoom,
    element,
  }: Opts) {
    this.listeners = {
      onClick,
      onKeyPress,
      onKeyRelease,
      onResize,
      onSlide,
      onZoom,
    }
    this.element = element
  }

  public create = () => {
    window.addEventListener('mousedown', this.onMouseDown)
    window.addEventListener('touchstart', this.onTouchStart)
    window.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('touchmove', this.onTouchMove)
    window.addEventListener('mouseup', this.onMouseUp)
    window.addEventListener('touchend', this.onTouchEnd)
    window.addEventListener('click', this.onClick)
    window.addEventListener('resize', this.onResize)
    window.addEventListener('wheel', this.onWheel)
    window.addEventListener('keydown', this.onKeydown)
    window.addEventListener('keyup', this.onKeyup)

    return this
  }

  public destroy = () => {
    window.removeEventListener('mousedown', this.onMouseDown)
    window.removeEventListener('touchstart', this.onTouchStart)
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)
    window.removeEventListener('touchend', this.onTouchEnd)
    window.removeEventListener('click', this.onClick)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('wheel', this.onWheel)
    window.removeEventListener('keydown', this.onKeydown)
    window.removeEventListener('keyup', this.onKeyup)
  }

  private getPosition = (evt: { clientX: number, clientY: number }) => {
    let x: number, y: number
    if (this.element) {
      const rect = this.element.getBoundingClientRect()
      x = evt.clientX - rect.left
      y = evt.clientY - rect.top
    } else {
      x = evt.clientX
      y = evt.clientY
    }
    return {
      x,
      y,
    }
  }

  private shouldIgnoreKB = (evt: KeyboardEvent) => {
    const tagsToIgnore = ['INPUT', 'TEXTAREA']
    const target = evt.target instanceof HTMLElement ? evt.target : undefined
    if (target && tagsToIgnore.includes(target.tagName)) {
      return true
    }
    return false
  }

  private shouldIgnoreMouse = (evt: MouseEvent) => {
    const target = evt.target instanceof HTMLElement ? evt.target : undefined
    if (target && this.element && target !== this.element) {
      return true
    }
    return false
  }

  private isDragging = false
  private prevTouch?: Touch

  private onClick = (evt: MouseEvent) => {
    if (this.shouldIgnoreMouse(evt)) {
      return
    }

    const { x, y } = this.getPosition(evt)
    this.listeners.onClick?.(x, y)
  }

  private onTouchStart = (evt: TouchEvent) => {
    this.prevTouch = evt.changedTouches[0]
  }

  private onMouseDown = (evt: MouseEvent) => {
    if (evt.button != 0) {
      // not left click
      return
    }
    if (this.shouldIgnoreMouse(evt)) {
      return
    }
    this.isDragging = true
  }

  private onMouseUp = (evt: MouseEvent) => {
    if (evt.button != 0) {
      // not left click
      return
    }
    this.isDragging = false
  }

  private onTouchEnd = (evt: TouchEvent) => {
    this.prevTouch = undefined
  }

  private onMouseMove = (evt: MouseEvent) => {
    if (!this.isDragging) {
      return
    }

    const { x, y } = this.getPosition(evt)
    const dx = evt.movementX, dy = evt.movementY
    this.listeners.onSlide?.(x, y, dx, dy)
  }

  private onTouchMove = (evt: TouchEvent) => {
    const touch = evt.changedTouches[0]
    const { x, y } = this.getPosition(touch)
    const dx = this.prevTouch ? touch.clientX - this.prevTouch.clientX : 0
    const dy = this.prevTouch ? touch.clientY - this.prevTouch.clientY : 0
    this.listeners.onSlide?.(x, y, dx, dy)
    this.prevTouch = touch
  }

  private onResize = () => {
    this.listeners.onResize?.()
  }

  private onWheel = (evt: WheelEvent) => {
    const { x, y } = this.getPosition(evt)
    this.listeners.onZoom?.(x, y, evt.deltaY)
  }

  onKeydown = (evt: KeyboardEvent) => {
    if (this.shouldIgnoreKB(evt)) {
      return
    }

    this.listeners.onKeyPress?.(evt.code)
  }

  onKeyup = (evt: KeyboardEvent) => {
    this.listeners.onKeyRelease?.(evt.code)
  }
}
