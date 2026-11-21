// Servers & computers

import {
  set, shadow, box, prism, slabY, slabX, cyl, frustum, sphere, extrude, rrect, circle, ngon,
  faceL, faceR, faceT, onL, onR, onT, onG, onPlane, onB, reserve, wire, dotAt,
  px, R, Ci, Ln, Pg, Pa, rows
} from '../iso.mjs';
import { display, sheen, ledRow, windowUi, rackUnit, waves, gear } from '../parts.mjs';

const icon = set('af-compute');

icon('server', 'Serwer', 'Server', (c) => {
  let s = shadow(c, 2.25);
  for (let i = 0; i < 3; i++) {
    if (i) s += box(-1.22, -1.22, i * 0.94 - 0.14, 2.44, 2.44, 0.14, c, { mat: 'deep' });
    s += rackUnit(-1.4, -1.4, i * 0.94, 2.8, 2.8, 0.8, c, { r: 0.14 });
  }
  return s;
});

icon('server-rack', 'Szafa serwerowa', 'Server rack', (c) => {
  let s = shadow(c, 2.2);
  s += box(-1.35, -1.35, 0, 2.7, 2.7, 4.3, c, { mat: 'deep' });
  let f = '';
  for (let i = 0; i < 6; i++) {
    const v = 0.3 + i * 0.63;
    f += R(0.25, v, 2.2, 0.48, i === 4 ? c.pale : c.mid, { rx: 0.06 }) + ledRow(0.48, v + 0.24, 2, 0.2, c.glow, 0.065)
      + Ln([[1.5, v + 0.24], [2.2, v + 0.24]], c.night, px(1.3), { op: 0.55 });
  }
  s += faceL(-1.35, -1.35, 0, 2.7, 2.7, 4.3, f);
  s += faceR(-1.35, -1.35, 0, 2.7, 2.7, 4.3, rows(0.5, 0.6, 1.7, 0.22, 5, c.deep.seam, px(1.2), 1));
  return s;
});

icon('mainframe', 'Mainframe', 'Mainframe', (c) => {
  let s = shadow(c, 2.3);
  s += box(-1.8, -1.1, 0, 3.6, 2.2, 3.3, c, { r: 0.12 });
  let f = R(0.25, 0.25, 3.1, 0.85, c.night, { rx: 0.08 });
  for (let i = 0; i < 2; i++) f += ledRow(0.5, 0.52 + i * 0.3, 9, 0.3, i ? c.pale : c.glow, 0.07);
  f += R(0.25, 1.35, 1.48, 1.7, c.main.right, { rx: 0.08 }) + R(1.87, 1.35, 1.48, 1.7, c.main.right, { rx: 0.08 });
  f += rows(0.5, 1.7, 0.98, 0.25, 4, c.main.left, px(1.4), 1) + rows(2.12, 1.7, 0.98, 0.25, 4, c.main.left, px(1.4), 1);
  s += faceL(-1.8, -1.1, 0, 3.6, 2.2, 3.3, f);
  return s;
});

// Monitor on a stand; `x0` = left edge, `w` x `h` panel, standing at depth y
const monitor = (c, x0, y, w, h, lift, content = '') => {
  const mid = x0 + w / 2;
  let s = cyl(mid, y, 0, 0.62, 0.1, c, { mat: 'soft' });
  s += box(mid - 0.16, y - 0.12, 0.1, 0.32, 0.2, lift, c, { mat: 'soft' });
  s += slabY(rrect(x0, lift, w, h, 0.14), y, 0.2, c);
  s += onL(x0, y + 0.2, lift + h, display(0.13, 0.13, w - 0.26, h - 0.42, c, content));
  return s;
};
const keyboard = (c, x, y, w = 2.4) => {
  return box(x, y, 0, w, 0.85, 0.11, c, { mat: 'soft', r: 0.08 })
    + faceT(x, y, 0, w, 0.85, 0.11, rows(0.2, 0.2, w - 0.4, 0.22, 3, c.pale, px(1.5), 1));
};

icon('desktop', 'Komputer', 'Desktop computer', (c) => {
  let s = shadow(c, 2.2);
  const ui = R(0.4, 0.4, 1.3, 0.2, c.pale, { rx: 0.05 }) + rows(0.45, 0.9, 2.3, 0.28, 3, c.mid, px(1.5));
  s += monitor(c, -1.75, -0.55, 3.5, 2.4, 0.85, ui);
  s += keyboard(c, -1.2, 0.75);
  return s;
});

