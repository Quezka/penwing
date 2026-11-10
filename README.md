# Penwing

A small Tux-style penguin (black coat, white front, yellow beak and feet) with a red scarf who lives at the bottom of your screen.
A GNOME Shell extension (GNOME Shell 50, Wayland and X11).

- Waddles left and right along the bottom of the work area (above the dock/taskbar).
- Stops to look around and blink.
- Naps now and then, with floating Zs.
- **Click him and he dances**: sways, hops on the beat and waves his wings, with music notes.
- Hides when a window is fullscreen.

All art is drawn in code with Cairo (`lib/art.js`); there are no image files.

## Your own dance

Penwing can play any animated GIF as his dance instead of the drawn one:

```bash
tools/prepare-dance.py my-dance.gif          # needs python3-pil
```

This removes a flat background, crops and scales the frames, and writes them to
`~/.config/penwing/dance/`. Restart the extension (or log out and in) to load them.
Delete that folder to go back to the drawn dance. The frames stay on your machine;
they are not part of this repository.

## Install

```bash
git clone https://github.com/Quezka/penwing
ln -sfn "$PWD/penwing" ~/.local/share/gnome-shell/extensions/penwing@quezka.uk
```

On Wayland, log out and back in once, then:

```bash
gnome-extensions enable penwing@quezka.uk
```

## Tests

```bash
gjs -m tests/pet.test.js          # behaviour
tests/layers.test.sh              # architecture
gjs -m tests/render.js /tmp       # writes /tmp/penwing-frames.png to check the art
```

## Layout

- `lib/pet.js`: domain, the state machine (idle, walk, dance, sleep).
- `lib/pose.js`: domain, state and time to a drawing pose.
- `lib/art.js`: drawing, paints a pose with any Cairo context.
- `lib/penguinActor.js`: UI, the on-screen widget.
- `lib/danceFrames.js`: adapter, loads the optional dance frames.
- `tools/prepare-dance.py`: turns a GIF into dance frames.
- `extension.js`: wiring, frame timer, screen bounds.

## License

MIT
