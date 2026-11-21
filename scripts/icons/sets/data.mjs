// Data

import {
  set, shadow, band, box, prism, slabY, slabX, cyl, frustum, sphere, dome, loft, rrect, circle, arc, thick,
  faceL, faceR, faceT, onL, onR, onT, onG, onB, reserve, wire, dotAt,
  px, R, Ci, Ln, Pg, Pa, rows
} from '../iso.mjs';
import { ledRow, arrow, gear, sheet, cycleArrow, trayBack, trayFront } from '../parts.mjs';

const icon = set('af-data');

// Database: stacked discs with a status led each
export const database = (c, cx, cy, r, levels, h = 0.82, o = {}) => {
  let s = '';
  const gap = 0.13;
  for (let i = 0; i < levels; i++) {
    const z = i * (h + gap);
    if (i) s += cyl(cx, cy, z - gap, r * 0.87, gap, c, { mat: 'deep' });
    s += cyl(cx, cy, z, r, h, c, o);
    [68, 82].forEach((a) => {
      s += dotAt([cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180), z + h / 2], Math.max(1, r), o.mat ? c.mid : c.glow);
    });
  }
  return s;
};

icon('storage', 'Baza danych', 'Database', (c) => {
  return shadow(c, 2.2) + database(c, 0, 0, 1.6, 3);
});

icon('database-cluster', 'Klaster baz danych', 'Database cluster', (c) => {
  let s = shadow(c, 2.4);
  s += database(c, -1.0, 0.1, 0.88, 3, 0.62) + database(c, 0.1, -1.0, 0.88, 3, 0.62);
  s += database(c, 0.85, 0.85, 0.88, 2, 0.62, { mat: 'soft' });
  return s;
});

icon('cache', 'Cache / pamięć podręczna', 'Cache', (c) => {
  let s = shadow(c, 2.2);
  s += database(c, 0, 0, 1.6, 2);
  const bolt = [[0.3, 2.3], [-0.72, 0.9], [-0.08, 0.9], [-0.36, -0.1], [0.72, 1.35], [0.06, 1.35]].map(([x, z]) => [x, 1.77 + z * 0.95]);
  s += slabY(bolt, -0.2, 0.4, c, { mat: 'soft', cap: c.white });
  return s;
});

icon('disk', 'Dysk', 'Disk drive', (c) => {
  let s = shadow(c, 2.3);
  s += box(-1.45, -1.85, 0, 2.9, 3.7, 0.55, c, { r: 0.18 });
  s += onG(0, -0.35, 0.55, Ci(0, 0, 1.22, c.glow, { stroke: c.line, sw: px(1) }) + Ci(0, 0, 0.85, 'none', { stroke: c.pale, sw: px(1) }) + Ci(0, 0, 0.3, c.mid, { stroke: c.line, sw: px(1) }));
  s += wire([[1.0, 1.45, 0.6], [0.2, 0.35, 0.6]], c.line, 4.4) + wire([[1.0, 1.45, 0.6], [0.2, 0.35, 0.6]], c.dark, 2.4) + dotAt([1.0, 1.45, 0.6], 3, c.white, c.line);
  return s;
});

icon('bucket', 'Magazyn obiektów (bucket)', 'Object storage (bucket)', (c) => {
  let s = shadow(c, 1.9);
  s += frustum(0, 0, 0, 1.1, 1.55, 2.3, c, { cap: c.night });
  s += band(0, 0, 1.75, 1.44, c.main.seam, 0.9) + band(0, 0, 0.45, 1.19, c.main.seam, 0.9);
  s += box(-0.75, -0.5, 1.75, 0.7, 0.7, 0.75, c, { mat: 'soft', r: 0.08 }) + cyl(0.45, 0.1, 1.75, 0.38, 0.8, c);
  return s;
});

icon('data-warehouse', 'Hurtownia danych', 'Data warehouse', (c) => {
  let s = shadow(c, 2.4);
  s += slabY([[-1.85, 0], [1.85, 0], [1.85, 2.0], [0, 3.05], [-1.85, 2.0]], -1.25, 2.5, c);
  let f = Ci(1.85, 0.75, 0.22, c.white);
  for (let r = 0; r < 2; r++) for (let q = 0; q < 3; q++) f += R(0.38 + q * 1.04, 1.3 + r * 0.82, 0.86, 0.6, c.white, { rx: 0.14 }) + Ln([[0.6 + q * 1.04, 1.6 + r * 0.82], [1.02 + q * 1.04, 1.6 + r * 0.82]], c.mid, px(1.6));
  s += onL(-1.85, 1.25, 3.05, f);
  return s;
});

