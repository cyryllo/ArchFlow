// Business & logistics

import {
  set, shadow, band, box, prism, slabY, slabX, cyl, frustum, sphere, dome, loft, extrude, rrect, circle, arc, bez, thick,
  faceL, faceR, faceT, onL, onR, onT, onG, onB, onPlane, reserve, wire, dotAt,
  px, R, Ci, Ln, Pg, Pa, rows
} from '../iso.mjs';
import { display, ledRow, check, arrow, sheet } from '../parts.mjs';

const icon = set('af-business');

// Wheel on the left side of a vehicle (axis along y)
const wheel = (c, x, y, r = 0.36) => {
  return slabY(circle(x, r, r, 16), y, 0.26, c, { mat: 'deep' }) + onL(x, y + 0.26, r, Ci(0, 0, r * 0.42, c.pale));
};
// Cardboard box with a tape strip and a label
const parcel = (c, x, y, z, w, d, h, mat) => {
  return box(x, y, z, w, d, h, c, { mat })
    + faceT(x, y, z, w, d, h, R(w * 0.4, 0, w * 0.2, d, mat ? c.pale : c.main.seam, { op: 0.9 }))
    + faceL(x, y, z, w, d, h, R(w * 0.4, 0, w * 0.2, h * 0.3, mat ? c.pale : c.main.top, { op: 0.9 }));
};

icon('paymentcard', 'Karta płatnicza', 'Payment card', (c) => {
  let s = shadow(c, 2.1);
  s += slabY(rrect(-1.85, 0, 3.7, 2.4, 0.24), -0.1, 0.2, c);
  s += onL(-1.85, 0.1, 2.4, R(0, 0.38, 3.7, 0.46, c.night) + R(0.4, 1.2, 0.68, 0.5, c.glow, { rx: 0.1 }) + Ln([[0.4, 2.0], [1.1, 2.0]], c.white, px(2)) + Ln([[1.35, 2.0], [2.05, 2.0]], c.white, px(2))
    + Ci(2.75, 1.5, 0.3, c.white, { op: 0.9 }) + Ci(3.12, 1.5, 0.3, c.main.top, { op: 0.9 }));
  return s;
});

icon('cardterminal', 'Terminal płatniczy', 'Card terminal', (c) => {
  let s = shadow(c, 1.9);
  const y0 = -1.3, z0 = 1.9, y1 = 1.35, z1 = 0.55;
  s += slabY(rrect(-0.65, 1.5, 1.3, 1.5, 0.12), -1.2, 0.1, c, { mat: 'soft', cap: c.white });
  s += onL(-0.65, -1.1, 3.0, R(0, 0.25, 1.3, 0.25, c.pale));
  s += slabX([[y0, 0], [y1, 0], [y1, z1], [y0, z0]], -1.1, 2.2, c);
  const len = Math.hypot(y1 - y0, z1 - z0);
  let f = display(0.25, 0.3, 1.7, 0.85, c, Ln([[0.5, 0.72], [1.3, 0.72]], c.glow, px(2)));
  for (let r = 0; r < 3; r++) f += ledRow(0.55, 1.55 + r * 0.42, 3, 0.55, c.white, 0.14);
  s += onPlane([-1.1, y0, z0], [1, 0, 0], [0, (y1 - y0) / len, (z1 - z0) / len], f);
  return s;
});

