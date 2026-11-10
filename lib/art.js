// Drawing layer: paints Penwing with any Cairo-like context.
// No GNOME imports, so it can be tested with a stub context.

export const UNIT_W = 120;
export const UNIT_H = 140;
const GROUND = 134;

const NAVY = [0.13, 0.2, 0.36];
const INK = [0.07, 0.1, 0.18];
const CREAM = [1.0, 0.96, 0.88];
const ORANGE = [1.0, 0.6, 0.15];
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

    // Feet
    ellipse(cr, -13, -3 - pose.footL, 11, 5);
    fillStroke(cr, ORANGE, 2);
    ellipse(cr, 13, -3 - pose.footR, 11, 5);
    fillStroke(cr, ORANGE, 2);

    // Wings, behind the body, swing outwards when raised.
    drawWing(cr, -29, -55, pose.wingL);
    drawWing(cr, 29, -55, -pose.wingR);

    // Body and belly
    ellipse(cr, 0, -50, 35, 45);
    fillStroke(cr, NAVY, 3);
    ellipse(cr, 0, -38, 25, 31);
    rgb(cr, CREAM);
    cr.fill();

    // Scarf with a little tail
    cr.newPath();
    cr.moveTo(-31, -52);
    cr.curveTo(-12, -45, 12, -45, 31, -52);
    cr.lineTo(31, -44);
    cr.curveTo(12, -37, -12, -37, -31, -44);
    cr.closePath();
    fillStroke(cr, RED, 2);
    cr.newPath();
    cr.moveTo(10, -43);
    cr.lineTo(20, -43);
    cr.lineTo(23, -27);
    cr.lineTo(14, -28);
    cr.closePath();
    fillStroke(cr, RED, 2);

    // Cheeks
    ellipse(cr, -21, -63, 5.5, 3.2);
    rgb(cr, PINK, 0.75);
    cr.fill();
    ellipse(cr, 21, -63, 5.5, 3.2);
    rgb(cr, PINK, 0.75);
    cr.fill();

    drawEyes(cr, pose);

    // Beak
    cr.newPath();
    cr.moveTo(-6.5, -66);
    cr.curveTo(-3, -57, 3, -57, 6.5, -66);
    cr.closePath();
    fillStroke(cr, ORANGE, 2);

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
    for (const ex of [-12, 12]) {
        if (pose.eyes === 'happy') {
            cr.newPath();
            cr.arc(ex, -72, 6, Math.PI * 1.1, Math.PI * 1.9);
            rgb(cr, WHITE);
            cr.setLineWidth(3.5);
            cr.stroke();
        } else if (pose.eyes === 'closed') {
            cr.newPath();
            cr.arc(ex, -78, 6, Math.PI * 0.15, Math.PI * 0.85);
            rgb(cr, WHITE);
            cr.setLineWidth(3);
            cr.stroke();
        } else {
            ellipse(cr, ex, -75, 8, 9.5);
            rgb(cr, WHITE);
            cr.fill();
            const px = ex + pose.look * 2.5;
            ellipse(cr, px, -74, 4.8, 5.6);
            rgb(cr, INK);
            cr.fill();
            ellipse(cr, px + 1.6, -76.2, 1.6, 1.6);
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
