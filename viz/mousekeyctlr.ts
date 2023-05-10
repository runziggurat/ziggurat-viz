import { EKeyId } from './core'
import { CApp } from './app'

export class CMousekeyCtlr {
    app: CApp;

    constructor(app: CApp) {
        this.app = app;
        window.addEventListener('keydown', this.onKeydownEvent);
        window.addEventListener('keyup', this.onKeyupEvent);
        window.addEventListener('mousedown', this.onMouseDownNoDefault, false);
        window.addEventListener('mouseup', this.onMouseEvent);
        window.addEventListener('mousemove', this.onMouseEvent);
        window.addEventListener('wheel', this.onMouseEvent);
    }

    public destroy = () => {
        window.removeEventListener('keydown', this.onKeydownEvent);
        window.removeEventListener('keyup', this.onKeyupEvent);
        window.removeEventListener('mousedown', this.onMouseDownNoDefault, false);
        window.removeEventListener('mouseup', this.onMouseEvent);
        window.removeEventListener('mousemove', this.onMouseEvent);
        window.removeEventListener('wheel', this.onMouseEvent);

        this.app = null!; // TODO Check if it actually helps GC.
    }

    onMouseDownNoDefault = (evt: MouseEvent) => {
        this.onMouseEvent(evt);
        evt.preventDefault();
    }

    onMouseLeftDown = (x: number, y: number) => {
        this.app.handleClick(x, y);
    }

    onMouseRightDown = (x: number, y: number, evt: MouseEvent) => {
    }

    onMouseMiddleDown = (x: number, y: number) => {
        console.log('onMouseMiddleDown');
    }

    onMouseMove = (x: number, y: number) => {
        this.app.handleMouseMove(x, y);
    }

    onMouseLeftUp = (x: number, y: number) => {
        this.app.handleClickRelease(x, y);
    }

    onMouseEvent = (evt: any) => {
        if (!this.app) {
            return;
        }

        let x = evt.pageX;
        let y = evt.pageY;
        if (evt.type == 'mousedown') {
            if (evt.button == 0) {
                this.onMouseLeftDown(x, y);
            } else if (evt.button == 1) {
                this.onMouseMiddleDown(x, y);
            } else if (evt.button == 2) {
                this.onMouseRightDown(x, y, evt);
            }
        } else if (evt.type == 'mousemove') {
            this.onMouseMove(evt.movementX, evt.movementY);
        } else if (evt.type == 'mouseup') {
            if (evt.button == 0) {
                this.onMouseLeftUp(x, y);
            }
        } else if (evt.type == 'wheel') {
            if (evt.deltaY > 0) {
                this.app.zoomOutTicks += evt.deltaY / 16;
                if (this.app.zoomOutTicks > 10) {
                    this.app.zoomOutTicks = 10;
                }
            } else {
                this.app.zoomInTicks += -evt.deltaY / 16;
                if (this.app.zoomInTicks > 10) {
                    this.app.zoomInTicks = 10;
                }
            }
        }
    }

    onKeydownEvent = (evt: KeyboardEvent) => {
        if (evt.code == 'ArrowUp') {
            this.app.onAction(true, EKeyId.ArrowUp);
        } else if (evt.code == 'ArrowDown') {
            this.app.onAction(true, EKeyId.ArrowDown);
        } else if (evt.code == 'ArrowLeft') {
            this.app.onAction(true, EKeyId.ArrowLeft);
        } else if (evt.code == 'ArrowRight') {
            this.app.onAction(true, EKeyId.ArrowRight);
        } else if (evt.code == 'KeyC') {
            this.app.onAction(true, EKeyId.ColorMode);
        } else if (evt.code == 'KeyG') {
            this.app.onAction(true, EKeyId.ToggleGradient);
        } else if (evt.code == 'KeyH') {
            this.app.onAction(true, EKeyId.ToggleHistogram);
        } else if (evt.code == 'KeyN') {
            this.app.onAction(true, EKeyId.ToggleConnection);
        } else if (evt.code == 'KeyX') {
            this.app.onAction(true, EKeyId.ToggleCommand);
        } else if (evt.code == 'KeyF') {
            this.app.onAction(true, EKeyId.ToggleFps);
        } else if (evt.code == 'KeyI') {
            this.app.onAction(true, EKeyId.ZoomIn);
        } else if (evt.code == 'KeyO') {
            this.app.onAction(true, EKeyId.ZoomOut);
        }
    }

    onKeyupEvent = (evt: KeyboardEvent) => {
        if (evt.code == 'ArrowUp') {
            this.app.onAction(false, EKeyId.ArrowUp)
        } else if (evt.code == 'ArrowDown') {
            this.app.onAction(false, EKeyId.ArrowDown)
        } else if (evt.code == 'ArrowLeft') {
            this.app.onAction(false, EKeyId.ArrowLeft)
        } else if (evt.code == 'ArrowRight') {
            this.app.onAction(false, EKeyId.ArrowRight)
        } else if (evt.code == 'KeyI') {
            this.app.onAction(false, EKeyId.ZoomIn)
        } else if (evt.code == 'KeyO') {
            this.app.onAction(false, EKeyId.ZoomOut)
        }
    }
}