icon('cart', 'Koszyk', 'Shopping cart', (c) => {
  let s = shadow(c, 2.2);
  const rect = (x0, x1, y, z) => [[x0, -y, z], [x1, -y, z], [x1, y, z], [x0, y, z]];
  s += sphere(-0.75, -0.6, 0.22, 0.2, c, { mat: 'deep' }) + sphere(1.1, -0.6, 0.22, 0.2, c, { mat: 'deep' });
  s += wire([[-0.75, 0.6, 0.3], [-0.75, 0.6, 0.85]], c.line, 2) + wire([[1.1, 0.6, 0.3], [1.1, 0.6, 0.85]], c.line, 2);
  s += wire([[-1.35, -0.9, 2.1], [-1.95, -0.9, 2.5], [-1.95, 0.9, 2.5], [-1.35, 0.9, 2.1]], c.line, 2.6);
  s += loft(rect(-1.35, 1.6, 0.95, 2.1), rect(-0.95, 1.25, 0.7, 0.85), c, { cap: c.night });
  s += wire([[-0.6, 0.86, 1.6], [1.38, 0.86, 1.6]], c.main.seam, 1) + wire([[-0.3, 0.78, 1.15], [1.3, 0.78, 1.15]], c.main.seam, 1);
  s += box(-0.7, -0.5, 1.9, 0.9, 0.8, 0.65, c, { mat: 'soft' }) + box(0.4, -0.3, 1.9, 0.75, 0.75, 0.4, c, { mat: 'deep' });
  s += sphere(-0.75, 0.6, 0.22, 0.2, c, { mat: 'deep' }) + sphere(1.1, 0.6, 0.22, 0.2, c, { mat: 'deep' });
  return s;
});

icon('order', 'Zamówienie', 'Order', (c) => {
  let s = shadow(c, 2.0);
  s += box(-1.25, -0.7, 0, 2.5, 1.4, 2.5, c);
  s += faceT(-1.25, -0.7, 0, 2.5, 1.4, 2.5, R(0.15, 0.15, 2.2, 1.1, c.night));
  s += onL(-1.25, 0.7, 2.5, Pa('M0.7,0.05v-0.5a0.55,0.6 0 0 1 1.1,0v0.5', 'none', { stroke: c.line, sw: px(2.2) }) + Ci(1.25, 1.35, 0.55, c.white) + check(1.25, 1.37, 0.26, c.mid, px(2.6))) + reserve(0, 0.7, 2.5, 0, 1.1);
  return s;
});

icon('invoice', 'Faktura', 'Invoice', (c) => {
  const f = R(0.35, 0.4, 0.6, 0.6, c.mid, { rx: 0.1 }) + rows(1.3, 0.5, 0.95, 0.3, 2, c.pale, px(1.8)) + rows(0.35, 1.45, 1.9, 0.34, 3, c.pale, px(1.8), 1)
    + Ln([[0.35, 2.45], [2.25, 2.45]], c.dark, px(1.2), { cap: 'butt' }) + R(1.25, 2.65, 1.0, 0.32, c.mid, { rx: 0.08 });
  return shadow(c, 1.7) + sheet(c, -1.3, 0, 2.6, 3.3, -0.1, f, { fold: 0.7, d: 0.2 });
});

icon('receipt', 'Paragon', 'Receipt', (c) => {
  let s = shadow(c, 1.5);
  const prof = [];
  for (let i = 0; i <= 8; i++) prof.push([-1.0 + i * 0.25, i % 2 ? 0.05 : 0.28]);
  s += slabY([...prof, [1.0, 3.5], [-1.0, 3.5]], -0.08, 0.16, c, { cap: c.white });
  let f = R(0.6, 0.3, 0.8, 0.26, c.mid, { rx: 0.08 }) + rows(0.3, 0.95, 1.4, 0.32, 3, c.pale, px(1.8), 1) + Ln([[0.3, 2.0], [1.7, 2.0]], c.dark, px(1.2), { cap: 'butt' });
  for (let i = 0; i < 7; i++) f += Ln([[0.42 + i * 0.2, 2.3], [0.42 + i * 0.2, 2.85]], c.dark, px(i % 3 ? 1.4 : 2.4), { cap: 'butt' });
  s += onL(-1.0, 0.08, 3.5, f);
  return s;
});

icon('contract', 'Umowa', 'Contract', (c) => {
  let s = shadow(c, 1.9);
  const f = R(0.35, 0.4, 1.2, 0.26, c.mid, { rx: 0.08 }) + rows(0.35, 1.0, 1.9, 0.34, 4, c.pale, px(1.8))
    + Pa('M0.4,2.75c0.2,-0.6 0.4,-0.6 0.45,-0.1s0.3,0.2 0.45,-0.25s0.3,0.5 0.75,0.2', 'none', { stroke: c.dark, sw: px(1.8) }) + Ln([[0.35, 2.95], [1.7, 2.95]], c.pale, px(1.2));
  s += sheet(c, -1.5, 0, 2.6, 3.3, -0.3, f, { fold: 0.7, d: 0.2 });
  s += slabY(thick([[0.75, 0.3], [1.85, 2.2]], 0.26), 0.35, 0.26, c);
  s += slabY([[0.56, 0.36], [0.85, 0.12], [0.52, 0.02]], 0.35, 0.26, c, { mat: 'deep' });
  return s;
});

