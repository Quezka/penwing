import GLib from 'gi://GLib';
import St from 'gi://St';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Pet, State} from './lib/pet.js';
import {poseFor} from './lib/pose.js';
import {PenguinActor} from './lib/penguinActor.js';
import {loadDanceFrames} from './lib/danceFrames.js';

const WIDTH_PX = 110;
const FRAME_MS = 40;

// Swap actors with opacity, not visibility: the layout manager owns
// `visible` to hide chrome over fullscreen windows.
function showOnly(shown, hidden) {
    shown.opacity = 255;
    shown.reactive = true;
    hidden.opacity = 0;
    hidden.reactive = false;
}

export default class PenwingExtension extends Extension {
    enable() {
        this._actor = new PenguinActor(WIDTH_PX);
        Main.layoutManager.addTopChrome(this._actor, {trackFullscreen: true});

        // Optional dance frames from ~/.config/penwing/dance (tools/prepare-dance.py).
        this._dance = loadDanceFrames();
        if (this._dance) {
            this._danceActor = new St.Widget({
                reactive: false,
                opacity: 0,
                width: this._dance.width,
                height: this._dance.height,
            });
            this._danceActor.connect('button-press-event', () => {
                this._pet.poke();
                return true;
            });
            Main.layoutManager.addTopChrome(this._danceActor, {trackFullscreen: true});
        }

        this._pet = new Pet({
            minX: 0,
            maxX: 1,
            ...(this._dance ? {danceSeconds: this._dance.seconds} : {}),
        });
        this._updateBounds();
        this._actor.connect('poked', () => this._pet.poke());
        // Testing aid: start with a dance (used by the nested-shell check).
        if (GLib.getenv('PENWING_DANCE_ON_START'))
            this._pet.poke();

        this._workareaId = global.display.connect('workareas-changed',
            () => this._updateBounds());
        this._monitorsId = Main.layoutManager.connect('monitors-changed',
            () => this._updateBounds());

        this._last = GLib.get_monotonic_time();
        this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, FRAME_MS, () => {
            this._frame();
            return GLib.SOURCE_CONTINUE;
        });
        this._frame();
    }

    _updateBounds() {
        const index = Main.layoutManager.primaryIndex;
        if (index < 0)
            return;
        this._area = Main.layoutManager.getWorkAreaForMonitor(index);
        const half = WIDTH_PX / 2;
        this._pet.setBounds(this._area.x + half, this._area.x + this._area.width - half);
    }

    _frame() {
        const now = GLib.get_monotonic_time();
        // Clamp so a long stall (suspend, busy shell) does not teleport him.
        const dt = Math.min((now - this._last) / 1e6, 0.25);
        this._last = now;
        this._pet.tick(dt);
        if (!this._area)
            return;
        const bottom = this._area.y + this._area.height;

        if (this._dance && this._pet.state === State.DANCE) {
            this._danceActor.content = this._dance.at(this._pet.elapsed);
            this._danceActor.set_position(
                Math.round(this._pet.x - this._dance.width / 2),
                bottom - this._dance.height);
            showOnly(this._danceActor, this._actor);
            return;
        }
        if (this._danceActor)
            showOnly(this._actor, this._danceActor);
        this._actor.set_position(
            Math.round(this._pet.x - WIDTH_PX / 2),
            bottom - this._actor.height);
        this._actor.setPose(poseFor(this._pet));
    }

    disable() {
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = 0;
        }
        if (this._workareaId) {
            global.display.disconnect(this._workareaId);
            this._workareaId = 0;
        }
        if (this._monitorsId) {
            Main.layoutManager.disconnect(this._monitorsId);
            this._monitorsId = 0;
        }
        if (this._actor) {
            Main.layoutManager.removeChrome(this._actor);
            this._actor.destroy();
            this._actor = null;
        }
        if (this._danceActor) {
            Main.layoutManager.removeChrome(this._danceActor);
            this._danceActor.destroy();
            this._danceActor = null;
        }
        this._dance = null;
        this._pet = null;
        this._area = null;
    }
}
