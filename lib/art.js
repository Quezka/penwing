// Drawing layer: paints Penwing with any Cairo-like context.
// No GNOME imports, so it can be tested with a stub context.

export const UNIT_W = 120;
export const UNIT_H = 140;
const GROUND = 134;

// Tux-style palette: black coat, white front, yellow beak and feet.
const NAVY = [0.1, 0.1, 0.12];
const INK = [0.02, 0.02, 0.03];
const CREAM = [0.98, 0.98, 0.96];
const ORANGE = [0.99, 0.76, 0.1];
const RED = [0.88, 0.22, 0.27];
const PINK = [1.0, 0.55, 0.65];
const WHITE = [1, 1, 1];

function rgb(cr, c, a = 1) {
    cr.setSourceRGBA(c[0], c[1], c[2], a);
}

function ellipse(cr, x, y, rx, ry) {
    cr.save();
    cr.translate(x, y);
    cr.scale(rx, ry);
    cr.arc(0, 0, 1, 0, Math.PI * 2);
    cr.restore();
}

function fillStroke(cr, fill, line = 2.5) {
    rgb(cr, fill);
    cr.fillPreserve();
    rgb(cr, INK);
    cr.setLineWidth(line);
    cr.stroke();
}

/** Paint one frame. `scale` maps the 120x140 unit box to pixels. */
export function drawPenguin(cr, pose, scale) {
    cr.save();
    cr.scale(scale, scale);
    cr.translate(UNIT_W / 2, GROUND);

    // Shadow stays on the ground and shrinks while hopping.
    const shadow = Math.max(0.4, 1 - pose.hop / 20);
    ellipse(cr, 0, -1, 26 * shadow, 4 * shadow);
    rgb(cr, INK, 0.18);
    cr.fill();

    if (pose.notes >= 0)
        drawNotes(cr, pose.notes);
    if (pose.zzz >= 0)
        drawZzz(cr, pose.zzz);

    cr.save();
    cr.translate(0, -pose.hop);
    cr.rotate(pose.tilt);
    cr.scale(1, pose.squash);

    // Flippers, behind the body, swing outwards when raised.
    drawWing(cr, -30, -52, pose.wingL);
    drawWing(cr, 30, -52, -pose.wingR);

    // Pear-shaped body: a round head on a wider belly. Outline both shapes
    // first, then fill them, so only the outer edge keeps a line.
    ellipse(cr, 0, -72, 25, 24);
    ellipse(cr, 0, -38, 36, 38);
    rgb(cr, INK);
    cr.setLineWidth(6);
    cr.stroke();
    ellipse(cr, 0, -72, 25, 24);
    ellipse(cr, 0, -38, 36, 38);
    rgb(cr, NAVY);
    cr.fill();

    // White front, reaching up around the beak
    ellipse(cr, 0, -36, 27, 34);
    rgb(cr, CREAM);
    cr.fill();
    ellipse(cr, 0, -62, 15, 9);
    rgb(cr, CREAM);
    cr.fill();

    // Feet: big and flat, in front of the belly, Tux style
    ellipse(cr, -15, -3 - pose.footL, 15, 6.5);
    fillStroke(cr, ORANGE, 2);
    ellipse(cr, 15, -3 - pose.footR, 15, 6.5);
    fillStroke(cr, ORANGE, 2);

    // Scarf with a little tail
    cr.newPath();
    cr.moveTo(-33, -48);
    cr.curveTo(-12, -41, 12, -41, 33, -48);
    cr.lineTo(33, -40);
    cr.curveTo(12, -33, -12, -33, -33, -40);
    cr.closePath();
    fillStroke(cr, RED, 2);
    cr.newPath();
    cr.moveTo(10, -39);
    cr.lineTo(20, -39);
    cr.lineTo(23, -23);
    cr.lineTo(14, -24);
    cr.closePath();
    fillStroke(cr, RED, 2);

    // Cheeks
    ellipse(cr, -16, -58, 4.5, 2.8);
    rgb(cr, PINK, 0.7);
    cr.fill();
    ellipse(cr, 16, -58, 4.5, 2.8);
    rgb(cr, PINK, 0.7);
    cr.fill();

    drawEyes(cr, pose);

    // Wide two-part beak
    cr.newPath();
    cr.moveTo(-11, -66);
    cr.curveTo(-6, -73, 6, -73, 11, -66);
    cr.curveTo(6, -61, -6, -61, -11, -66);
    cr.closePath();
    fillStroke(cr, ORANGE, 2);
    cr.newPath();
    cr.moveTo(-9, -66);
    cr.curveTo(-3, -64.5, 3, -64.5, 9, -66);
    rgb(cr, [0.8, 0.45, 0.05]);
    cr.setLineWidth(1.4);
    cr.stroke();

    cr.restore();
    cr.restore();
}

function drawWing(cr, x, y, angle) {
    cr.save();
    cr.translate(x, y);
    cr.rotate(angle);
    ellipse(cr, 0, 17, 8, 19);
    fillStroke(cr, NAVY, 2.5);
    cr.restore();
}

function drawEyes(cr, pose) {
    for (const ex of [-8.5, 8.5]) {
        if (pose.eyes === 'happy') {
            cr.newPath();
            cr.arc(ex, -76, 5.5, Math.PI * 1.1, Math.PI * 1.9);
            rgb(cr, WHITE);
            cr.setLineWidth(3.5);
            cr.stroke();
        } else if (pose.eyes === 'closed') {
            cr.newPath();
            cr.arc(ex, -83, 5.5, Math.PI * 0.15, Math.PI * 0.85);
            rgb(cr, WHITE);
            cr.setLineWidth(3);
            cr.stroke();
        } else {
            ellipse(cr, ex, -80, 6.5, 9);
            rgb(cr, WHITE);
            cr.fill();
            const px = ex + pose.look * 2;
            ellipse(cr, px, -79, 3.6, 5);
            rgb(cr, INK);
            cr.fill();
            ellipse(cr, px + 1.2, -81, 1.3, 1.3);
            rgb(cr, WHITE);
            cr.fill();
        }
    }
}

function drawNotes(cr, time) {
    for (let i = 0; i < 2; i++) {
        const p = (time * 0.55 + i * 0.5) % 1;
        const side = i === 0 ? -1 : 1;
        const x = side * (40 + Math.sin(p * 6) * 4);
        const y = -92 - p * 32;
        const a = 1 - p;
        const color = i === 0 ? RED : NAVY;
        cr.save();
        cr.translate(x, y);
        ellipse(cr, 0, 0, 4.2, 3.2);
        rgb(cr, color, a);
        cr.fill();
        cr.newPath();
        cr.moveTo(3.8, -0.5);
        cr.lineTo(3.8, -13);
        cr.lineTo(9, -10);
        rgb(cr, color, a);
        cr.setLineWidth(2);
        cr.stroke();
        cr.restore();
    }
}

function drawZzz(cr, time) {
    for (let i = 0; i < 3; i++) {
        const p = (time * 0.35 + i / 3) % 1;
        const s = 3 + p * 4;
        const x = 26 + p * 14;
        const y = -96 - p * 30;
        cr.newPath();
        cr.moveTo(x - s, y - s);
        cr.lineTo(x + s, y - s);
        cr.lineTo(x - s, y + s);
        cr.lineTo(x + s, y + s);
        rgb(cr, NAVY, 1 - p);
        cr.setLineWidth(2.2);
        cr.stroke();
    }
}