icon('money', 'Pieniądze / płatność', 'Money / payment', (c) => {
  let s = shadow(c, 2.3);
  const stack = (x, y, n, mat) => {
    let t = cyl(x, y, 0, 0.85, n * 0.26, c, { mat });
    for (let i = 1; i < n; i++) t += band(x, y, i * 0.26, 0.85, c.line, 0.8);
    return t + onG(x, y, n * 0.26, Ci(0, 0, 0.58, 'none', { stroke: mat ? c.mid : c.white, sw: px(1.6) }) + Ci(0, 0, 0.2, mat ? c.mid : c.white));
  };
  s += stack(-0.2, -0.95, 7) + stack(-0.95, 0.5, 4) + stack(0.9, 0.55, 2, 'soft');
  return s;
});

icon('bank', 'Bank', 'Bank', (c) => {
  let s = shadow(c, 2.4);
  s += box(-1.9, -1.4, 0, 3.8, 2.8, 0.3, c, { mat: 'soft' });
  s += box(-1.5, -1.1, 0.3, 3.0, 1.7, 1.6, c, { mat: 'deep' });
  for (let i = 0; i < 4; i++) s += cyl(-1.35 + i * 0.9, 1.0, 0.3, 0.22, 1.6, c, { mat: 'soft' });
  s += box(-1.8, -1.3, 1.9, 3.6, 2.6, 0.26, c, { mat: 'soft' });
  s += slabY([[-1.9, 2.16], [1.9, 2.16], [0, 3.2]], -1.4, 2.8, c);
  s += onL(0, 1.4, 2.58, Ci(0, 0, 0.24, c.white));
  return s;
});

icon('wallet', 'Portfel', 'Wallet', (c) => {
  let s = shadow(c, 2.1);
  s += slabY(rrect(-1.2, 1.5, 2.2, 1.1, 0.12), -0.2, 0.1, c, { mat: 'soft', cap: c.white });
  s += onL(-1.2, -0.1, 2.6, R(0, 0.2, 2.2, 0.22, c.pale));
  s += box(-1.75, -0.5, 0, 3.5, 1.0, 2.15, c, { r: 0.28, steps: 3 });
  s += faceL(-1.75, -0.5, 0, 3.5, 1.0, 2.15, Ln([[0.35, 0.5], [3.15, 0.5]], c.main.seam, px(1.4), { op: 0.9 }) + R(2.15, 0.82, 1.35, 0.72, c.main.right, { rx: 0.3, stroke: c.line, sw: px(1) }) + Ci(2.6, 1.18, 0.16, c.glow));
  return s;
});

icon('store', 'Sklep / punkt sprzedaży', 'Store / point of sale', (c) => {
  let s = shadow(c, 2.4);
  s += box(-1.65, -1.3, 0, 3.3, 2.3, 2.3, c, { mat: 'soft' });
  s += faceL(-1.65, -1.3, 0, 3.3, 2.3, 2.3, R(0.3, 1.0, 1.5, 0.9, c.pale, { rx: 0.05, stroke: c.line, sw: px(1) }) + R(2.15, 0.95, 0.85, 1.35, c.night, { rx: 0.05 }) + Ci(2.32, 1.65, 0.07, c.glow));
  s += box(-1.0, -0.9, 2.3, 2.0, 0.3, 0.75, c, { r: 0.08 });
  s += onL(-1.0, -0.6, 3.05, Ln([[0.4, 0.38], [1.6, 0.38]], c.white, px(2.6)));
  const A = [[-1.8, 1.0, 2.35], [1.8, 1.0, 2.35], [1.8, 1.85, 1.65], [-1.8, 1.85, 1.65]];
  s += extrude(A, [0, 0, -0.12], c);
  const len = Math.hypot(0.85, 0.7);
  let st = '';
  for (let i = 0; i < 4; i++) st += R(0.45 + i * 0.9, 0, 0.45, len, c.white);
  s += onPlane(A[0], [1, 0, 0], [0, 0.85 / len, -0.7 / len], st);
  return s;
});

