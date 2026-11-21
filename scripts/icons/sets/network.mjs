// Network

import {
  set, shadow, box, prism, slabY, slabX, cyl, frustum, sphere, dome, loft, rrect, circle, arc, bez, outline, thick,
  faceL, faceR, faceT, onL, onR, onT, onG, onB, reserve, wire, dotAt, P,
  px, R, Ci, Ln, Pg, Pa, rows
} from '../iso.mjs';
import { ledRow, arrow, padlock, waves } from '../parts.mjs';

const icon = set('af-network');

const antenna = (c, x, y, z, h) => {
  return cyl(x, y, z, 0.075, h, c, { mat: 'deep' }) + dotAt([x, y, z + h], 2.3, c.main.top, c.line);
};
// Cloud silhouette (x, z), standing on z = 0
const cloudShape = (k = 1) => {
  const inside = (x, z) => {
    if (z < 0) return false;
    const circ = (cx, cz, r) => Math.hypot(x - cx, z - cz) < r;
    return circ(-1.0, 0.8, 0.8) || circ(0.0, 1.4, 1.12) || circ(1.05, 0.88, 0.88) || (x > -1.0 && x < 1.05 && z < 0.9);
  };
  return outline(inside, 0, 0.85, 56).map(([x, z]) => [x * k, z * k]);
};
export { cloudShape };

icon('router', 'Router', 'Router', (c) => {
  let s = shadow(c, 2.3);
  s += box(-1.75, -1.3, 0, 3.5, 2.6, 0.78, c, { r: 0.22 });
  s += antenna(c, -1.2, -0.95, 0.78, 1.8) + antenna(c, 1.2, -0.95, 0.78, 1.8);
  let g = Ci(0, 0, 0.16, c.white);
  [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
    g += arrow(dx * 0.28, dy * 0.28, dx * 0.95, dy * 0.95, c.white, px(2.4), 0.28);
  });
  s += onG(0, 0.2, 0.78, g);
  s += faceL(-1.75, -1.3, 0, 3.5, 2.6, 0.78, ledRow(0.5, 0.4, 4, 0.28, c.glow) + R(2.2, 0.28, 0.85, 0.24, c.night, { rx: 0.06 }));
  return s;
});

icon('switch-module', 'Przełącznik (switch)', 'Network switch', (c) => {
  let s = shadow(c, 2.3);
  s += box(-1.9, -1.15, 0, 3.8, 2.3, 0.75, c, { r: 0.1 });
  let f = '';
  for (let i = 0; i < 7; i++) f += R(0.28 + i * 0.47, 0.22, 0.34, 0.32, c.night, { rx: 0.04 });
  s += faceL(-1.9, -1.15, 0, 3.8, 2.3, 0.75, f);
  s += faceT(-1.9, -1.15, 0, 3.8, 2.3, 0.75, arrow(0.7, 0.75, 3.1, 0.75, c.white, px(2.4)) + arrow(3.1, 1.55, 0.7, 1.55, c.white, px(2.4)));
  return s;
});

icon('hub', 'Koncentrator (hub)', 'Hub', (c) => {
  let s = shadow(c, 2.2);
  s += cyl(0, 0, 0, 1.75, 0.65, c);
  let g = '';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.52;
    g += Ln([[0, 0], [Math.cos(a) * 1.15, Math.sin(a) * 1.15]], c.white, px(1.8)) + Ci(Math.cos(a) * 1.15, Math.sin(a) * 1.15, 0.17, c.white);
  }
  s += onG(0, 0, 0.65, g + Ci(0, 0, 0.34, c.white) + Ci(0, 0, 0.17, c.mid));
  return s;
});

icon('modem', 'Modem', 'Modem', (c) => {
  let s = shadow(c, 2.0);
  s += box(-1.4, -0.7, 0, 2.8, 1.4, 0.16, c, { mat: 'deep', r: 0.12 });
  s += box(-1.3, -0.5, 0.16, 2.6, 1.0, 2.5, c, { r: 0.2 });
  let w = 'M0.45,0.85';
  for (let i = 0; i < 3; i++) w += `q0.14,-0.6 0.28,0t0.28,0`;
  s += faceL(-1.3, -0.5, 0.16, 2.6, 1.0, 2.5, Pa(w, 'none', { stroke: c.white, sw: px(2.2) }) + ledRow(0.55, 1.75, 4, 0.5, c.glow, 0.09) + rows(0.45, 2.05, 1.7, 0, 1, c.main.right, px(1.6), 1));
  return s;
});