icon('backup', 'Kopia zapasowa', 'Backup', (c) => {
  let s = shadow(c, 2.1);
  s += box(-1.4, -1.15, 0, 2.8, 2.3, 2.4, c, { r: 0.2 });
  s += faceL(-1.4, -1.15, 0, 2.8, 2.3, 2.4, cycleArrow(1.4, 1.22, 0.78, c.white, px(2.8)) + Ln([[1.4, 0.82], [1.4, 1.24], [1.7, 1.42]], c.white, px(2.2)));
  return s;
});

icon('data-lake', 'Jezioro danych', 'Data lake', (c) => {
  let s = shadow(c, 2.4);
  s += cyl(0, 0, 0, 1.95, 0.42, c, { mat: 'soft' });
  let w = '';
  [[-1.1, -0.7], [0.1, 0.9], [-0.7, 0.45]].forEach(([x, y]) => {
    w += Pa(`M${x},${y}q0.2,-0.3 0.4,0t0.4,0t0.4,0`, 'none', { stroke: c.white, sw: px(1.5), op: 0.8 });
  });
  s += onG(0, 0, 0.42, Ci(0, 0, 1.7, c.main.top, { stroke: c.line, sw: px(1) }) + w);
  s += box(-1.0, -0.75, 0.42, 0.7, 0.7, 0.5, c, { r: 0.08 }) + cyl(0.55, -0.45, 0.42, 0.36, 0.55, c, { mat: 'deep' });
  s += box(0.0, 0.4, 0.42, 0.62, 0.62, 0.42, c, { mat: 'soft', r: 0.08 });
  return s;
});

icon('file', 'Plik', 'File', (c) => {
  let s = shadow(c, 1.7);
  s += sheet(c, -1.3, 0, 2.6, 3.3, -0.1, rows(0.35, 0.6, 1.2, 0.36, 3, c.pale, px(1.8)) + R(0, 1.95, 2.6, 0.8, c.mid) + ledRow(0.55, 2.35, 3, 0.36, c.white, 0.11), { fold: 0.75, d: 0.2 });
  return s;
});

icon('folder', 'Folder / katalog', 'Folder', (c) => {
  let s = shadow(c, 2.1);
  s += slabY([[-1.8, 0], [1.8, 0], [1.8, 2.35], [-0.15, 2.35], [-0.45, 2.75], [-1.55, 2.75], [-1.8, 2.5]], -0.5, 0.25, c, { mat: 'deep' });
  s += sheet(c, -1.5, 0.3, 3.0, 2.25, -0.2, rows(0.3, 0.35, 2.2, 0.3, 2, c.pale, px(1.5)), { d: 0.1 });
  s += slabY(rrect(-1.8, 0, 3.6, 2.05, 0.14), 0.05, 0.35, c);
  s += onL(-1.8, 0.4, 2.05, R(0.3, 0.3, 1.1, 0.28, c.white, { rx: 0.1, op: 0.9 }));
  return s;
});

icon('table', 'Tabela / arkusz', 'Table / spreadsheet', (c) => {
  let s = shadow(c, 2.1);
  s += slabY(rrect(-1.85, 0, 3.7, 2.8, 0.1), -0.12, 0.24, c, { cap: c.white });
  let f = R(0.14, 0.14, 3.42, 0.56, c.mid, { rx: 0.05 }) + R(0.14, 0.7, 0.9, 1.96, c.tint);
  [1.04, 1.9, 2.75].forEach((x) => {
    f += Ln([[x, 0.14], [x, 2.66]], c.pale, px(1.1), { cap: 'butt' });
  });
  [0.7, 1.19, 1.68, 2.17].forEach((y) => {
    f += Ln([[0.14, y], [3.56, y]], c.pale, px(1.1), { cap: 'butt' });
  });
  s += onL(-1.85, 0.12, 2.8, f);
  return s;
});

icon('etl', 'Proces ETL / potok danych', 'ETL / data pipeline', (c) => {
  let s = shadow(c, 2.4, 0, 0, 1.5);
  const pipe = (x) => box(x, -0.16, 0.42, 0.6, 0.32, 0.32, c, { mat: 'deep' });
  s += database(c, -1.45, 0, 0.52, 2, 0.5, { mat: 'soft' }) + pipe(-1.0);
  s += box(-0.65, -0.65, 0, 1.3, 1.3, 1.5, c, { r: 0.14 });
  s += faceL(-0.65, -0.65, 0, 1.3, 1.3, 1.5, Pg(gear(0.65, 0.72, 0.45, 8), c.white) + Ci(0.65, 0.72, 0.16, c.mid));
  s += pipe(0.45) + database(c, 1.45, 0, 0.52, 2, 0.5);
  return s;
});