icon('warehouse', 'Magazyn', 'Warehouse', (c) => {
  let s = shadow(c, 2.5);
  s += slabY([[-1.9, 0], [1.9, 0], [1.9, 1.5], [0, 2.4], [-1.9, 1.5]], -1.45, 2.9, c);
  let f = R(1.0, 1.15, 1.8, 1.25, c.night, { rx: 0.05 });
  for (let i = 1; i < 4; i++) f += Ln([[1.0, 1.15 + i * 0.3], [2.8, 1.15 + i * 0.3]], c.dark, px(1.2), { cap: 'butt' });
  s += onL(-1.9, 1.45, 2.4, f + Ci(1.9, 0.6, 0.2, c.white));
  s += onR(1.9, 1.45, 1.5, R(0.5, 0.35, 0.55, 0.4, c.main.top, { rx: 0.04, op: 0.8 }) + R(1.9, 0.35, 0.55, 0.4, c.main.top, { rx: 0.04, op: 0.8 }));
  return s;
});

icon('shelf', 'Regał / zapasy', 'Shelf / inventory', (c) => {
  let s = shadow(c, 2.3);
  const post = (x, y) => box(x - 0.07, y - 0.07, 0, 0.14, 0.14, 3.5, c, { mat: 'deep' });
  s += post(-1.7, -0.7) + post(1.7, -0.7);
  [0.2, 1.3, 2.4].forEach((z, i) => {
    s += box(-1.75, -0.75, z, 3.5, 1.5, 0.12, c, { mat: 'soft' });
    const items = [[[-1.45, 0.9, 'main'], [-0.35, 0.7, 'soft'], [0.6, 0.95, 'main']], [[-1.4, 1.2, 'soft'], [0.1, 0.75, 'main'], [0.95, 0.6, 'deep']], [[-1.2, 0.8, 'main'], [0.4, 1.1, 'soft']]][i];
    items.forEach(([x, w, mat]) => {
      s += box(x, -0.5, z + 0.12, w, 1.0, 0.72, c, { mat });
    });
  });
  s += post(-1.7, 0.7) + post(1.7, 0.7);
  return s;
});

icon('forklift', 'Wózek widłowy', 'Forklift', (c) => {
  let s = shadow(c, 2.3);
  s += box(-1.8, -0.7, 0.3, 1.9, 1.4, 0.95, c, { r: 0.15 });
  const bar = (x, y) => box(x - 0.06, y - 0.06, 1.25, 0.12, 0.12, 1.35, c, { mat: 'deep' });
  s += bar(-1.55, -0.55) + bar(-0.15, -0.55) + bar(-1.55, 0.55) + bar(-0.15, 0.55);
  s += box(-1.7, -0.7, 2.6, 1.75, 1.4, 0.12, c, { mat: 'deep' });
  s += box(0.15, -0.6, 0.15, 0.16, 0.16, 3.0, c, { mat: 'deep' }) + box(0.15, 0.44, 0.15, 0.16, 0.16, 3.0, c, { mat: 'deep' });
  s += box(0.31, -0.55, 0.15, 1.5, 0.22, 0.09, c, { mat: 'deep' }) + box(0.31, 0.33, 0.15, 1.5, 0.22, 0.09, c, { mat: 'deep' });
  s += parcel(c, 0.45, -0.6, 0.24, 1.2, 1.2, 1.05, 'soft');
  s += wheel(c, -1.3, 0.48, 0.38) + wheel(c, -0.25, 0.48, 0.38);
  return s;
});