icon('wifi-ap', 'Punkt dostępowy Wi-Fi', 'Wi-Fi access point', (c) => {
  let s = shadow(c, 2.0);
  s += cyl(0, 0, 0, 1.65, 0.42, c, { mat: 'soft' });
  s += onG(0, 0, 0.42, Ci(0, 0, 1.05, 'none', { stroke: c.mid, sw: px(2.4) }) + Ci(0, 0, 0.3, c.mid));
  s += onB(0, 0, 1.25, waves(0, 0, [0.55, 1.0, 1.45], 38, 142, c.mid, px(2.6)) + Ci(0, 0, 0.17, c.mid)) + reserve(0, 0, 1.25, 0, 1.6);
  return s;
});

icon('loadbalancer', 'Load balancer', 'Load balancer', (c) => {
  let s = shadow(c, 2.3);
  s += box(-1.6, -1.6, 0, 3.2, 3.2, 0.95, c, { r: 0.3 });
  let g = Ln([[-1.45, 0], [-0.5, 0]], c.white, px(2.6)) + Ci(-0.45, 0, 0.26, c.white);
  [-0.85, 0, 0.85].forEach((y) => {
    g += arrow(-0.45, 0, 1.45, y, c.white, px(2.2), 0.3);
  });
  s += onG(0, 0, 0.95, g);
  return s;
});

icon('dns', 'DNS', 'DNS', (c) => {
  let s = shadow(c, 2.1);
  s += box(-1.3, -1.3, 0, 2.6, 2.6, 2.6, c, { r: 0.18 });
  const o = { stroke: c.white, sw: px(1.9) };
  s += faceL(-1.3, -1.3, 0, 2.6, 2.6, 2.6, Ci(1.3, 1.1, 0.75, 'none', o) + Ci(1.3, 1.1, 0.32, 'none', { ...o, ry: 0.75 }) + Ln([[0.55, 1.1], [2.05, 1.1]], c.white, px(1.9))
    + R(0.6, 2.08, 1.4, 0.2, c.white, { rx: 0.1 }));
  return s;
});

icon('api-gateway', 'Brama API', 'API gateway', (c) => {
  let s = shadow(c, 2.3);
  s += box(-1.85, -0.5, 0, 0.75, 1.0, 2.4, c);
  s += prism([[-0.24, -1.3], [0.24, -1.3], [0.24, 1.0], [0.6, 1.0], [0, 1.9], [-0.6, 1.0], [-0.24, 1.0]], 0, 0.14, c, { mat: 'soft' });
  s += box(1.1, -0.5, 0, 0.75, 1.0, 2.4, c);
  s += box(-1.95, -0.6, 2.4, 3.9, 1.2, 0.6, c, { r: 0.1 });
  s += faceL(-1.95, -0.6, 2.4, 3.9, 1.2, 0.6, ledRow(1.35, 0.3, 4, 0.4, c.white, 0.09));
  return s;
});

icon('cloud', 'Chmura', 'Cloud', (c) => {
  let s = shadow(c, 2.1);
  s += slabY(cloudShape(), -0.55, 1.1, c);
  s += onL(0, 0.55, 0, Pa('M-1.3,-0.75a0.5,0.5 0 0 1 0.42,-0.52M-0.6,-1.75a0.8,0.8 0 0 1 0.62,-0.45', 'none', { stroke: c.white, sw: px(2.2), op: 0.75 }));
  return s;
});

