#!/usr/bin/env python3
"""Turn an animated GIF into Penwing dance frames.

Usage: tools/prepare-dance.py INPUT.gif [--height 120] [--out ~/.config/penwing/dance]

Removes a flat background (the colour of the top-left pixel, flood-filled in
from the edges so light areas inside the character stay), crops every frame to
the same box, scales to the given height and writes NNN.png + frames.json.
The output stays on your machine; it is not part of the repository.
Needs Pillow (python3-pil).
"""
import argparse
import json
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageSequence

TOLERANCE = 40


def frames_of(path):
    gif = Image.open(path)
    for frame in ImageSequence.Iterator(gif):
        yield frame.convert("RGBA"), int(frame.info.get("duration") or 50)


def union_bbox(frames, bg):
    box = None
    for img, _ in frames:
        diff = ImageChops.difference(img.convert("RGB"), Image.new("RGB", img.size, bg))
        mask = diff.convert("L").point(lambda v: 255 if v > TOLERANCE else 0)
        b = mask.getbbox()
        if b is None:
            continue
        box = b if box is None else (
            min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    return box


def key_out_background(img):
    """Flood-fill the background to transparent from points along the border."""
    w, h = img.size
    seeds = [(x, 0) for x in range(0, w, 6)] + [(x, h - 1) for x in range(0, w, 6)]
    seeds += [(0, y) for y in range(0, h, 6)] + [(w - 1, y) for y in range(0, h, 6)]
    for seed in seeds:
        if img.getpixel(seed)[3] == 0:
            continue
        ImageDraw.floodfill(img, seed, (0, 0, 0, 0), thresh=TOLERANCE)
    return img


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("gif")
    ap.add_argument("--height", type=int, default=120)
    ap.add_argument("--out", default=os.path.expanduser("~/.config/penwing/dance"))
    args = ap.parse_args()

    frames = list(frames_of(args.gif))
    if not frames:
        sys.exit("no frames in " + args.gif)
    bg = frames[0][0].getpixel((0, 0))[:3]
    box = union_bbox(frames, bg)
    if box is None:
        sys.exit("could not find anything but background")
    pad = 4
    box = (max(0, box[0] - pad), max(0, box[1] - pad),
           min(frames[0][0].width, box[2] + pad), min(frames[0][0].height, box[3] + pad))
    bw, bh = box[2] - box[0], box[3] - box[1]
    out_h = args.height
    out_w = round(bw * out_h / bh)
    work = (out_w * 2, out_h * 2)  # key out at 2x, then downscale for clean edges

    os.makedirs(args.out, exist_ok=True)
    for name in os.listdir(args.out):
        if name.endswith(".png") or name == "frames.json":
            os.remove(os.path.join(args.out, name))

    delays = []
    for i, (img, delay) in enumerate(frames):
        big = img.crop(box).resize(work, Image.LANCZOS)
        big = key_out_background(big)
        small = big.convert("RGBa").resize((out_w, out_h), Image.LANCZOS).convert("RGBA")
        small.save(os.path.join(args.out, f"{i:03d}.png"))
        delays.append(delay)
        print(f"\r{i + 1}/{len(frames)}", end="", flush=True)
    print()

    with open(os.path.join(args.out, "frames.json"), "w") as f:
        json.dump({"width": out_w, "height": out_h, "delays": delays}, f)
    print(f"wrote {len(delays)} frames ({out_w}x{out_h}, {sum(delays) / 1000:.2f} s) to {args.out}")


if __name__ == "__main__":
    main()
