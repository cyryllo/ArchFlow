// Drawings shared between icons: screens, rack units, people, small glyphs.

import {
  S, P, touch, box, slabY, rrect, bez, shade, mix, LW, px, R, Ci, Ln, Pg, Pa, faceL, faceR, onL, onT
} from './iso.mjs';

const n1 = (v) => String(Number(v.toFixed(1)));

// ---- 2D content (world units, y down) ---------------------------------------

// Diagonal reflection over a screen
export const sheen = (x, y, w, h) => {
  return Pg([[x, y], [x + w * 0.42, y], [x + w * 0.16, y + h], [x, y + h]], '#ffffff', { op: 0.09 });
};
// Dark display with optional content and a reflection
export const display = (x, y, w, h, c, inner = '', rx = 0.07) => {
  return R(x, y, w, h, c.night, { rx }) + inner + sheen(x, y, w, h);
};
export const ledRow = (x, y, count, gap, fill, r = 0.075) => {
  let s = '';
  for (let i = 0; i < count; i++) s += Ci(x + i * gap, y, r, fill);
  return s;
};
// Window chrome for a screen: title bar with dots, then content blocks
export const windowUi = (x, y, w, h, c) => {
  const bar = Math.min(0.32, h * 0.2);
  return R(x, y, w, h, c.white, { rx: 0.06 })
    + Pa(`M${x},${y + bar}V${y + 0.06}a0.06,0.06 0 0 1 0.06,-0.06H${x + w - 0.06}a0.06,0.06 0 0 1 0.06,0.06V${y + bar}Z`, c.pale)
    + ledRow(x + 0.2, y + bar / 2, 3, 0.2, c.white, 0.055);
};
export const check = (cx, cy, s, stroke, sw = px(2.6)) => {
  return Ln([[cx - s, cy], [cx - s * 0.3, cy + s * 0.65], [cx + s, cy - s * 0.7]], stroke, sw);
};
export const cross = (cx, cy, s, stroke, sw = px(2.6)) => {
  return Ln([[cx - s, cy - s], [cx + s, cy + s]], stroke, sw) + Ln([[cx - s, cy + s], [cx + s, cy - s]], stroke, sw);
};
export const plus = (cx, cy, s, stroke, sw = px(2.6)) => {
  return Ln([[cx - s, cy], [cx + s, cy]], stroke, sw) + Ln([[cx, cy - s], [cx, cy + s]], stroke, sw);
};
// Arrow from (x0, y0) to (x1, y1) with a filled head
export const arrow = (x0, y0, x1, y1, stroke, sw = px(2.4), head = 0.3) => {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy);
  const ux = dx / l, uy = dy / l;
  const bx = x1 - ux * head, by = y1 - uy * head;
  return Ln([[x0, y0], [bx, by]], stroke, sw)
    + Pg([[x1, y1], [bx - uy * head * 0.6, by + ux * head * 0.6], [bx + uy * head * 0.6, by - ux * head * 0.6]], stroke, { stroke, sw: px(0.8) });
};
// Envelope front: flap lines on a w x h sheet at (x, y)
export const envelopeFlap = (x, y, w, h, stroke, sw = px(1.3)) => {
  return Ln([[x, y], [x + w / 2, y + h * 0.56], [x + w, y]], stroke, sw)
    + Ln([[x, y + h], [x + w * 0.36, y + h * 0.42]], stroke, sw * 0.8, { op: 0.55 })
    + Ln([[x + w, y + h], [x + w * 0.64, y + h * 0.42]], stroke, sw * 0.8, { op: 0.55 });
};
// Padlock glyph centred on (cx, cy); s = half width
export const padlock = (cx, cy, s, body, shackle, hole) => {
  return Pa(`M${cx - s * 0.6},${cy - s * 0.1}V${cy - s * 0.55}a${s * 0.6},${s * 0.6} 0 0 1 ${s * 1.2},0V${cy - s * 0.1}`, 'none', { stroke: shackle, sw: s * 0.3 })
    + R(cx - s, cy - s * 0.15, s * 2, s * 1.5, body, { rx: s * 0.22 })
    + Ci(cx, cy + s * 0.5, s * 0.24, hole) + Ln([[cx, cy + s * 0.5], [cx, cy + s * 0.95]], hole, s * 0.2);
};
// Gear outline points centred on (cx, cy)
export const gear = (cx, cy, r, teeth = 8, depth = 0.24) => {
  const out = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2, w = Math.PI / teeth;
    [[-0.5, 1 - depth], [-0.3, 1], [0.3, 1], [0.5, 1 - depth]].forEach(([k, rr]) => {
      out.push([cx + Math.cos(a + k * w) * r * rr, cy + Math.sin(a + k * w) * r * rr]);
    });
  }
  return out;
};
// Radio waves: arcs opening upwards/sideways around a point (billboard units)
export const waves = (cx, cy, radii, from, to, stroke, sw = px(1.7)) => {
  const rad = (a) => (a * Math.PI) / 180;
  return radii
    .map((r) => {
      return Pa(`M${cx + Math.cos(rad(from)) * r},${cy - Math.sin(rad(from)) * r}A${r},${r} 0 0 0 ${cx + Math.cos(rad(to)) * r},${cy - Math.sin(rad(to)) * r}`, 'none', { stroke, sw });
    })
    .join('');
};

