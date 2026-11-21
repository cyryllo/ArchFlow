// People & organisation

import {
  set, shadow, band, box, prism, slabY, slabX, cyl, frustum, sphere, dome, rrect, circle, arc, thick, mix,
  faceL, faceR, faceT, onL, onR, onT, onG, onB, reserve, wire, dotAt, touch,
  px, R, Ci, Ln, Pg, Pa, rows
} from '../iso.mjs';
import { ledRow, check, gear, person } from '../parts.mjs';

const icon = set('af-people');
const n1 = (v) => String(Number(v.toFixed(1)));

// A lighter body tone for people standing in the background
const lite = (c) => ({ top: mix(c.hex, 0.7), left: mix(c.hex, 0.42), right: mix(c.hex, 0.12), seam: c.white });

icon('user', 'Użytkownik', 'User', (c) => {
  return shadow(c, 1.7) + person(0, 0, c, { s: 1.32 }).svg;
});

icon('group', 'Zespół / grupa', 'Team / group', (c) => {
  let s = shadow(c, 2.4);
  s += person(-1.0, 0.0, c, { s: 0.98, mat: lite(c) }).svg + person(0.0, -1.0, c, { s: 0.98, mat: lite(c) }).svg;
  s += person(0.6, 0.6, c, { s: 1.12 }).svg;
  return s;
});

icon('admin', 'Administrator', 'Administrator', (c) => {
  let s = shadow(c, 2.2);
  s += person(-0.5, -0.5, c, { s: 1.25 }).svg;
  s += slabY(gear(0, 0, 0.92, 8, 0.26).map(([x, z]) => [x + 0.95, z + 0.95]), 0.85, 0.3, c, { mat: 'deep', crease: 0.5 });
  s += onL(0.95, 1.15, 0.95, Ci(0, 0, 0.34, c.glow));
  return s;
});

icon('customer', 'Klient', 'Customer', (c) => {
  let s = shadow(c, 2.2);
  s += person(-0.5, -0.5, c, { s: 1.25 }).svg;
  s += box(0.4, 0.7, 0, 1.3, 0.7, 1.25, c, { mat: 'soft' });
  s += onL(0.4, 1.4, 1.25, Pa('M0.38,0v-0.3a0.27,0.3 0 0 1 0.54,0v0.3', 'none', { stroke: c.line, sw: px(1.8) }) + R(0, 0, 1.3, 0.3, c.mid, { op: 0.5 })) + reserve(0.4, 1.4, 1.25, 0, 0.7);
  return s;
});

icon('manager', 'Kierownik / menedżer', 'Manager', (c) => {
  let s = shadow(c, 2.2);
  const p = person(-0.45, -0.45, c, { s: 1.25 });
  const y = p.shoulderY + 1.5, k = p.k;
  s += p.svg + `<path d="M${n1(p.X - 2.6 * k)},${n1(y)}h${n1(5.2 * k)}l${n1(-1.2 * k)},${n1(3.2 * k)}l${n1(2 * k)},${n1(9 * k)}l${n1(-3.4 * k)},${n1(3.6 * k)}l${n1(-3.4 * k)},${n1(-3.6 * k)}l${n1(2 * k)},${n1(-9 * k)}z" fill="${c.night}" stroke="none"/>`;
  s += box(0.35, 0.75, 0, 1.45, 0.6, 1.0, c, { mat: 'deep', r: 0.1 });
  s += onL(0.35, 1.35, 1.0, Pa('M0.47,0v-0.22h0.5v0.22', 'none', { stroke: c.line, sw: px(1.8) }) + R(0.6, 0.3, 0.25, 0.2, c.glow, { rx: 0.04 })) + reserve(0.35, 1.35, 1.0, 0, 0.3);
  return s;
});