icon('internet', 'Internet', 'Internet', (c) => {
  let s = shadow(c, 1.7);
  s += cyl(0, 0, 0, 0.95, 0.16, c, { mat: 'deep' }) + cyl(0, 0, 0.16, 0.22, 0.4, c, { mat: 'deep' });
  s += sphere(0, 0, 1.95, 1.3, c);
  const r = 1.3 * Math.sqrt(1.5), o = { stroke: c.white, sw: px(1.3), op: 0.75 };
  s += onB(0, 0, 1.95, Ci(0, 0, r * 0.45, 'none', { ...o, ry: r }) + Pa(`M${-r},0A${r},${r * 0.35} 0 0 0 ${r},0`, 'none', o)
    + Pa(`M${-r * 0.87},${-r * 0.5}A${r},${r * 0.3} 0 0 0 ${r * 0.87},${-r * 0.5}`, 'none', o) + Pa(`M${-r * 0.87},${r * 0.5}A${r},${r * 0.3} 0 0 0 ${r * 0.87},${r * 0.5}`, 'none', o) + Ln([[0, -r], [0, r]], c.white, px(1.3), { op: 0.75 }));
  return s;
});

icon('tower', 'Maszt / nadajnik', 'Radio tower', (c) => {
  let s = shadow(c, 1.7);
  const sq = (h, z) => [[-h, -h, z], [h, -h, z], [h, h, z], [-h, h, z]];
  s += loft(sq(0.14, 3.3), sq(0.85, 0), c);
  for (let i = 0; i < 3; i++) {
    const z0 = i * 1.1, z1 = z0 + 1.1;
    const h0 = 0.85 - (0.71 * z0) / 3.3, h1 = 0.85 - (0.71 * z1) / 3.3;
    s += wire([[-h0, h0, z0], [h1, h1, z1], [h1, -h1, z1]], c.main.seam, 0.9) + wire([[h0, h0, z0], [-h1, h1, z1]], c.main.seam, 0.9) + wire([[h0, -h0, z0], [h1, h1, z1]], c.main.seam, 0.9);
  }
  s += antenna(c, 0, 0, 3.3, 0.55);
  s += onB(0, 0, 3.85, waves(0, 0, [0.45, 0.8], -40, 40, c.mid, px(2)) + waves(0, 0, [0.45, 0.8], 140, 220, c.mid, px(2))) + reserve(0, 0, 3.85, 0, 0.6);
  return s;
});

icon('antenna-5g', 'Antena 5G / stacja bazowa', '5G antenna / base station', (c) => {
  let s = shadow(c, 1.5);
  s += box(-0.6, -0.6, 0, 1.2, 1.2, 0.3, c, { mat: 'deep', r: 0.1 });
  s += cyl(0, 0, 0.3, 0.13, 3.5, c, { mat: 'soft' });
  s += slabX(rrect(-0.32, 2.0, 0.64, 1.6, 0.1), 0.18, 0.2, c);
  s += slabY(rrect(-0.32, 2.0, 0.64, 1.6, 0.1), 0.18, 0.2, c);
  s += onL(-0.32, 0.38, 3.6, rows(0.18, 0.4, 0.28, 0.3, 4, c.white, px(1.6), 1));
  s += onB(0, 0.38, 2.8, waves(-0.45, 0, [0.4, 0.75, 1.1], 150, 215, c.mid, px(2)));
  return s;
});

icon('vpn', 'VPN / tunel', 'VPN / tunnel', (c) => {
  let s = shadow(c, 2.2, 0, 0, 1.6);
  s += slabY(circle(0, 1.15, 1.15, 28), -1.75, 3.5, c);
  s += onL(0, 1.75, 1.15, Ci(0, 0, 0.86, c.night) + padlock(0, 0.08, 0.36, c.white, c.white, c.night));
  return s;
});

icon('satellite', 'Satelita', 'Satellite', (c) => {
  let s = shadow(c, 1.6);
  const panel = (x) => box(x, -0.45, 2.1, 1.4, 0.9, 0.08, c, { mat: 'deep' })
    + faceT(x, -0.45, 2.1, 1.4, 0.9, 0.08, Ln([[0.47, 0], [0.47, 0.9]], c.pale, px(1)) + Ln([[0.93, 0], [0.93, 0.9]], c.pale, px(1)) + Ln([[0, 0.45], [1.4, 0.45]], c.pale, px(1)));
  s += panel(-2.0);
  s += box(-0.6, -0.6, 1.5, 1.2, 1.2, 1.3, c, { r: 0.12 });
  s += panel(0.6);
  s += slabY(circle(0, 2.15, 0.42, 18), 0.6, 0.14, c, { mat: 'soft' });
  s += wire([[0, 0.74, 2.15], [0, 1.15, 2.15]], c.line, 1.4) + dotAt([0, 1.15, 2.15], 1.8, c.main.top, c.line);
  return s;
});