icon('pallet', 'Paleta', 'Pallet', (c) => {
  let s = shadow(c, 2.4);
  [-1.7, -0.22, 1.25].forEach((x) => {
    s += box(x, -1.7, 0, 0.45, 3.4, 0.26, c, { mat: 'deep' });
  });
  s += box(-1.75, -1.75, 0.26, 3.5, 3.5, 0.14, c, { mat: 'soft' });
  s += parcel(c, -1.5, -1.5, 0.4, 1.45, 1.45, 1.2) + parcel(c, 0.05, -1.5, 0.4, 1.45, 1.45, 1.2, 'soft') + parcel(c, -1.5, 0.05, 0.4, 1.45, 1.45, 1.2, 'soft') + parcel(c, 0.05, 0.05, 0.4, 1.45, 1.45, 1.2);
  s += parcel(c, -0.75, -0.75, 1.6, 1.45, 1.45, 1.1);
  return s;
});

icon('package-module', 'Paczka / przesyłka', 'Package / parcel', (c) => {
  let s = shadow(c, 2.2);
  s += parcel(c, -1.4, -1.4, 0, 2.8, 2.8, 2.1);
  s += faceL(-1.4, -1.4, 0, 2.8, 2.8, 2.1, R(0.25, 1.05, 0.95, 0.7, c.white, { rx: 0.05 }) + rows(0.4, 1.28, 0.65, 0.22, 2, c.pale, px(1.5)));
  s += faceR(-1.4, -1.4, 0, 2.8, 2.8, 2.1, arrow(2.0, 1.5, 2.0, 0.6, c.main.left, px(2), 0.3) + arrow(1.4, 1.5, 1.4, 0.6, c.main.left, px(2), 0.3));
  return s;
});

icon('truck', 'Ciężarówka / transport', 'Truck / transport', (c) => {
  let s = shadow(c, 2.4, 0, 0, 1.5);
  s += box(-1.95, -0.7, 0.3, 3.85, 1.4, 0.22, c, { mat: 'deep' });
  s += box(-1.95, -0.8, 0.52, 2.55, 1.6, 2.0, c, { mat: 'soft' });
  s += faceL(-1.95, -0.8, 0.52, 2.55, 1.6, 2.0, R(0, 1.1, 2.55, 0.4, c.mid));
  s += slabY([[0.72, 0.52], [1.95, 0.52], [1.95, 1.35], [1.6, 2.1], [0.72, 2.1]], -0.8, 1.6, c);
  s += onL(0.72, 0.8, 2.1, Pg([[0.2, 0.2], [0.82, 0.2], [1.02, 0.75], [0.2, 0.75]], c.glow, { stroke: c.line, sw: px(1) }));
  s += wheel(c, -1.35, 0.56) + wheel(c, -0.5, 0.56) + wheel(c, 1.3, 0.56);
  return s;
});

icon('truck-2', 'Samochód dostawczy', 'Delivery van', (c) => {
  let s = shadow(c, 2.4, 0, 0, 1.5);
  s += slabY([[-1.9, 0.35], [1.9, 0.35], [1.9, 1.2], [1.4, 1.35], [0.95, 2.25], [-1.9, 2.25]], -0.8, 1.6, c);
  s += onL(-1.9, 0.8, 2.25, Pg([[2.0, 0.25], [2.72, 0.25], [3.1, 0.95], [2.0, 0.95]], c.glow, { stroke: c.line, sw: px(1) }) + Ln([[1.8, 0.2], [1.8, 1.75]], c.line, px(1), { op: 0.5 })
    + R(0.25, 0.7, 1.3, 0.4, c.white, { rx: 0.08, op: 0.9 }) + Ci(3.65, 1.25, 0.1, c.glow));
  s += wheel(c, -1.1, 0.56) + wheel(c, 1.15, 0.56);
  return s;
});

icon('plane', 'Samolot / transport lotniczy', 'Plane / air freight', (c) => {
  let s = shadow(c, 2.0);
  const wing = (sy) => prism([[-0.75, sy * 1.95], [-0.25, sy * 1.95], [0.85, sy * 0.3], [-0.05, sy * 0.3]], 1.5, 0.1, c, { mat: 'soft' });
  const tail = (sy) => prism([[-1.9, sy * 0.85], [-1.6, sy * 0.85], [-1.2, sy * 0.25], [-1.75, sy * 0.25]], 1.6, 0.08, c, { mat: 'soft' });
  s += wing(-1) + tail(-1);
  s += prism(rrect(-1.9, -0.4, 3.8, 0.8, 0.4, 4), 1.2, 0.75, c);
  s += onL(-1.9, 0.4, 1.95, ledRow(0.9, 0.3, 6, 0.36, c.glow, 0.09));
  s += slabY([[-1.85, 1.95], [-1.05, 1.95], [-1.5, 2.85], [-1.85, 2.85]], -0.07, 0.14, c);
  s += wing(1) + tail(1);
  return s;
});