icon('developer', 'Programista', 'Developer', (c) => {
  let s = shadow(c, 2.2);
  s += person(-0.5, -0.5, c, { s: 1.25 }).svg;
  s += slabY(rrect(-0.05, 0.1, 2.0, 1.4, 0.15), 0.85, 0.2, c, { mat: 'deep' });
  s += onL(-0.05, 1.05, 1.5, Ln([[0.65, 0.42], [0.35, 0.7], [0.65, 0.98]], c.glow, px(2.2)) + Ln([[1.35, 0.42], [1.65, 0.7], [1.35, 0.98]], c.glow, px(2.2)) + Ln([[1.1, 0.35], [0.9, 1.05]], c.pale, px(2)));
  return s;
});

icon('support-agent', 'Konsultant / wsparcie', 'Support agent', (c) => {
  let s = shadow(c, 1.7);
  const p = person(0, 0, c, { s: 1.32 });
  const r = p.headR, X = p.X, Y = p.headY;
  s += p.svg;
  s += `<path d="M${n1(X - r - 1)},${n1(Y + 1)}A${n1(r + 1)},${n1(r + 1.6)} 0 0 1 ${n1(X + r + 1)},${n1(Y + 1)}" stroke-width="2.6"/>`;
  s += `<rect x="${n1(X - r - 3.2)}" y="${n1(Y - 2.5)}" width="4.6" height="8" rx="2" fill="${c.night}" stroke="none"/><rect x="${n1(X + r - 1.4)}" y="${n1(Y - 2.5)}" width="4.6" height="8" rx="2" fill="${c.night}" stroke="none"/>`;
  s += `<path d="M${n1(X - r - 1)},${n1(Y + 5)}q0,${n1(r * 0.75)} ${n1(r * 0.9)},${n1(r * 0.75)}" stroke-width="1.8"/><circle cx="${n1(X - 1)}" cy="${n1(Y + 5 + r * 0.75)}" r="2" fill="${c.night}" stroke="none"/>`;
  touch(X - r - 4, Y - r - 3);
  return s;
});

icon('partner', 'Partner / dostawca', 'Partner / supplier', (c) => {
  let s = shadow(c, 2.3);
  s += person(0.15, -0.95, c, { s: 1.15, mat: 'deep', head: 'main' }).svg;
  s += person(-0.35, 0.65, c, { s: 1.15 }).svg;
  return s;
});

icon('external-actor', 'Aktor zewnętrzny', 'External actor', (c) => {
  let s = shadow(c, 1.7);
  s += onG(0, 0, 0, `<circle r="1.85" stroke="${c.mid}" stroke-width="${px(2).toFixed(3)}" stroke-dasharray="0.36 0.3"/>`);
  s += person(0, 0, c, { s: 1.25, mat: 'soft', head: 'paper' }).svg;
  return s;
});

icon('meeting', 'Spotkanie / narada', 'Meeting', (c) => {
  let s = shadow(c, 2.5);
  s += person(-1.35, -0.25, c, { s: 0.72, mat: lite(c) }).svg + person(-0.25, -1.35, c, { s: 0.72, mat: lite(c) }).svg;
  s += cyl(0, 0, 0, 0.3, 0.85, c, { mat: 'deep' }) + cyl(0, 0, 0.85, 1.15, 0.16, c, { mat: 'soft' });
  s += person(1.35, 0.25, c, { s: 0.72 }).svg + person(0.25, 1.35, c, { s: 0.72 }).svg;
  return s;
});

icon('role', 'Rola / uprawnienia', 'Role / permissions', (c) => {
  let s = shadow(c, 1.8);
  s += slabY(rrect(-1.3, 0, 2.6, 3.0, 0.22), -0.12, 0.24, c, { cap: c.white });
  const f = Pa('M0.95,0.3L1.3,-0.75L1.65,0.3', 'none', { stroke: c.dark, sw: px(3.4) }) + R(0.9, 0.2, 0.8, 0.2, c.night, { rx: 0.1 })
    + R(0, 0.62, 2.6, 0.2, c.mid) + Ci(1.3, 1.45, 0.36, c.mid) + Pa('M0.68,2.5a0.62,0.62 0 0 1 1.24,0z', c.mid) + Ln([[0.7, 2.75], [1.9, 2.75]], c.pale, px(1.8));
  s += onL(-1.3, 0.12, 3.0, f) + reserve(0, 0.12, 3.0, 0, 0.85);
  return s;
});

