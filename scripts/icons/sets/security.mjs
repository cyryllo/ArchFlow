// Security

import {
  set, shadow, band, box, prism, slabY, slabX, cyl, frustum, sphere, dome, loft, rrect, circle, arc, bez, thick,
  faceL, faceR, faceT, onL, onR, onT, onG, onB, reserve, wire, dotAt,
  px, R, Ci, Ln, Pg, Pa, rows
} from '../iso.mjs';
import { display, ledRow, check, padlock, sheet, shieldShape, phone } from '../parts.mjs';

const icon = set('af-security');

// Brick pattern for a w x h wall face
const bricks = (w, h, rowsN, cols, stroke) => {
  let s = '';
  const rh = h / rowsN, cw = w / cols;
  for (let r = 1; r < rowsN; r++) s += Ln([[0, r * rh], [w, r * rh]], stroke, px(1.2), { cap: 'butt' });
  for (let r = 0; r < rowsN; r++) {
    for (let q = r % 2 ? 0.5 : 1; q < cols; q++) s += Ln([[q * cw, r * rh], [q * cw, (r + 1) * rh]], stroke, px(1.2), { cap: 'butt' });
  }
  return s;
};
const wall = (c, x, y, w, d, h, rowsN) => {
  return box(x, y, 0, w, d, h, c) + faceL(x, y, 0, w, d, h, bricks(w, h, rowsN, 4, c.main.seam)) + faceR(x, y, 0, w, d, h, bricks(d, h, rowsN, 1, c.main.left));
};

icon('firewall', 'Firewall / zapora', 'Firewall', (c) => {
  let s = shadow(c, 2.2, 0, 0, 1.5);
  s += wall(c, -1.85, -0.5, 3.7, 1.0, 2.7, 5);
  const flame = [...bez([0, 0], [-1.15, 0.15], [-0.7, 1.15], [0.2, 1.9], 8), ...bez([0.2, 1.9], [0.15, 1.3], [1.2, 0.95], [0, 0], 8, true)].slice(0, -1);
  s += slabY(flame.map(([x, z]) => [x, 2.7 + z * 0.75]), -0.15, 0.3, c, { mat: 'soft', cap: c.white });
  return s;
});

icon('waf', 'WAF / zapora aplikacyjna', 'WAF / web application firewall', (c) => {
  let s = shadow(c, 2.3);
  s += wall(c, -1.85, -1.0, 3.7, 0.8, 2.5, 5);
  s += slabY(shieldShape(1.05, 2.3, 0.3, 0.05), 0.45, 0.4, c, { mat: 'soft', cap: c.white });
  const o = { stroke: c.mid, sw: px(1.8) };
  s += onL(0.3, 0.85, 1.3, Ci(0, 0, 0.58, 'none', o) + Ci(0, 0, 0.24, 'none', { ...o, ry: 0.58 }) + Ln([[-0.58, 0], [0.58, 0]], c.mid, px(1.8)));
  return s;
});

icon('lock', 'Kłódka / zabezpieczenie', 'Lock', (c) => {
  let s = shadow(c, 2.0);
  s += box(-1.3, -0.65, 0, 2.6, 1.3, 2.05, c, { r: 0.24 });
  s += slabY(thick([[-0.72, 2.05], [-0.72, 2.8], ...arc(0, 2.8, 0.72, 180, 0, 12).slice(1), [0.72, 2.05]], 0.36), -0.18, 0.36, c, { mat: 'soft' });
  s += faceL(-1.3, -0.65, 0, 2.6, 1.3, 2.05, Ci(1.3, 0.85, 0.26, c.night) + Ln([[1.3, 0.9], [1.3, 1.4]], c.night, px(3)));
  return s;
});

icon('key', 'Klucz / sekret', 'Key / secret', (c) => {
  let s = shadow(c, 2.0, 0, 0, 1.2);
  const prof = [...arc(-1.0, 1.3, 0.85, 20, 340, 18), [0.6, 1.01], [0.6, 0.4], [0.95, 0.4], [0.95, 1.01], [1.25, 1.01], [1.25, 0.2], [1.65, 0.2], [1.65, 1.01], [1.95, 1.01], [1.95, 1.59]];
  s += slabY(prof, -0.2, 0.4, c);
  s += onL(-1.0, 0.2, 1.3, Ci(-0.2, 0, 0.3, c.night));
  return s;
});

icon('shield', 'Ochrona / tarcza', 'Shield / protection', (c) => {
  let s = shadow(c, 1.9);
  s += slabY(shieldShape(1.55, 3.3), -0.28, 0.56, c);
  s += onL(0, 0.28, 3.3, check(0, 1.5, 0.7, c.white, px(4)));
  return s;
});