icon('stream', 'Strumień danych', 'Data stream', (c) => {
  let s = shadow(c, 2.3, 0, 0, 1.6);
  s += box(-1.95, -1.25, 0, 3.9, 2.5, 0.3, c, { mat: 'deep', r: 0.2 });
  const tones = [{ top: c.dark, left: c.night, right: c.night, seam: c.mid }, 'main', 'soft'];
  tones.forEach((mat, i) => {
    const x = -1.6 + i * 1.08;
    s += prism([[x, -0.85], [x + 0.5, -0.85], [x + 1.1, 0], [x + 0.5, 0.85], [x, 0.85], [x + 0.6, 0]], 0.3, 0.3, c, { mat });
  });
  return s;
});

icon('search-index', 'Indeks / wyszukiwanie', 'Search index', (c) => {
  let s = shadow(c, 2.1);
  s += sheet(c, -1.75, 0, 2.5, 3.1, -0.5, rows(0.35, 0.5, 1.8, 0.36, 6, c.pale, px(1.8)), { d: 0.16 });
  s += slabY(thick([[1.2, 0.72], [1.78, 0.14]], 0.34), 0.35, 0.22, c, { mat: 'deep' });
  s += slabY(circle(0.5, 1.4, 0.98, 26), 0.3, 0.32, c);
  s += onL(0.5, 0.62, 1.4, Ci(0, 0, 0.68, c.glow, { stroke: c.line, sw: px(1) }) + Pa('M-0.42,-0.1A0.44,0.44 0 0 1 -0.1,-0.42', 'none', { stroke: c.white, sw: px(2) }));
  return s;
});

icon('archive', 'Archiwum', 'Archive', (c) => {
  let s = shadow(c, 2.3);
  s += box(-1.6, -1.15, 0, 3.2, 2.3, 1.7, c);
  s += faceL(-1.6, -1.15, 0, 3.2, 2.3, 1.7, R(0.95, 0.42, 1.3, 0.6, c.white, { rx: 0.06 }) + Ln([[1.2, 0.72], [2.0, 0.72]], c.pale, px(1.6)) + R(1.2, 1.25, 0.8, 0.2, c.night, { rx: 0.1 }));
  s += box(-1.74, -1.29, 1.7, 3.48, 2.58, 0.48, c, { mat: 'deep' });
  return s;
});

icon('nas', 'Macierz dyskowa NAS / SAN', 'NAS / SAN storage', (c) => {
  let s = shadow(c, 2.2);
  s += box(-1.5, -1.2, 0, 3.0, 2.4, 2.6, c, { r: 0.16 });
  let f = '';
  for (let i = 0; i < 4; i++) f += R(0.3 + i * 0.62, 0.3, 0.52, 1.6, c.night, { rx: 0.07 }) + Ci(0.56 + i * 0.62, 1.68, 0.08, c.glow) + Ln([[0.56 + i * 0.62, 0.5], [0.56 + i * 0.62, 1.3]], c.dark, px(1.5));
  s += faceL(-1.5, -1.2, 0, 3.0, 2.4, 2.6, f + Ci(0.5, 2.25, 0.11, c.white) + Ln([[1.7, 2.25], [2.6, 2.25]], c.main.right, px(1.6)));
  return s;
});

icon('graph-db', 'Baza grafowa', 'Graph database', (c) => {
  let s = shadow(c, 2.1);
  s += cyl(0, 0, 0, 1.6, 0.5, c);
  const A = [-1.0, 0.5, 1.6], B = [0.3, -0.5, 3.0], C2 = [1.0, 0.9, 1.5], D = [-0.1, 0.4, 0.5], E = [1.2, -0.9, 1.9];
  [[A, B], [B, C2], [A, C2], [A, D], [C2, D], [B, E]].forEach((e) => {
    s += wire(e, c.line, 1.8);
  });
  s += sphere(...E, 0.26, c, { mat: 'soft' }) + sphere(...B, 0.42, c) + sphere(...A, 0.36, c, { mat: 'soft' }) + sphere(...C2, 0.38, c, { mat: 'deep' });
  return s;
});

const transfer = (c, up) => {
  let s = shadow(c, 2.2);
  s += trayBack(c, -1.65, -1.25, 3.3, 2.5, 0.85);
  const a = up
    ? [[-0.42, 0.55], [0.42, 0.55], [0.42, 2.2], [1.0, 2.2], [0, 3.5], [-1.0, 2.2], [-0.42, 2.2]]
    : [[-0.42, 3.5], [0.42, 3.5], [0.42, 1.85], [1.0, 1.85], [0, 0.55], [-1.0, 1.85], [-0.42, 1.85]];
  s += slabY(a, -0.2, 0.42, c, { mat: 'soft', cap: c.white });
  s += trayFront(c, -1.65, -1.25, 3.3, 2.5, 0.85, ledRow(0.5, 0.42, 2, 0.26, c.glow, 0.08));
  return s;
};
icon('data-export', 'Eksport danych', 'Data export', (c) => transfer(c, true));
icon('data-import', 'Import danych', 'Data import', (c) => transfer(c, false));