icon('ship', 'Statek / transport morski', 'Ship / sea freight', (c) => {
  let s = shadow(c, 2.4, 0, 0, 1.5);
  s += prism([[-1.95, -0.75], [1.15, -0.75], [1.95, 0], [1.15, 0.75], [-1.95, 0.75]], 0, 0.8, c, { mat: 'deep' });
  s += box(-1.8, -0.55, 0.8, 0.85, 1.1, 1.3, c, { mat: 'soft' });
  s += faceL(-1.8, -0.55, 0.8, 0.85, 1.1, 1.3, R(0.12, 0.2, 0.6, 0.26, c.night, { rx: 0.04 }));
  s += cyl(-1.4, 0, 2.1, 0.2, 0.45, c);
  [['main', 'soft'], ['soft', 'main'], ['main']].forEach((col, i) => {
    col.forEach((mat, j) => {
      s += box(-0.8 + i * 0.68, -0.55, 0.8 + j * 0.5, 0.62, 1.1, 0.5, c, { mat });
    });
  });
  return s;
});

icon('train', 'Pociąg / transport kolejowy', 'Train / rail freight', (c) => {
  let s = shadow(c, 2.4, 0, 0, 1.5);
  s += wire([[-1.95, -0.6, 0.02], [1.95, -0.6, 0.02]], c.line, 1.6) + wire([[-1.95, 0.75, 0.02], [1.95, 0.75, 0.02]], c.line, 1.6);
  s += slabY([[-1.9, 0.35], [1.9, 0.35], [1.9, 1.0], ...bez([1.9, 1.0], [1.8, 1.8], [1.5, 2.25], [0.9, 2.25], 6, true), [-1.9, 2.25]], -0.75, 1.5, c);
  let f = R(0.25, 0.4, 2.3, 0.55, c.night, { rx: 0.1 });
  for (let i = 1; i < 4; i++) f += Ln([[0.25 + i * 0.575, 0.4], [0.25 + i * 0.575, 0.95]], c.mid, px(1.4), { cap: 'butt' });
  s += onL(-1.9, 0.75, 2.25, f + Pa('M2.75,0.4h0.35q0.45,0.25 0.55,0.55h-0.9z', c.glow) + R(0, 1.2, 3.8, 0.2, c.white, { op: 0.85 }));
  s += wheel(c, -1.3, 0.52, 0.3) + wheel(c, -0.5, 0.52, 0.3) + wheel(c, 0.6, 0.52, 0.3) + wheel(c, 1.4, 0.52, 0.3);
  return s;
});

icon('drone', 'Dron dostawczy', 'Delivery drone', (c) => {
  let s = shadow(c, 1.5);
  const rotor = (x, y) => cyl(x, y, 2.45, 0.1, 0.12, c, { mat: 'deep' }) + cyl(x, y, 2.57, 0.72, 0.04, c, { mat: 'soft', op: 0.7 });
  const arm = (x, y) => wire([[0, 0, 2.3], [x, y, 2.45]], c.line, 3);
  s += arm(-1.35, -1.35) + rotor(-1.35, -1.35) + arm(1.35, -1.35) + arm(-1.35, 1.35);
  s += rotor(1.35, -1.35) + rotor(-1.35, 1.35);
  s += wire([[-0.3, 0.3, 2.0], [-0.3, 0.3, 1.5]], c.line, 1.2) + wire([[0.3, -0.3, 2.0], [0.3, -0.3, 1.5]], c.line, 1.2);
  s += box(-0.55, -0.55, 0.55, 1.1, 1.1, 0.95, c, { mat: 'soft' });
  s += faceT(-0.55, -0.55, 0.55, 1.1, 1.1, 0.95, R(0.42, 0, 0.26, 1.1, c.pale));
  s += box(-0.6, -0.6, 1.95, 1.2, 1.2, 0.45, c, { r: 0.25 });
  s += arm(1.35, 1.35) + rotor(1.35, 1.35);
  return s;
});