// ---- 3D parts -----------------------------------------------------------------

// One rack unit: box with a dark front slot, status leds and vents
export const rackUnit = (x, y, z, w, d, h, c, o = {}) => {
  const slot = R(0.18, 0.17, w - 0.36, h - 0.34, c.night, { rx: 0.08 })
    + ledRow(0.42, h / 2, 2, 0.24, c.glow)
    + Ln([[w - 1.25, h / 2], [w - 0.42, h / 2]], c.pale, px(1.5), { op: 0.8 });
  return box(x, y, z, w, d, h, c, o) + faceL(x, y, z, w, d, h, slot)
    + faceR(x, y, z, w, d, h, Ln([[0.3, h / 2], [d - 0.3, h / 2]], c.line, px(1.2), { op: 0.35 }));
};

// Person: rounded body with a ball head. Returns { svg, X, headY, headR, shoulderY, w }
// so that icons can add accessories in screen space.
let personSeq = 0;
export const person = (cx, cy, c, o = {}) => {
  const k = o.s ?? 1;
  const m = typeof o.mat === 'object' ? o.mat : c[o.mat || 'main'];
  const head = c[o.head || 'soft'];
  const [X, Y] = P(cx, cy, 0);
  const a = 13.5 * k, b = 7.8 * k; // foot ellipse
  const top = 27 * k, sh = 9.5 * k; // body height, shoulder half width
  const hr = 8.4 * k;
  const hy = Y - top - hr * 0.72;
  touch(X - a, hy - hr);
  touch(X + a, Y + b);
  const id = `p${personSeq++}`;
  const stops = [[0, 0.4], [0.3, 0.6], [0.65, 0.3], [1, 0.03]].map(([off, t]) => `<stop offset="${off}" stop-color="${shade(m, t)}"/>`).join('');
  const body = `<linearGradient id="${id}">${stops}</linearGradient>`
    + `<path d="M${n1(X - a)},${n1(Y)}A${n1(a)},${n1(b)} 0 0 0 ${n1(X + a)},${n1(Y)}C${n1(X + a)},${n1(Y - top * 0.55)} ${n1(X + sh * 1.25)},${n1(Y - top)} ${n1(X)},${n1(Y - top)}C${n1(X - sh * 1.25)},${n1(Y - top)} ${n1(X - a)},${n1(Y - top * 0.55)} ${n1(X - a)},${n1(Y)}Z" fill="url(#${id})"/>`;
  const hid = `q${personSeq++}`;
  const ball = `<radialGradient id="${hid}" cx="0.36" cy="0.3" r="0.8"><stop offset="0" stop-color="${mix(head.top, 0.6)}"/><stop offset="0.55" stop-color="${head.left}"/><stop offset="1" stop-color="${head.right}"/></radialGradient>`
    + `<circle cx="${n1(X)}" cy="${n1(hy)}" r="${n1(hr)}" fill="url(#${hid})"/>`;
  return { svg: body + ball, X, Y, headY: hy, headR: hr, shoulderY: Y - top, a, k };
};
export const resetParts = () => {
  personSeq = 0;
};
export { S, onL };