icon('certificate', 'Certyfikat', 'Certificate', (c) => {
  let s = shadow(c, 2.1);
  const f = R(0.2, 0.2, 3.3, 2.3, 'none', { stroke: c.pale, sw: px(1.2), rx: 0.05 }) + R(1.0, 0.5, 1.7, 0.26, c.mid, { rx: 0.08 }) + rows(0.6, 1.1, 1.5, 0.3, 3, c.pale, px(1.6))
    + Pg([[2.5, 1.6], [2.5, 2.4], [2.72, 2.2], [2.95, 2.4], [2.95, 1.6]], c.dark) + Ci(2.72, 1.45, 0.42, c.mid) + Ci(2.72, 1.45, 0.2, c.white);
  s += sheet(c, -1.85, 0, 3.7, 2.7, -0.1, f, { d: 0.2 });
  return s;
});

icon('identity', 'Tożsamość / logowanie', 'Identity / login', (c) => {
  let s = shadow(c, 2.1);
  s += slabY(rrect(-1.85, 0, 3.7, 2.5, 0.22), -0.12, 0.24, c, { cap: c.white });
  const f = R(0.3, 0.6, 1.25, 1.55, c.tint, { rx: 0.12 }) + Ci(0.92, 1.15, 0.3, c.mid) + Pa('M0.4,2.15a0.52,0.52 0 0 1 1.04,0z', c.mid)
    + R(1.85, 0.65, 1.5, 0.26, c.mid, { rx: 0.08 }) + rows(1.9, 1.3, 1.4, 0.36, 3, c.pale, px(1.8));
  s += onL(-1.85, 0.12, 2.5, f);
  return s;
});

icon('mfa', 'Uwierzytelnianie MFA / kod', 'MFA / one-time code', (c) => {
  let s = shadow(c, 2.1);
  let f = '';
  for (let i = 0; i < 3; i++) f += R(0.28 + i * 0.47, 1.0, 0.36, 0.5, c.dark, { rx: 0.08 }) + Ci(0.46 + i * 0.47, 1.25, 0.09, c.glow);
  s += phone(c, -1.6, -0.6, 1.95, 3.5, f + Ln([[0.72, 0.42], [1.22, 0.42]], c.dark, px(2)));
  s += slabY(shieldShape(0.95, 2.05, 0.75, 0.05), 0.5, 0.4, c);
  s += onL(0.75, 0.9, 2.1, check(0, 0.95, 0.42, c.white, px(3)));
  return s;
});

icon('audit-log', 'Dziennik audytu', 'Audit log', (c) => {
  let s = shadow(c, 2.0);
  let f = Ln([[0.5, 0.5], [0.5, 2.8]], c.pale, px(1.4));
  for (let i = 0; i < 5; i++) f += Ci(0.5, 0.55 + i * 0.55, 0.13, c.mid) + Ln([[0.9, 0.55 + i * 0.55], [i % 2 ? 1.7 : 2.1, 0.55 + i * 0.55]], c.pale, px(1.8));
  s += sheet(c, -1.65, 0, 2.6, 3.3, -0.45, f, { d: 0.16, fold: 0.6 });
  s += slabY(circle(0.85, 1.0, 0.92, 26), 0.35, 0.3, c);
  s += onL(0.85, 0.65, 1.0, Ci(0, 0, 0.68, c.white) + Ln([[0, -0.42], [0, 0], [0.3, 0.18]], c.dark, px(2.2)));
  return s;
});

icon('vault', 'Sejf / skarbiec', 'Vault / safe', (c) => {
  let s = shadow(c, 2.3);
  s += box(-1.25, -1.1, 0, 0.5, 2.2, 0.2, c, { mat: 'deep' }) + box(0.75, -1.1, 0, 0.5, 2.2, 0.2, c, { mat: 'deep' });
  s += box(-1.5, -1.3, 0.2, 3.0, 2.6, 2.9, c, { r: 0.16 });
  let f = R(0.3, 0.3, 2.4, 2.3, c.main.right, { rx: 0.14, stroke: c.line, sw: px(1) }) + Ci(1.5, 1.45, 0.62, 'none', { stroke: c.white, sw: px(2.6) });
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    f += Ln([[1.5 - Math.cos(a) * 0.62, 1.45 - Math.sin(a) * 0.62], [1.5 + Math.cos(a) * 0.62, 1.45 + Math.sin(a) * 0.62]], c.white, px(1.8));
  }
  f += Ci(1.5, 1.45, 0.2, c.white) + Ln([[0.5, 0.8], [0.5, 1.15]], c.night, px(2.6)) + Ln([[0.5, 1.75], [0.5, 2.1]], c.night, px(2.6));
  s += faceL(-1.5, -1.3, 0.2, 3.0, 2.6, 2.9, f);
  return s;
});