icon('department', 'Dział / struktura organizacyjna', 'Department / org chart', (c) => {
  let s = shadow(c, 2.3, 0, 0, 1.4);
  const xs = [-1.3, 0, 1.3];
  s += wire([[0, 0, 2.2], [0, 0, 1.55]], c.line, 1.8) + wire([[-1.3, 0, 0.9], [-1.3, 0, 1.55], [1.3, 0, 1.55], [1.3, 0, 0.9]], c.line, 1.8) + wire([[0, 0, 1.55], [0, 0, 0.9]], c.line, 1.8);
  xs.forEach((x) => {
    s += slabY(rrect(x - 0.55, 0, 1.1, 0.95, 0.12), -0.14, 0.28, c, { mat: 'soft', cap: c.white });
    s += onL(x - 0.55, 0.14, 0.95, Ci(0.55, 0.36, 0.15, c.mid) + Pa('M0.27,0.8a0.28,0.28 0 0 1 0.56,0z', c.mid));
  });
  s += slabY(rrect(-0.7, 2.2, 1.4, 1.1, 0.12), -0.14, 0.28, c);
  s += onL(-0.7, 0.14, 3.3, Ci(0.7, 0.42, 0.18, c.white) + Pa('M0.36,0.95a0.34,0.34 0 0 1 0.68,0z', c.white));
  return s;
});

icon('office', 'Biuro / firma', 'Office / company', (c) => {
  let s = shadow(c, 2.3);
  s += box(-1.4, -1.4, 0, 2.8, 2.8, 3.7, c);
  let l = '', r = '';
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 3; i++) {
      if (j < 3 || i !== 1) l += R(0.32 + i * 0.8, 0.35 + j * 0.78, 0.56, 0.5, (i + j) % 3 ? c.glow : c.pale, { rx: 0.04 });
      r += R(0.32 + i * 0.8, 0.35 + j * 0.78, 0.56, 0.5, c.main.top, { rx: 0.04, op: (i + j) % 3 ? 0.55 : 0.9 });
    }
  }
  l += R(1.08, 2.75, 0.64, 0.95, c.night, { rx: 0.04 });
  s += faceL(-1.4, -1.4, 0, 2.8, 2.8, 3.7, l) + faceR(-1.4, -1.4, 0, 2.8, 2.8, 3.7, r);
  s += box(-0.8, -0.8, 3.7, 1.1, 1.1, 0.35, c, { mat: 'deep' });
  return s;
});

icon('home', 'Dom / praca zdalna', 'Home / remote work', (c) => {
  let s = shadow(c, 2.3);
  s += box(0.55, -0.9, 1.6, 0.5, 0.5, 1.45, c, { mat: 'deep' });
  s += slabY([[-1.6, 0], [1.6, 0], [1.6, 1.7], [0, 2.95], [-1.6, 1.7]], -1.3, 2.6, c);
  s += onL(-1.6, 1.3, 2.95, R(1.85, 1.9, 0.75, 1.05, c.night, { rx: 0.05 }) + R(0.5, 1.75, 0.8, 0.7, c.glow, { rx: 0.05 }) + Ci(1.6, 0.85, 0.24, c.glow));
  s += onR(1.6, 1.3, 1.7, R(0.5, 0.45, 0.6, 0.65, c.main.top, { rx: 0.05, op: 0.7 }) + R(1.5, 0.45, 0.6, 0.65, c.main.top, { rx: 0.05, op: 0.7 }));
  return s;
});