icon('workstation', 'Stacja robocza', 'Workstation', (c) => {
  let s = shadow(c, 2.25);
  s += monitor(c, -1.95, -0.4, 2.5, 1.9, 0.75, Ln([[0.4, 1.2], [0.9, 0.75], [1.35, 1.0], [2.0, 0.5]], c.pale, px(1.8)));
  s += keyboard(c, -1.8, 0.7, 1.9);
  s += box(0.85, -1.15, 0, 1.05, 2.3, 2.7, c, { r: 0.1 });
  s += faceL(0.85, -1.15, 0, 1.05, 2.3, 2.7, Ci(0.52, 0.42, 0.14, c.glow) + R(0.2, 0.8, 0.65, 0.14, c.night, { rx: 0.05 }) + R(0.2, 1.1, 0.65, 0.14, c.night, { rx: 0.05 }) + rows(0.25, 1.9, 0.55, 0.2, 3, c.main.right, px(1.4), 1));
  s += faceR(0.85, -1.15, 0, 1.05, 2.3, 2.7, rows(0.4, 0.5, 1.5, 0.24, 4, c.line, px(1.2), 1).replace(/stroke-linecap/g, 'opacity="0.3" stroke-linecap'));
  return s;
});

icon('laptop', 'Laptop', 'Laptop', (c) => {
  let s = shadow(c, 2.2);
  // screen leaning back from the hinge
  const y0 = -0.98, z0 = 0.16, y1 = -1.5, z1 = 2.25;
  const len = Math.hypot(y1 - y0, z1 - z0);
  const v = [0, (y0 - y1) / len, (z0 - z1) / len];
  const nrm = [0, (z1 - z0) / len, (y0 - y1) / len];
  const F = [[-1.6, y0, z0], [1.6, y0, z0], [1.6, y1, z1], [-1.6, y1, z1]];
  s += extrude(F, [0, -nrm[1] * 0.1, -nrm[2] * 0.1], c);
  s += onPlane([-1.6, y1, z1], [1, 0, 0], v, display(0.12, 0.12, 2.96, len - 0.26, c, rows(0.45, 0.55, 1.5, 0.3, 3, c.pale, px(1.6))));
  s += box(-1.6, -1.0, 0, 3.2, 2.25, 0.16, c, { mat: 'soft', r: 0.1 });
  s += faceT(-1.6, -1.0, 0, 3.2, 2.25, 0.16, R(0.25, 0.22, 2.7, 1.05, c.pale, { rx: 0.06 }) + rows(0.4, 0.48, 2.4, 0.27, 3, c.soft.top, px(1.3), 1) + R(1.1, 1.5, 1.0, 0.55, c.tint, { rx: 0.06 }));
  return s;
});

icon('mobiledevice', 'Telefon / smartfon', 'Mobile phone', (c) => {
  let s = shadow(c, 1.3);
  s += slabY(rrect(-0.95, 0, 1.9, 3.5, 0.28), -0.12, 0.24, c);
  let f = '';
  for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) f += R(0.3 + q * 0.47, 0.75 + r * 0.5, 0.33, 0.33, (r + q) % 2 ? c.pale : c.mid, { rx: 0.08 });
  f += Ln([[0.7, 3.12], [1.2, 3.12]], c.pale, px(1.6)) + Ln([[0.75, 0.4], [1.15, 0.4]], c.dark, px(2));
  s += onL(-0.95, 0.12, 3.5, display(0.13, 0.13, 1.64, 3.24, c, f, 0.2));
  return s;
});

icon('tablet', 'Tablet', 'Tablet', (c) => {
  let s = shadow(c, 1.9);
  s += slabY(rrect(-1.6, 0, 3.2, 2.5, 0.22), -0.11, 0.22, c);
  const f = R(0.4, 0.4, 2.4, 0.5, c.mid, { rx: 0.08 }) + R(0.4, 1.1, 1.1, 0.95, c.pale, { rx: 0.08 }) + rows(1.75, 1.25, 1.0, 0.3, 3, c.pale, px(1.6));
  s += onL(-1.6, 0.11, 2.5, display(0.14, 0.14, 2.92, 2.22, c, f, 0.12));
  return s;
});