icon('bug', 'Zagrożenie / wirus', 'Threat / malware', (c) => {
  let s = shadow(c, 2.0);
  let legs = '';
  [-1, 1].forEach((sx) => {
    [-0.15, 0.3, 0.75].forEach((y, i) => {
      legs += Ln([[sx * 1.2, y], [sx * 1.85, y - 0.2 + i * 0.1], [sx * 2.15, y + 0.2 + i * 0.25]], c.line, px(2.4));
    });
  });
  s += onB(0, 0, 0.2, legs + Ln([[-0.3, 1.5], [-0.6, 1.95]], c.line, px(2)) + Ln([[0.3, 1.5], [0.6, 1.95]], c.line, px(2)));
  s += dome(0, 0, 0.15, 1.3, c, { k: 0.8 });
  s += onB(0, 0, 0.15, Ln([[0, -1.25], [0, 0.85]], c.line, px(1.4)) + Ci(-0.7, -0.45, 0.2, c.night) + Ci(0.7, -0.45, 0.2, c.night) + Ci(-0.55, 0.25, 0.16, c.night) + Ci(0.55, 0.25, 0.16, c.night));
  s += sphere(0.75, 0.75, 0.5, 0.52, c, { mat: 'deep' });
  return s;
});

icon('fingerprint', 'Biometria / odcisk palca', 'Biometrics / fingerprint', (c) => {
  let s = shadow(c, 2.1);
  s += box(-1.5, -1.5, 0, 3.0, 3.0, 0.55, c, { r: 0.35, steps: 3 });
  let f = Ci(0, 0, 1.3, c.night);
  [0.2, 0.47, 0.74, 1.0].forEach((r) => {
    f += Pa(`M${-r},${0.5}V0.05A${r},${r * 1.05} 0 0 1 ${r},0.05V${0.5 - (r > 0.9 ? 0.35 : 0)}`, 'none', { stroke: r > 0.7 ? c.pale : c.glow, sw: px(1.9) });
  });
  s += onG(0, 0, 0.55, f);
  return s;
});

icon('policy', 'Polityka / regulamin', 'Policy / rules', (c) => {
  let s = shadow(c, 2.0);
  s += sheet(c, -1.6, 0, 2.7, 3.35, -0.45, R(0.35, 0.4, 1.2, 0.26, c.mid, { rx: 0.08 }) + rows(0.35, 1.0, 2.0, 0.34, 6, c.pale, px(1.8)), { d: 0.16, fold: 0.6 });
  s += slabY(shieldShape(0.95, 2.05, 0.8, 0.05), 0.4, 0.4, c);
  s += onL(0.8, 0.8, 2.1, check(0, 0.95, 0.42, c.white, px(3)));
  return s;
});

icon('encryption', 'Szyfrowanie', 'Encryption', (c) => {
  let s = shadow(c, 2.1);
  s += box(-1.3, -1.3, 0, 2.6, 2.6, 2.6, c, { mat: 'deep', r: 0.18 });
  s += faceL(-1.3, -1.3, 0, 2.6, 2.6, 2.6, padlock(1.3, 1.35, 0.6, c.mid, c.white, c.white));
  let bits = '';
  for (let r = 0; r < 5; r++) for (let q = 0; q < 4; q++) bits += (r * 3 + q * 5) % 4 === 0 ? Ln([[0.5 + q * 0.5, 0.5 + r * 0.4], [0.5 + q * 0.5, 0.72 + r * 0.4]], c.mid, px(1.6)) : Ci(0.5 + q * 0.5, 0.61 + r * 0.4, 0.1, 'none', { stroke: c.mid, sw: px(1.3) });
  s += faceR(-1.3, -1.3, 0, 2.6, 2.6, 2.6, bits);
  return s;
});

icon('alert', 'Alarm / incydent', 'Alert / incident', (c) => {
  let s = shadow(c, 2.0);
  const tri = [...arc(-1.5, 0.3, 0.25, 150, 270, 3), ...arc(1.5, 0.3, 0.25, 270, 390, 3), ...arc(0, 2.95, 0.25, 30, 150, 3)];
  s += slabY(tri, -0.28, 0.56, c);
  s += onL(0, 0.28, 3.2, Ln([[0, 1.25], [0, 2.1]], c.white, px(5)) + Ci(0, 2.62, 0.2, c.white));
  return s;
});