icon('factory', 'Fabryka / zakład', 'Factory / plant', (c) => {
  let s = shadow(c, 2.5);
  s += cyl(-1.35, -0.8, 0, 0.3, 3.3, c, { mat: 'deep' });
  s += sphere(-1.2, -0.8, 3.75, 0.3, c, { mat: 'paper' }) + sphere(-0.85, -0.8, 4.2, 0.4, c, { mat: 'paper' });
  s += slabY([[-1.9, 0], [1.9, 0], [1.9, 1.5], [0.65, 2.2], [0.65, 1.5], [-0.6, 2.2], [-0.6, 1.5], [-1.9, 2.2]], -1.3, 2.6, c);
  s += onL(-1.9, 1.3, 2.2, ledRow(0.7, 1.15, 4, 0.8, c.glow, 0.001) + R(0.35, 1.0, 0.55, 0.45, c.glow, { rx: 0.04 }) + R(1.2, 1.0, 0.55, 0.45, c.glow, { rx: 0.04 }) + R(2.05, 1.0, 0.55, 0.45, c.glow, { rx: 0.04 }) + R(2.95, 1.2, 0.6, 1.0, c.night, { rx: 0.04 }));
  return s;
});

icon('factory-line', 'Linia produkcyjna', 'Production line', (c) => {
  let s = shadow(c, 2.4, 0, 0, 1.6);
  s += box(-1.6, -0.7, 0, 0.3, 1.4, 0.6, c, { mat: 'deep' }) + box(1.3, -0.7, 0, 0.3, 1.4, 0.6, c, { mat: 'deep' });
  s += box(-1.95, -0.85, 0.6, 3.9, 1.7, 0.32, c, { r: 0.16 });
  s += faceT(-1.95, -0.85, 0.6, 3.9, 1.7, 0.32, R(0.18, 0.18, 3.54, 1.34, c.night, { rx: 0.1 }));
  s += faceL(-1.95, -0.85, 0.6, 3.9, 1.7, 0.32, ledRow(0.45, 0.16, 8, 0.43, c.white, 0.07));
  s += box(-1.55, -0.45, 0.92, 0.9, 0.9, 0.8, c, { mat: 'soft' }) + box(-0.35, -0.45, 0.92, 0.9, 0.9, 0.8, c) + box(0.85, -0.45, 0.92, 0.9, 0.9, 0.8, c, { mat: 'soft' });
  return s;
});

icon('kpi-chart', 'Wskaźniki KPI / wykres', 'KPI / chart', (c) => {
  let s = shadow(c, 2.4, 0, 0, 1.6);
  s += box(-1.0, -1.95, 0, 2.0, 3.9, 0.2, c, { mat: 'soft', r: 0.12 });
  [3.0, 2.2, 1.15, 1.5, 0.8].forEach((h, i) => {
    s += box(-0.45, -1.7 + i * 0.7, 0.2, 0.9, 0.52, h, c, { mat: i === 0 ? 'deep' : 'main' });
  });
  return s;
});

icon('price-tag', 'Cena / promocja', 'Price tag / promotion', (c) => {
  let s = shadow(c, 2.1, 0, 0, 1.3);
  s += slabY([[-1.9, 1.25], [-1.0, 0.15], [1.6, 0.15], ...arc(1.6, 0.4, 0.25, -90, 0, 2).slice(1), ...arc(1.6, 2.1, 0.25, 0, 90, 2), [-1.0, 2.35]], -0.15, 0.3, c);
  const o = { stroke: c.white, sw: px(2.2) };
  s += onL(-1.9, 0.15, 2.35, Ci(0.75, 1.1, 0.2, c.night) + Ci(1.75, 0.75, 0.24, 'none', o) + Ci(2.75, 1.5, 0.24, 'none', o) + Ln([[2.75, 0.55], [1.75, 1.7]], c.white, px(2.2)));
  return s;
});