icon('web-app', 'Aplikacja webowa', 'Web application', (c) => {
  let s = shadow(c, 2.1);
  s += slabY(rrect(-1.85, 0, 3.7, 2.9, 0.14), -0.1, 0.2, c, { mat: 'soft' });
  const f = windowUi(0.12, 0.12, 3.46, 2.66, c)
    + R(0.4, 0.75, 1.2, 0.8, c.tint, { rx: 0.06 }) + rows(1.9, 0.9, 1.4, 0.27, 3, c.pale, px(1.6))
    + R(0.4, 1.8, 2.9, 0.22, c.tint, { rx: 0.06 }) + R(0.4, 2.2, 1.0, 0.3, c.mid, { rx: 0.1 });
  s += onL(-1.85, 0.1, 2.9, f);
  return s;
});

icon('terminal', 'Terminal / konsola', 'Terminal / console', (c) => {
  let s = shadow(c, 2.1);
  s += slabY(rrect(-1.85, 0, 3.7, 2.9, 0.14), -0.1, 0.2, c);
  const f = Ln([[0.55, 0.8], [1.15, 1.25], [0.55, 1.7]], c.glow, px(2.6)) + Ln([[1.5, 1.75], [2.4, 1.75]], c.pale, px(2.6));
  s += onL(-1.85, 0.1, 2.9, display(0.14, 0.14, 3.42, 2.62, c, f, 0.1));
  return s;
});

icon('vm', 'Maszyna wirtualna', 'Virtual machine', (c) => {
  let s = shadow(c, 2.3);
  s += box(-1.6, -1.6, 0, 3.2, 3.2, 0.12, c, { mat: 'deep', r: 0.1 });
  for (let i = 0; i < 2; i++) s += rackUnit(-0.95, -0.95, 0.12 + i * 0.85, 1.9, 1.9, 0.72, c, { r: 0.1 });
  s += box(-1.55, -1.55, 0.12, 3.1, 3.1, 2.75, c, { mat: 'soft', op: 0.42, r: 0.1 });
  return s;
});

icon('container', 'Kontener', 'Container', (c) => {
  let s = shadow(c, 2.3);
  s += box(-1.9, -1.05, 0, 3.8, 2.1, 2.0, c);
  let l = '', r = '';
  for (let i = 0; i < 9; i++) l += R(0.22 + i * 0.39, 0.2, 0.2, 1.6, c.main.right, { rx: 0.04, op: 0.55 });
  r += R(0.15, 0.15, 0.85, 1.7, 'none', { stroke: c.line, sw: px(1), op: 0.5 }) + R(1.1, 0.15, 0.85, 1.7, 'none', { stroke: c.line, sw: px(1), op: 0.5 });
  r += Ln([[0.85, 0.5], [0.85, 1.5]], c.pale, px(1.6)) + Ln([[1.25, 0.5], [1.25, 1.5]], c.pale, px(1.6));
  s += faceL(-1.9, -1.05, 0, 3.8, 2.1, 2.0, l) + faceR(-1.9, -1.05, 0, 3.8, 2.1, 2.0, r);
  return s;
});

icon('cluster', 'Klaster / Kubernetes', 'Cluster / Kubernetes', (c) => {
  let s = shadow(c, 2.4);
  const cube = (x, y, z, mat) => box(x, y, z, 1.45, 1.45, 1.2, c, { r: 0.12, mat }) + faceL(x, y, z, 1.45, 1.45, 1.2, ledRow(0.3, 0.3, 2, 0.2, mat ? c.mid : c.glow, 0.07));
  s += cube(-1.7, -1.7, 0) + cube(0.25, -1.7, 0) + cube(-1.7, 0.25, 0) + cube(0.25, 0.25, 0);
  s += cube(-0.72, -0.72, 1.2, 'soft');
  return s;
});

icon('microservice', 'Mikroserwis', 'Microservice', (c) => {
  let s = shadow(c, 2.2);
  s += prism(ngon(0, 0, 1.85, 6, 15), 0, 1.5, c);
  s += onG(0, 0, 1.5, Pg(gear(0, 0, 0.95, 8), c.white) + Ci(0, 0, 0.36, c.main.top));
  return s;
});

icon('function-module', 'Funkcja (serverless)', 'Function (serverless)', (c) => {
  let s = shadow(c, 2.1);
  s += box(-1.3, -1.3, 0, 2.6, 2.6, 2.6, c, { r: 0.18 });
  s += faceL(-1.3, -1.3, 0, 2.6, 2.6, 2.6, Ln([[0.8, 0.6], [1.05, 0.6], [1.85, 2.05]], c.white, px(3.6)) + Ln([[1.32, 1.1], [0.75, 2.05]], c.white, px(3.6)));
  return s;
});

