// Domain layer: turns the pet's state and time into a drawing pose.
// Pure maths, no GNOME imports.

import {State} from './pet.js';

const TAU = Math.PI * 2;

export function poseFor(pet) {
    const t = pet.t;
    const e = pet.elapsed;
    const pose = {
        hop: 0,          // pixels above the ground
        tilt: 0,         // radians, around the feet
        wingL: 0.15,     // radians, 0 = down, positive = raised
        wingR: 0.15,
        eyes: 'open',    // open | closed | happy
        look: 0,         // -1 left .. 1 right
        footL: 0,        // pixels lifted
        footR: 0,
        notes: -1,       // dance time for floating notes, -1 = none
        zzz: -1,         // sleep time for floating Zs, -1 = none
        squash: 1,       // vertical scale of the body
    };

    switch (pet.state) {
    case State.WALK: {
        const step = Math.sin(t * TAU * 2.2);
        pose.tilt = step * 0.1;
        pose.hop = Math.abs(step) * 2.5;
        pose.footL = Math.max(0, step) * 4;
        pose.footR = Math.max(0, -step) * 4;
        pose.wingL = 0.2 + Math.max(0, -step) * 0.25;
        pose.wingR = 0.2 + Math.max(0, step) * 0.25;
        pose.look = pet.dir;
        pose.eyes = blink(t);
        break;
    }
    case State.DANCE: {
        // Two beats per second: sway, hop on the beat, wave wings in turn.
        const beat = e * 2;
        const sway = Math.sin(beat * Math.PI);
        pose.tilt = sway * 0.28;
        pose.hop = Math.abs(Math.sin(beat * Math.PI)) * 10;
        pose.squash = 1 - Math.max(0, Math.cos(beat * TAU)) * 0.07;
        pose.wingL = 0.3 + Math.max(0, sway) * 1.6;
        pose.wingR = 0.3 + Math.max(0, -sway) * 1.6;
        pose.footL = Math.max(0, sway) * 5;
        pose.footR = Math.max(0, -sway) * 5;
        pose.eyes = 'happy';
        pose.notes = e;
        break;
    }
    case State.SLEEP: {
        const breath = Math.sin(t * TAU * 0.35);
        pose.squash = 0.96 + breath * 0.025;
        pose.tilt = 0.06;
        pose.wingL = 0.05;
        pose.wingR = 0.05;
        pose.eyes = 'closed';
        pose.zzz = e;
        break;
    }
    default: {
        const breath = Math.sin(t * TAU * 0.5);
        pose.squash = 1 + breath * 0.015;
        pose.wingL = 0.15 + Math.max(0, Math.sin(t * 1.3)) * 0.1;
        pose.wingR = 0.15 + Math.max(0, Math.sin(t * 1.1 + 2)) * 0.1;
        pose.look = Math.sin(t * 0.7) > 0.6 ? 0.8 : Math.sin(t * 0.7) < -0.6 ? -0.8 : 0;
        pose.eyes = blink(t);
    }
    }
    return pose;
}

function blink(t) {
    return (t % 3.7) < 0.13 ? 'closed' : 'open';
}
