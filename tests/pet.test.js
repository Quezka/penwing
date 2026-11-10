// Run: gjs -m tests/pet.test.js
import {Pet, State, DANCE_SECONDS} from '../lib/pet.js';
import {poseFor} from '../lib/pose.js';

let failures = 0;
function check(name, cond) {
    print(`${cond ? 'ok  ' : 'FAIL'} ${name}`);
    if (!cond)
        failures++;
}

function seeded(seed) {
    return () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}

const pet = new Pet({minX: 100, maxX: 500, rng: seeded(1)});
check('starts idle', pet.state === State.IDLE);
check('starts inside bounds', pet.x >= 100 && pet.x <= 500);

pet.poke();
check('poke dances', pet.state === State.DANCE);
pet.tick(DANCE_SECONDS - 0.1);
check('still dancing before the end', pet.state === State.DANCE);
pet.tick(0.2);
check('dance ends', pet.state !== State.DANCE);

// Long run: never leaves bounds, visits every state.
const seen = new Set();
for (let i = 0; i < 20000; i++) {
    pet.tick(0.04);
    seen.add(pet.state);
    if (pet.x < 100 || pet.x > 500) {
        check('stays inside bounds', false);
        break;
    }
}
check('visits all states', seen.size === 4);

pet.setBounds(200, 220);
check('setBounds clamps', pet.x >= 200 && pet.x <= 220);

// Sleep always wakes into idle.
pet._enter(State.SLEEP, 1);
pet.tick(1.1);
check('wakes into idle', pet.state === State.IDLE);

for (const s of Object.values(State)) {
    pet._enter(s, 5);
    pet.tick(0.3);
    const p = poseFor(pet);
    const nums = ['hop', 'tilt', 'wingL', 'wingR', 'look', 'footL', 'footR', 'squash'];
    check(`pose for ${s} is finite`, nums.every(k => Number.isFinite(p[k])));
}
pet._enter(State.DANCE, 5);
check('dance has happy eyes and notes', poseFor(pet).eyes === 'happy' && poseFor(pet).notes >= 0);
pet._enter(State.SLEEP, 5);
check('sleep has closed eyes and zzz', poseFor(pet).eyes === 'closed' && poseFor(pet).zzz >= 0);

if (failures) {
    print(`${failures} failure(s)`);
    imports.system.exit(1);
}
print('all passed');
