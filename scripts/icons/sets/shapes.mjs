// Shapes

import {
  set, shadow, box, prism, slabY, cyl, frustum, sphere, torus, loft, rrect, ngon, arc,
  onL, px, R, Ci, Ln, Pg, rows
} from '../iso.mjs';

const icon = set('af-shapes');

icon('block', 'Blok', 'Block', (c) => {
  return shadow(c, 2.5) + box(-1.9, -1.9, 0, 3.8, 3.8, 0.9, c);
});
icon('cube', 'Sześcian', 'Cube', (c) => {
  return shadow(c, 2.2) + box(-1.4, -1.4, 0, 2.8, 2.8, 2.8, c);
});
icon('plate', 'Płyta / podest', 'Plate / platform', (c) => {
  return shadow(c, 2.5) + box(-1.95, -1.95, 0, 3.9, 3.9, 0.28, c, { mat: 'soft', r: 0.25, steps: 3 });
});
icon('sphere', 'Kula', 'Sphere', (c) => {
  return shadow(c, 1.7) + sphere(0, 0, 1.5 * Math.sqrt(1.5), 1.5, c);
});
icon('cylinder', 'Walec', 'Cylinder', (c) => {
  return shadow(c, 2.0) + cyl(0, 0, 0, 1.45, 2.7, c);
});
icon('cone', 'Stożek', 'Cone', (c) => {
  return shadow(c, 2.0) + frustum(0, 0, 0, 1.5, 0, 3.1, c);
});
icon('pyramid', 'Piramida', 'Pyramid', (c) => {
  const sq = (h, z) => [[-h, -h, z], [h, -h, z], [h, h, z], [-h, h, z]];
  return shadow(c, 2.3) + loft(sq(0.001, 3.0), sq(1.7, 0), c, { noCap: true });
});
icon('hexagon', 'Graniastosłup sześciokątny', 'Hexagonal prism', (c) => {
  return shadow(c, 2.2) + prism(ngon(0, 0, 1.85, 6, 15), 0, 1.3, c);
});
icon('triangle-prism', 'Graniastosłup trójkątny', 'Triangular prism', (c) => {
  return shadow(c, 2.3) + slabY([[-1.7, 0], [1.7, 0], [0, 2.6]], -1.3, 2.6, c);
});
icon('torus', 'Pierścień / torus', 'Ring / torus', (c) => {
  return shadow(c, 2.2) + torus(0, 0, 0, 1.25, 0.48, c);
});
icon('arrow', 'Strzałka', 'Arrow', (c) => {
  return shadow(c, 2.3, 0, 0, 1.6) + prism([[-1.9, -0.55], [0.45, -0.55], [0.45, -1.3], [1.95, 0], [0.45, 1.3], [0.45, 0.55], [-1.9, 0.55]], 0, 0.6, c);
});
icon('star', 'Gwiazda', 'Star', (c) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 4, r = i % 2 ? 0.85 : 1.95;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return shadow(c, 2.2) + prism(pts, 0, 0.6, c);
});
icon('text-label', 'Etykieta / tekst', 'Label / text', (c) => {
  let s = shadow(c, 2.1, 0, 0, 1.3);
  s += slabY(rrect(-1.85, 0.0, 3.7, 1.9, 0.3, 3), -0.14, 0.28, c, { mat: 'soft', cap: c.white });
  s += onL(-1.85, 0.14, 1.9, rows(0.5, 0.65, 2.7, 0.55, 2, c.mid, px(3)));
  return s;
});
icon('image', 'Obraz / grafika', 'Image', (c) => {
  let s = shadow(c, 2.1);
  s += slabY(rrect(-1.8, 0, 3.6, 2.8, 0.12), -0.12, 0.24, c);
  s += onL(-1.8, 0.12, 2.8, R(0.22, 0.22, 3.16, 2.36, c.white, { rx: 0.05 }) + Ci(2.6, 0.95, 0.3, c.pale)
    + Pg([[0.22, 2.58], [1.25, 1.1], [1.95, 2.0], [2.4, 1.55], [3.38, 2.58]], c.mid) + Pg([[1.95, 2.0], [2.4, 1.55], [3.38, 2.58], [2.35, 2.58]], c.dark));
  return s;
});