icon('cronjob', 'Zadanie cykliczne', 'Scheduled job', (c) => {
  let s = shadow(c, 2.1);
  s += box(-1.3, -1.3, 0, 2.6, 2.6, 2.6, c, { r: 0.18 });
  s += faceL(-1.3, -1.3, 0, 2.6, 2.6, 2.6, Ci(1.3, 1.3, 0.9, c.white, { stroke: c.line, sw: px(1) }) + Ln([[1.3, 0.72], [1.3, 1.3], [1.72, 1.55]], c.dark, px(2.4)) + Ci(1.3, 1.3, 0.09, c.dark));
  return s;
});

icon('gpu-server', 'Serwer GPU', 'GPU server', (c) => {
  let s = shadow(c, 2.3);
  s += box(-1.85, -1.15, 0, 3.7, 2.3, 1.7, c, { r: 0.12 });
  const fan = (x) => Ci(x, 0.85, 0.6, c.night) + Ci(x, 0.85, 0.47, 'none', { stroke: c.pale, sw: px(1.2) })
    + Ln([[x - 0.4, 0.85], [x + 0.4, 0.85]], c.pale, px(1.6)) + Ln([[x, 0.45], [x, 1.25]], c.pale, px(1.6)) + Ci(x, 0.85, 0.14, c.glow);
  s += faceL(-1.85, -1.15, 0, 3.7, 2.3, 1.7, fan(0.95) + fan(2.4) + ledRow(3.25, 0.4, 1, 0, c.glow, 0.08));
  s += faceT(-1.85, -1.15, 0, 3.7, 2.3, 1.7, rows(0.5, 0.5, 2.7, 0.3, 5, c.main.left, px(1.4), 1));
  return s;
});

icon('cpu', 'Procesor / układ', 'CPU / chip', (c) => {
  let s = shadow(c, 2.2);
  const pins = (x, y, w, d) => box(x, y, 0.1, w, d, 0.12, c, { mat: 'soft' });
  for (let i = 0; i < 4; i++) {
    const t = -1.0 + i * 0.58;
    s += pins(-1.75, t, 3.5, 0.26) + pins(t, -1.75, 0.26, 3.5);
  }
  s += box(-1.4, -1.4, 0.06, 2.8, 2.8, 0.42, c, { mat: 'deep', r: 0.12 });
  s += faceT(-1.4, -1.4, 0.06, 2.8, 2.8, 0.42, R(0.55, 0.55, 1.7, 1.7, c.mid, { rx: 0.12 }) + R(0.95, 0.95, 0.9, 0.9, 'none', { rx: 0.08, stroke: c.glow, sw: px(1.4) }));
  return s;
});

icon('printer', 'Drukarka', 'Printer', (c) => {
  let s = shadow(c, 2.3);
  s += slabY(rrect(-0.95, 1.2, 1.9, 1.3, 0.05), -0.75, 0.06, c, { mat: 'paper' });
  s += onL(-0.95, -0.69, 2.5, rows(0.3, 0.35, 1.3, 0.25, 3, c.pale, px(1.4)));
  s += box(-1.65, -1.15, 0, 3.3, 2.3, 1.35, c, { r: 0.16 });
  s += faceT(-1.65, -1.15, 0, 3.3, 2.3, 1.35, R(0.5, 0.25, 2.3, 0.4, c.night, { rx: 0.08 }) + ledRow(2.75, 1.75, 2, -0.25, c.glow, 0.08));
  s += faceL(-1.65, -1.15, 0, 3.3, 2.3, 1.35, R(0.45, 0.62, 2.4, 0.2, c.night, { rx: 0.08 }));
  s += box(-1.05, 1.1, 0.42, 2.1, 0.8, 0.05, c, { mat: 'paper' });
  s += faceT(-1.05, 1.1, 0.42, 2.1, 0.8, 0.05, rows(0.3, 0.28, 1.5, 0.22, 2, c.pale, px(1.3)));
  return s;
});