// Upright envelope: sheet w x h standing at (x0, z0), front face at y + 0.26
export const envelope = (c, x0, z0, w, h, y, d = 0.26) => {
  return slabY(rrect(x0, z0, w, h, 0.1), y, d, c, { cap: c.white })
    + onL(x0, y + d, z0 + h, Pg([[0.06, 0.06], [w / 2, h * 0.58], [w - 0.06, 0.06]], c.glow) + envelopeFlap(0.06, 0.06, w - 0.12, h - 0.12, c.mid, px(1.5)));
};
// Speech bubble outline (x, z): rounded rect with a tail at the bottom
export const bubble = (x, z, w, h, r, tailX, tailW = 0.6, tailH = 0.65, lean = -0.3) => {
  return [...rrect(x, z, w, h, r, 3), [tailX, z], [tailX + lean, z - tailH], [tailX + tailW, z]];
};
// Phone standing upright, screen content in a (w - 0.26) x (h - 0.26) display
export const phone = (c, x0, y, w, h, content = '') => {
  return slabY(rrect(x0, 0, w, h, 0.26), y, 0.24, c) + onL(x0, y + 0.24, h, display(0.13, 0.13, w - 0.26, h - 0.26, c, content, 0.18));
};
// Upright sheet of paper, w x h standing on z0 with its left edge at x0; the
// content is drawn on the front. o.fold cuts and folds the top right corner.
export const sheet = (c, x0, z0, w, h, y, content = '', o = {}) => {
  const f = o.fold ?? 0;
  const d = o.d ?? 0.14;
  const prof = f ? [[x0, z0], [x0 + w, z0], [x0 + w, z0 + h - f], [x0 + w - f, z0 + h], [x0, z0 + h]] : rrect(x0, z0, w, h, 0.05, 1);
  return slabY(prof, y, d, c, { mat: o.mat, cap: o.cap ?? c.white })
    + onL(x0, y + d, z0 + h, content + (f ? Pg([[w - f, 0], [w, f], [w - f, f]], c.tint, { stroke: c.pale, sw: px(1) }) : ''));
};
// Circular "again" arrow (gap at the top, head pointing back)
export const cycleArrow = (cx, cy, r, stroke, sw = px(2.6)) => {
  const p = (deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
  const [x0, y0] = p(-55), [x1, y1] = p(235);
  const h = r * 0.48;
  return Pa(`M${x0},${y0}A${r},${r} 0 1 1 ${x1},${y1}`, 'none', { stroke, sw })
    + Pg([[x0 - h * 0.95, y0 - h * 0.35], [x0 + h * 0.5, y0 - h * 0.55], [x0 + h * 0.05, y0 + h * 0.75]], stroke, { stroke, sw: px(0.8) });
};
// Open tray: call trayBack, draw the contents, then trayFront
export const trayBack = (c, x, y, w, d, h, o = {}) => {
  return box(x, y, 0, w, d, h, c, { r: 0.15, ...o }) + onT(x, y, h, R(0.22, 0.22, w - 0.44, d - 0.44, c.night, { rx: 0.1 }));
};
export const trayFront = (c, x, y, w, d, h, glyph = '', o = {}) => {
  return box(x, y + d - 0.3, 0, w, 0.3, h, c, { r: 0.1, ...o }) + onL(x, y + d, h, glyph);
};
// Heater-shield outline (x, z): half width w, height h, standing on z0
export const shieldShape = (w, h, x0 = 0, z0 = 0) => {
  const half = [[0, h], [-w, h - h * 0.1], ...bez([-w, h - h * 0.1], [-w, h * 0.42], [-w * 0.55, h * 0.13], [0, 0], 8, true)];
  const right = half.slice(1, -1).reverse().map(([x, z]) => [-x, z]);
  return [...half, ...right].map(([x, z]) => [x0 + x, z0 + z]);
};