icon('cdn', 'CDN / sieć dostarczania treści', 'CDN / edge network', (c) => {
  let s = shadow(c, 2.5);
  const node = (x, y) => box(x - 0.45, y - 0.45, 0, 0.9, 0.9, 0.8, c, { mat: 'soft', r: 0.1 });
  const spots = [[1.45, -1.45], [-1.45, 1.45], [1.3, 1.3]];
  spots.forEach(([x, y]) => {
    s += wire([[0, 0, 0.05], [x, y, 0.05]], c.mid, 2.2);
  });
  s += node(...spots[0]) + node(...spots[1]);
  s += cyl(0, 0, 0, 1.05, 1.6, c);
  const o = { stroke: c.white, sw: px(1.6) };
  s += onG(0, 0, 1.6, Ci(0, 0, 0.7, 'none', o) + Ci(0, 0, 0.3, 'none', { ...o, ry: 0.7 }) + Ln([[-0.7, 0], [0.7, 0]], c.white, px(1.6)));
  s += node(...spots[2]);
  return s;
});

icon('proxy', 'Serwer proxy', 'Proxy server', (c) => {
  let s = shadow(c, 2.1);
  s += box(-1.7, -0.55, 0, 3.4, 1.1, 2.7, c, { r: 0.16 });
  s += faceL(-1.7, -0.55, 0, 3.4, 1.1, 2.7, arrow(0.7, 1.0, 2.7, 1.0, c.white, px(2.8), 0.38) + arrow(2.7, 1.75, 0.7, 1.75, c.white, px(2.8), 0.38));
  return s;
});

icon('nat', 'NAT / translacja adresów', 'NAT / address translation', (c) => {
  let s = shadow(c, 2.2);
  s += box(-1.7, -1.1, 0, 3.4, 2.2, 1.7, c, { r: 0.16 });
  s += faceL(-1.7, -1.1, 0, 3.4, 2.2, 1.7, R(0.42, 0.52, 0.66, 0.66, 'none', { rx: 0.1, stroke: c.white, sw: px(2) }) + arrow(1.3, 0.85, 2.1, 0.85, c.white, px(2.2), 0.26) + R(2.3, 0.52, 0.66, 0.66, c.white, { rx: 0.1 }));
  s += faceT(-1.7, -1.1, 0, 3.4, 2.2, 1.7, rows(0.5, 0.6, 2.4, 0.5, 3, c.main.left, px(1.4), 1));
  return s;
});

icon('vlan', 'VLAN / segment sieci', 'VLAN / network segment', (c) => {
  let s = shadow(c, 2.5);
  s += box(-1.95, -1.95, 0, 3.9, 3.9, 0.16, c, { mat: 'soft', r: 0.15 });
  const mats = ['deep', 'main', { top: c.white, left: c.tint, right: c.pale, seam: c.white }];
  mats.forEach((mat, i) => {
    const y = -1.7 + i * 1.18;
    s += box(-1.7, y, 0.16, 3.4, 1.02, 0.34, c, { mat, r: 0.1 });
    s += faceT(-1.7, y, 0.16, 3.4, 1.02, 0.34, ledRow(0.6, 0.51, 3, 1.1, i === 2 ? c.mid : c.white, 0.17));
  });
  return s;
});

icon('fiber-link', 'Łącze światłowodowe', 'Fiber link', (c) => {
  let s = shadow(c, 2.4, 0, 0, 1.6);
  const plug = (x) => box(x, -0.65, 0, 1.2, 1.3, 0.7, c, { r: 0.12 });
  s += plug(-1.95);
  const cable = bez([-0.75, 0], [0.1, -1.5], [-0.1, 1.5], [0.75, 0], 14).map(([x, y]) => [x, y, 0.35]);
  s += wire(cable, c.line, 6.2) + wire(cable, c.mid, 4) + wire(cable, c.glow, 1.2);
  s += plug(0.75);
  s += faceL(0.75, -0.65, 0, 1.2, 1.3, 0.7, ledRow(0.35, 0.35, 2, 0.5, c.glow, 0.09));
  return s;
});