icon('iot-device', 'Urządzenie IoT / czujnik', 'IoT device / sensor', (c) => {
  let s = shadow(c, 1.8);
  s += box(-1.15, -1.15, 0, 2.3, 2.3, 0.85, c, { r: 0.35 });
  s += onG(0, 0, 0.85, Ci(0, 0, 0.62, c.night) + Ci(0, 0, 0.36, c.pale) + Ci(0, 0, 0.16, c.white));
  s += wire([[0.75, -0.75, 0.85], [0.75, -0.75, 2.3]], c.line, 2);
  s += dotAt([0.75, -0.75, 2.3], 2.6, c.main.top, c.line);
  s += onB(0.75, -0.75, 2.3, waves(0, 0, [0.42, 0.72], 25, 155, c.mid)) + reserve(0.75, -0.75, 2.3, 0, 0.8);
  return s;
});

icon('edge-device', 'Urządzenie brzegowe', 'Edge device', (c) => {
  let s = shadow(c, 2.2);
  s += box(-1.6, -1.2, 0, 3.2, 2.4, 0.95, c, { r: 0.12 });
  for (let i = 0; i < 6; i++) s += box(-1.3 + i * 0.47, -0.95, 0.95, 0.2, 1.9, 0.35, c, { mat: 'deep' });
  let f = '';
  for (let i = 0; i < 3; i++) f += R(0.3 + i * 0.5, 0.3, 0.36, 0.36, c.night, { rx: 0.05 });
  s += faceL(-1.6, -1.2, 0, 3.2, 2.4, 0.95, f + ledRow(2.3, 0.48, 3, 0.24, c.glow, 0.07));
  return s;
});

icon('kiosk', 'Kiosk / infomat', 'Kiosk', (c) => {
  let s = shadow(c, 1.8);
  s += box(-1.15, -0.8, 0, 2.3, 1.7, 0.18, c, { mat: 'deep', r: 0.1 });
  const prof = [[-0.6, 0.18], [0.55, 0.18], [0.55, 1.75], [0.85, 1.95], [-0.2, 3.6], [-0.6, 3.6]];
  s += slabX(prof, -1.0, 2.0, c);
  const len = Math.hypot(1.05, 1.65);
  s += onPlane([-1.0, -0.2, 3.6], [1, 0, 0], [0, 1.05 / len, -1.65 / len], display(0.15, 0.15, 1.7, len - 0.3, c, R(0.4, 0.4, 1.2, 0.45, c.mid, { rx: 0.06 }) + R(0.4, 1.0, 0.55, 0.45, c.pale, { rx: 0.06 }) + R(1.05, 1.0, 0.55, 0.45, c.pale, { rx: 0.06 })));
  s += onL(-1.0, 0.55, 1.75, R(0.55, 0.45, 0.9, 0.16, c.night, { rx: 0.06 }));
  return s;
});

icon('smartwatch', 'Smartwatch', 'Smartwatch', (c) => {
  let s = shadow(c, 1.9);
  s += box(-0.8, -2.0, 0, 1.6, 4.0, 0.14, c, { mat: 'deep', r: 0.2 });
  s += box(-1.15, -1.15, 0, 2.3, 2.3, 0.5, c, { r: 0.5 });
  s += faceT(-1.15, -1.15, 0, 2.3, 2.3, 0.5, R(0.25, 0.25, 1.8, 1.8, c.night, { rx: 0.36 }) + Ci(1.15, 1.15, 0.55, 'none', { stroke: c.pale, sw: px(1.6) }) + Ln([[1.15, 0.8], [1.15, 1.15], [1.42, 1.15]], c.glow, px(1.8)));
  return s;
});

icon('camera', 'Kamera', 'Camera', (c) => {
  let s = shadow(c, 1.7);
  s += cyl(0, -0.2, 0, 0.8, 0.14, c, { mat: 'deep' });
  s += cyl(0, -0.2, 0.14, 0.2, 1.1, c, { mat: 'deep' });
  s += box(-1.0, -1.5, 1.2, 2.0, 2.4, 1.5, c, { r: 0.2 });
  s += slabY(circle(0, 1.95, 0.72, 24), 0.9, 0.45, c, { mat: 'deep' });
  s += onL(0, 1.35, 1.95, Ci(0, 0, 0.5, c.night) + Ci(0, 0, 0.3, c.mid) + Ci(-0.12, -0.12, 0.1, c.glow));
  s += faceR(-1.0, -1.5, 1.2, 2.0, 2.4, 1.5, ledRow(1.9, 0.4, 1, 0, c.glow, 0.09));
  return s;
});
