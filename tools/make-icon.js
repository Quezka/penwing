// Renders the idle penguin as a square app icon.
// Run: gjs -m tools/make-icon.js <out.png> [size]
import Cairo from 'cairo';
import System from 'system';
import {Pet, State} from '../lib/pet.js';
import {poseFor} from '../lib/pose.js';
import {drawPenguin, UNIT_W, UNIT_H} from '../lib/art.js';

const out = System.programArgs[0] ?? 'penwing.png';
const size = Number(System.programArgs[1] ?? 256);
const scale = (size * 0.9) / Math.max(UNIT_W, UNIT_H);
const surface = new Cairo.ImageSurface(Cairo.Format.ARGB32, size, size);
const cr = new Cairo.Context(surface);
const pet = new Pet({minX: 0, maxX: 100, rng: () => 0.3});
pet._enter(State.IDLE, 10);
pet.t = 0.5;
pet.elapsed = 0.5;
cr.translate((size - UNIT_W * scale) / 2, (size - UNIT_H * scale) / 2);
drawPenguin(cr, poseFor(pet), scale);
surface.writeToPNG(out);
print(out);
