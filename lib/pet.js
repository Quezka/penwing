// Domain layer: Penwing's behaviour as a pure state machine.
// No GNOME imports allowed here (enforced by tests/layers.test.sh).

export const State = Object.freeze({
    IDLE: 'idle',
    WALK: 'walk',
    DANCE: 'dance',
    SLEEP: 'sleep',
});

export const WALK_SPEED = 38; // pixels per second
export const DANCE_SECONDS = 4.5;

// [state, weight, minSeconds, maxSeconds]
const NEXT = [
    [State.WALK, 5, 3, 8],
    [State.IDLE, 3, 2, 5],
    [State.DANCE, 1.5, DANCE_SECONDS, DANCE_SECONDS],
    [State.SLEEP, 0.6, 12, 25],
];

export class Pet {
    constructor({minX, maxX, rng = Math.random}) {
        this._rng = rng;
        this.minX = minX;
        this.maxX = Math.max(minX, maxX);
        this.x = minX + (this.maxX - minX) * rng();
        this.dir = rng() < 0.5 ? -1 : 1;
        this.t = 0;
        this._enter(State.IDLE, 2);
    }

    setBounds(minX, maxX) {
        this.minX = minX;
        this.maxX = Math.max(minX, maxX);
        this.x = Math.min(Math.max(this.x, this.minX), this.maxX);
    }

    /** Clicked: always dance (wakes it up too). */
    poke() {
        this._enter(State.DANCE, DANCE_SECONDS);
    }

    tick(dt) {
        this.t += dt;
        this.elapsed += dt;

        if (this.state === State.WALK) {
            this.x += this.dir * WALK_SPEED * dt;
            if (this.x <= this.minX) {
                this.x = this.minX;
                this.dir = 1;
            } else if (this.x >= this.maxX) {
                this.x = this.maxX;
                this.dir = -1;
            }
        }

        if (this.elapsed >= this.duration)
            this._pickNext();
    }

    _pickNext() {
        // After a nap, always stretch out with a short idle first.
        if (this.state === State.SLEEP) {
            this._enter(State.IDLE, 2);
            return;
        }
        const choices = NEXT.filter(([s]) => s !== this.state);
        const total = choices.reduce((sum, [, w]) => sum + w, 0);
        let r = this._rng() * total;
        for (const [state, w, min, max] of choices) {
            r -= w;
            if (r <= 0) {
                if (state === State.WALK && this._rng() < 0.4)
                    this.dir = -this.dir;
                this._enter(state, min + (max - min) * this._rng());
                return;
            }
        }
        const [state, , min] = choices[choices.length - 1];
        this._enter(state, min);
    }

    _enter(state, duration) {
        this.state = state;
        this.duration = duration;
        this.elapsed = 0;
    }
}
