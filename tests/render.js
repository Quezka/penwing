// Renders sample frames to PNG so the art can be checked without GNOME Shell.
// Run: gjs -m tests/render.js <out-dir>
import Cairo from 'cairo';
import System from 'system';
import {Pet, State} from '../lib/pet.js';
import {poseFor} from '../lib/pose.js';
import {drawPenguin, UNIT_W, UNIT_H} from '../lib/art.js';

const out = System.programArgs[0] ?? '.';
const SCALE = 2;
const frames = [
    [State.IDLE, 0.5], [State.WALK, 0.1], [State.WALK, 0.33],
    [State.DANCE, 0.25], [State.DANCE, 0.5], [State.DANCE, 0.75],
    [State.SLEEP, 1.0],
];
const cols = frames.length;
const w = UNIT_W * SCALE, h = UNIT_H * SCALE;
const surface = new Cairo.ImageSurface(Cairo.Format.ARGB32, w * cols, h);
const cr = new Cairo.Context(surface);
cr.setSourceRGB(0.93, 0.95, 0.98);
cr.paint();
const pet = new Pet({minX: 0, maxX: 100, rng: () => 0.3});
frames.forEach(([state, time], i) => {
    pet._enter(state, 10);
    pet.t = time;
    pet.elapsed = time;
    cr.save();
    cr.translate(i * w, 0);
    drawPenguin(cr, poseFor(pet), SCALE);
    cr.restore();
});
surface.writeToPNG(`${out}/penwing-frames.png`);
print(`${out}/penwing-frames.png`);
