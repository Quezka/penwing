// Adapter layer: loads optional dance frames made by tools/prepare-dance.py.
// Returns null when there are none, so Penwing falls back to the drawn dance.

import Cogl from 'gi://Cogl';
import GdkPixbuf from 'gi://GdkPixbuf';
import GLib from 'gi://GLib';
import St from 'gi://St';

export const DEFAULT_DIR = GLib.build_filenamev([GLib.get_user_config_dir(), 'penwing', 'dance']);

export function loadDanceFrames(dir = DEFAULT_DIR) {
    try {
        const jsonPath = GLib.build_filenamev([dir, 'frames.json']);
        if (!GLib.file_test(jsonPath, GLib.FileTest.EXISTS))
            return null;
        const [, bytes] = GLib.file_get_contents(jsonPath);
        const meta = JSON.parse(new TextDecoder().decode(bytes));
        const delays = meta.delays.map(d => Math.max(20, Number(d) || 50));
        const coglContext = global.stage.context.get_backend().get_cogl_context();

        const frames = delays.map((_, i) => {
            const path = GLib.build_filenamev([dir, `${String(i).padStart(3, '0')}.png`]);
            let pixbuf = GdkPixbuf.Pixbuf.new_from_file(path);
            if (!pixbuf.get_has_alpha())
                pixbuf = pixbuf.add_alpha(false, 0, 0, 0);
            const content = St.ImageContent.new_with_preferred_size(pixbuf.width, pixbuf.height);
            content.set_bytes(coglContext, pixbuf.read_pixel_bytes(),
                Cogl.PixelFormat.RGBA_8888, pixbuf.width, pixbuf.height, pixbuf.rowstride);
            return content;
        });

        const starts = [];
        let total = 0;
        for (const d of delays) {
            starts.push(total);
            total += d;
        }
        return {
            frames,
            width: meta.width,
            height: meta.height,
            seconds: total / 1000,
            /** Frame content for a time in seconds since the dance began. */
            at(seconds) {
                const ms = (seconds * 1000) % total;
                let lo = 0, hi = starts.length - 1;
                while (lo < hi) {
                    const mid = (lo + hi + 1) >> 1;
                    if (starts[mid] <= ms)
                        lo = mid;
                    else
                        hi = mid - 1;
                }
                return frames[lo];
            },
        };
    } catch (e) {
        console.warn(`Penwing: could not load dance frames from ${dir}: ${e.message}`);
        return null;
    }
}
