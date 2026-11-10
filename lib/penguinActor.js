// UI layer: the on-screen widget that hosts the drawing.

import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

import {drawPenguin, UNIT_W, UNIT_H} from './art.js';

export const PenguinActor = GObject.registerClass({
    Signals: {'poked': {}},
}, class PenguinActor extends St.DrawingArea {
    _init(widthPx) {
        super._init({
            reactive: true,
            track_hover: true,
            width: widthPx,
            height: Math.round(widthPx * UNIT_H / UNIT_W),
        });
        this._scale = widthPx / UNIT_W;
        this._pose = null;
        this.connect('button-press-event', () => {
            this.emit('poked');
            return Clutter.EVENT_STOP;
        });
    }

    setPose(pose) {
        this._pose = pose;
        this.queue_repaint();
    }

    vfunc_repaint() {
        const cr = this.get_context();
        if (this._pose)
            drawPenguin(cr, this._pose, this._scale);
        cr.$dispose();
    }
});
