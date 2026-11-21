// Isometric drawing engine for the ArchFlow icon set.
//
// World space: x runs to the lower right, y to the lower left, z up. A tile
// footprint is 4x4 world units centred on the origin and is exactly 100px wide
// on screen. The camera looks along (-1,-1,-1), so the faces that can be seen
// are the ones facing +x ("right", darkest), +y ("left", mid tone) and +z
// ("top", lightest).
//
// Everything returns SVG strings. Shapes are drawn in painter's order: call
// the far ones (small x + y) first.

export const C = Math.cos(Math.PI / 6);
export const S = 100 / (8 * C); // px per world unit
export const VB_X = -51;
export const VB_W = 102;
export const VB_BOTTOM = 2 * S + 2; // bottom vertex of the footprint + margin
const EX = Math.sqrt(1.5) * S; // screen radii of a unit circle lying on the ground
const EY = Math.sqrt(0.5) * S;
const VIEW = [1, 1, 1];

// ---------------------------------------------------------------------------
// Per-icon state: bounding box and shared <defs>

let ctx = null;
export const begin = (ink) => {
  ctx = { minX: 0, maxX: 0, minY: 0, maxY: 0, defs: [], keys: new Map(), ink };
};
export const finish = () => {
  return ctx;
};
export const touch = (X, Y) => {
  if (X < ctx.minX) ctx.minX = X;
  if (X > ctx.maxX) ctx.maxX = X;
  if (Y < ctx.minY) ctx.minY = Y;
  if (Y > ctx.maxY) ctx.maxY = Y;
};
const def = (key, make) => {
  if (!ctx.keys.has(key)) {
    const id = `g${ctx.keys.size}`;
    ctx.keys.set(key, id);
    ctx.defs.push(make(id));
  }
  return ctx.keys.get(key);
};

// ---------------------------------------------------------------------------
// Projection and number formatting

const lin = (x, y, z) => {
  return [(x - y) * C * S, (x + y) * 0.5 * S - z * S];
};
export const P = (x, y, z = 0) => {
  const p = lin(x, y, z);
  touch(p[0], p[1]);
  return p;
};
const n1 = (v) => {
  return String(Number(v.toFixed(1)));
};
const n2 = (v) => {
  return String(Number(v.toFixed(2)));
};
const n3 = (v) => {
  return String(Number(v.toFixed(3)));
};
const ptsStr = (list) => {
  return list
    .map((p) => {
      return `${n1(p[0])},${n1(p[1])}`;
    })
    .join(' ');
};

// ---------------------------------------------------------------------------
// Colours

const rgb = (hex) => {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const hex = (c) => {
  return `#${c
    .map((v) => {
      return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    })
    .join('')}`;
};
export const blend = (a, b, t) => {
  const A = rgb(a), B = rgb(b);
  return hex(A.map((v, i) => v + (B[i] - v) * t));
};
// f > 0 lightens towards white, f < 0 darkens towards black
export const mix = (c, f) => {
  return f >= 0 ? blend(c, '#ffffff', f) : blend(c, '#000000', -f);
};

const NIGHT = '#131b2c';
// One palette per category. A material is a { top, left, right, seam } set;
// `seam` is the colour of inner edges (a soft highlight instead of an outline).
export const palette = (base) => {
  return {
    hex: base,
    line: blend(base, NIGHT, 0.68),
    main: { top: mix(base, 0.4), left: base, right: blend(base, NIGHT, 0.3), seam: mix(base, 0.72) },
    soft: { top: mix(base, 0.93), left: mix(base, 0.8), right: mix(base, 0.62), seam: '#ffffff' },
    paper: { top: '#ffffff', left: mix(base, 0.96), right: mix(base, 0.84), seam: mix(base, 0.62) },
    deep: { top: blend(base, NIGHT, 0.5), left: blend(base, NIGHT, 0.68), right: blend(base, NIGHT, 0.82), seam: blend(base, NIGHT, 0.25) },
    white: '#ffffff',
    glow: mix(base, 0.88),
    tint: mix(base, 0.78),
    pale: mix(base, 0.55),
    mid: base,
    dark: blend(base, NIGHT, 0.45),
    night: blend(base, NIGHT, 0.75)
  };
};
const matOf = (c, m) => {
  return typeof m === 'object' ? m : c[m || 'main'];
};
// Tone for a surface normal: 0 = right, 0.5 = left, 1 = top
export const shade = (m, b) => {
  const t = Math.max(0, Math.min(1, b));
  return t < 0.5 ? blend(m.right, m.left, t / 0.5) : blend(m.left, m.top, (t - 0.5) / 0.5);
};
const toneOf = (nrm) => {
  return nrm[2] + nrm[1] * 0.5;
};

// ---------------------------------------------------------------------------
// Vector helpers

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

// ---------------------------------------------------------------------------
// 2D point-list builders (used as extrusion profiles; y/z up, counter-clockwise)

export const arc = (cx, cy, r, a0, a1, steps = 8, ry = r) => {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * ry]);
  }
  return out;
};
export const circle = (cx, cy, r, steps = 24, ry = r) => {
  return arc(cx, cy, r, 0, 360 - 360 / steps, steps - 1, ry);
};
export const rrect = (x, y, w, h, r, steps = 2) => {
  if (!r) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  return [
    ...arc(x + w - r, y + r, r, -90, 0, steps),
    ...arc(x + w - r, y + h - r, r, 0, 90, steps),
    ...arc(x + r, y + h - r, r, 90, 180, steps),
    ...arc(x + r, y + r, r, 180, 270, steps)
  ];
};
export const ngon = (cx, cy, r, sides, rot = 0) => {
  return arc(cx, cy, r, rot, rot + 360 - 360 / sides, sides - 1);
};
export const bez = (p0, p1, p2, p3, steps = 8, skipFirst = false) => {
  const out = [];
  for (let i = skipFirst ? 1 : 0; i <= steps; i++) {
    const t = i / steps, u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
    ]);
  }
  return out;
};
// Polygon around a polyline of the given width (a "thick stroke" to extrude)
export const thick = (pts, w) => {
  const L = [], Rt = [];
  const nrm = (a, b) => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [-(b[1] - a[1]) / l, (b[0] - a[0]) / l];
  };
  pts.forEach((p, i) => {
    const n0 = i > 0 ? nrm(pts[i - 1], p) : nrm(p, pts[i + 1]);
    const nn = i < pts.length - 1 ? nrm(p, pts[i + 1]) : n0;
    let mx = n0[0] + nn[0], my = n0[1] + nn[1];
    const l = Math.hypot(mx, my) || 1;
    mx /= l;
    my /= l;
    const k = Math.min(2.5, 1 / Math.max(0.2, mx * n0[0] + my * n0[1])) * (w / 2);
    L.push([p[0] + mx * k, p[1] + my * k]);
    Rt.push([p[0] - mx * k, p[1] - my * k]);
  });
  return [...L, ...Rt.reverse()];
};
// Outline of any shape that is star-shaped around (cx, cy), from a predicate
export const outline = (inside, cx, cy, steps = 48, rmax = 5) => {
  const out = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    let lo = 0, hi = rmax;
    // walk outwards to the last inside sample, then refine
    for (let r = 0; r <= rmax; r += 0.02) if (inside(cx + Math.cos(a) * r, cy + Math.sin(a) * r)) lo = r;
    hi = lo + 0.02;
    for (let k = 0; k < 10; k++) {
      const m = (lo + hi) / 2;
      if (inside(cx + Math.cos(a) * m, cy + Math.sin(a) * m)) lo = m;
      else hi = m;
    }
    out.push([cx + Math.cos(a) * lo, cy + Math.sin(a) * lo]);
  }
  return out;
};

// ---------------------------------------------------------------------------
// Raw SVG helpers in screen space. The <svg> root sets the defaults
// (fill none, outline colour and width, round joins), so plain outline
// strokes need no attributes at all - that keeps the icons small.

export const LW = 1.15; // outline width
const SEAM = 0.9;
const pathD = (list, close) => {
  return `M${list.map((p) => `${n1(p[0])},${n1(p[1])}`).join(' ')}${close ? 'z' : ''}`;
};
const strokeOf = (stroke, sw) => {
  if (stroke === 'none') return ' stroke="none"';
  return `${stroke === ctx.ink ? '' : ` stroke="${stroke}"`}${sw === LW ? '' : ` stroke-width="${n2(sw)}"`}`;
};
export const poly = (list, fill, stroke = 'none', sw = LW, extra = '') => {
  return `<path d="${pathD(list, true)}" fill="${fill}"${strokeOf(stroke, sw)}${extra}/>`;
};
export const line = (list, stroke, sw = LW, extra = '') => {
  return `<path d="${pathD(list, false)}"${strokeOf(stroke, sw)}${extra}/>`;
};
// Polyline through world points
export const wire = (pts3, stroke, sw = LW, extra = '') => {
  return line(pts3.map((p) => P(...p)), stroke, sw, extra);
};
// Polygon through world points
export const facet = (pts3, fill, stroke = 'none', sw = LW, extra = '') => {
  return poly(pts3.map((p) => P(...p)), fill, stroke, sw, extra);
};
// Screen-space dot at a world point (leds, joints)
export const dotAt = (p3, r, fill, stroke = 'none', sw = 0.8) => {
  const [X, Y] = P(...p3);
  touch(X - r, Y - r);
  touch(X + r, Y + r);
  return `<circle cx="${n1(X)}" cy="${n1(Y)}" r="${n1(r)}" fill="${fill}"${strokeOf(stroke, sw)}/>`;
};

// ---------------------------------------------------------------------------
// Loft: the workhorse. `F` is the visible cap as a list of world points (any
// planar polygon) and `B` the matching points of the hidden cap. Side faces
// are shaded by their normal, culled when they face away, and painted far to
// near. Inner edges get a soft highlight ("seam"), the silhouette an outline.
//
// options: mat ('main' | 'soft' | 'paper' | 'deep' | material), cap (fill
// override for the cap), op (opacity), line (outline colour), crease (cosine
// above which neighbouring side faces count as one smooth surface), noCap

export const loft = (F, B, c, o = {}) => {
  const m = matOf(c, o.mat);
  const ink = o.line ?? c.line;
  const k = F.length;
  let area = [0, 0, 0], cf = [0, 0, 0], cb = [0, 0, 0];
  for (let i = 0; i < k; i++) {
    area = add(area, cross(F[i], F[(i + 1) % k]));
    cf = add(cf, F[i]);
    cb = add(cb, B[i]);
  }
  let N = unit(area);
  if (dot(N, sub(cf, cb)) < 0) {
    // make the cap counter-clockwise around its outward normal
    F = [...F].reverse();
    B = [...B].reverse();
    N = [-N[0], -N[1], -N[2]];
  }
  const fp = F.map((p) => P(...p));
  const bp = B.map((p) => P(...p));
  const sides = [];
  for (let i = 0; i < k; i++) {
    const j = (i + 1) % k;
    const nrm = unit(cross(sub(add(B[i], B[j]), add(F[i], F[j])), sub(F[j], F[i])));
    sides.push({ i, j, nrm, vis: dot(nrm, VIEW) > 1e-6, depth: dot(add(add(F[i], F[j]), add(B[i], B[j])), VIEW) });
  }
  const smooth = o.crease ?? 0.92;
  const op = o.op === undefined ? '' : ` fill-opacity="${o.op}"`;
  const visible = sides.filter((s) => s.vis).sort((a, b) => a.depth - b.depth);
  let out = '';
  // backing so that hairline gaps between the side faces never show through
  if (o.op === undefined) {
    visible.forEach((s) => {
      if (sides[(s.i + k - 1) % k].vis && visible.length < k) return;
      const run = [s];
      while (sides[run[run.length - 1].j].vis && run.length < k) run.push(sides[run[run.length - 1].j]);
      if (run.length > 1) out += poly([fp[run[0].i], ...run.map((r) => fp[r.j]), ...run.map((r) => bp[r.j]).reverse(), bp[run[0].i]], shade(m, 0.3));
    });
  }
  visible.forEach((s) => {
    out += poly([fp[s.i], fp[s.j], bp[s.j], bp[s.i]], shade(m, toneOf(s.nrm)), 'none', 0, op);
    const prev = sides[(s.i + k - 1) % k], next = sides[s.j];
    let d = pathD([bp[s.i], bp[s.j]], false);
    if (!prev.vis) d = pathD([fp[s.i], bp[s.i], bp[s.j]], false);
    if (!next.vis) d += `L${n1(fp[s.j][0])},${n1(fp[s.j][1])}`;
    out += `<path d="${d}"${strokeOf(ink, LW)}/>`;
    if (prev.vis && dot(prev.nrm, s.nrm) < smooth) out += line([fp[s.i], bp[s.i]], m.seam, SEAM);
  });
  if (o.noCap) return out;
  out += poly(fp, o.cap ?? shade(m, toneOf(N)), 'none', 0, op);
  // cap edges: seam where a visible side continues, outline elsewhere
  const runs = (want) => {
    const stroke = want ? m.seam : ink, sw = want ? SEAM : LW;
    const start = sides.findIndex((sd, idx) => sd.vis === want && sides[(idx + k - 1) % k].vis !== want);
    if (start < 0) return sides[0].vis === want ? `<path d="${pathD(fp, true)}"${strokeOf(stroke, sw)}/>` : '';
    let s = '', run = null;
    for (let q = 0; q <= k; q++) {
      const sd = sides[(start + q) % k];
      if (q < k && sd.vis === want) {
        if (!run) run = [fp[sd.i]];
        run.push(fp[sd.j]);
      } else if (run) {
        s += line(run, stroke, sw);
        run = null;
      }
    }
    return s;
  };
  return out + runs(true) + runs(false);
};
// Straight extrusion of the cap `F` along the vector `E`
export const extrude = (F, E, c, o) => {
  return loft(F, F.map((p) => add(p, E)), c, o);
};

// Footprint [[x, y], ...] at height z, extruded up by h
export const prism = (pts, z, h, c, o) => {
  return extrude(pts.map(([x, y]) => [x, y, z + h]), [0, 0, -h], c, o);
};
// Profile [[x, z], ...] facing left (front at y + d), d deep
export const slabY = (pts, y, d, c, o) => {
  return extrude(pts.map(([x, z]) => [x, y + d, z]), [0, -d, 0], c, o);
};
// Profile [[y, z], ...] facing right (front at x + w), w wide
export const slabX = (pts, x, w, c, o) => {
  return extrude(pts.map(([y, z]) => [x + w, y, z]), [-w, 0, 0], c, o);
};
// Box; o.r rounds the vertical edges
export const box = (x, y, z, w, d, h, c, o = {}) => {
  return prism(rrect(x, y, w, d, o.r || 0), z, h, c, o);
};

// ---------------------------------------------------------------------------
// Round primitives (shaded with gradients)

const hGrad = (m) => {
  const stops = [[0, 0.36], [0.26, 0.56], [0.62, 0.3], [1, 0.02]];
  return def(`h${m.left}${m.right}${m.top}`, (id) => {
    return `<linearGradient id="${id}">${stops.map(([o, b]) => `<stop offset="${o}" stop-color="${shade(m, b)}"/>`).join('')}</linearGradient>`;
  });
};
const ballGrad = (m) => {
  return def(`b${m.left}${m.right}${m.top}`, (id) => {
    return `<radialGradient id="${id}" cx="0.36" cy="0.3" r="0.78"><stop offset="0" stop-color="${mix(m.top, 0.55)}"/><stop offset="0.4" stop-color="${blend(m.top, m.left, 0.45)}"/><stop offset="0.8" stop-color="${blend(m.left, m.right, 0.6)}"/><stop offset="1" stop-color="${m.right}"/></radialGradient>`;
  });
};

// Upright truncated cone from radius r0 (bottom) to r1 (top); cylinder if equal
export const frustum = (cx, cy, z, r0, r1, h, c, o = {}) => {
  const m = matOf(c, o.mat);
  const ink = o.line ?? c.line;
  const [X, Y0] = P(cx, cy, z);
  const Y1 = Y0 - h * S;
  const k = EY / EX;
  // tangent points of the silhouette on both ellipses
  const sin = Math.max(-0.95, Math.min(0.95, ((r0 - r1) * EX) / ((Y0 - Y1) / k)));
  const cos = Math.sqrt(1 - sin * sin);
  const a0 = r0 * EX, b0 = r0 * EY, a1 = r1 * EX, b1 = r1 * EY;
  const xb = a0 * cos, yb = Y0 - b0 * sin, xt = a1 * cos, yt = Y1 - b1 * sin;
  touch(X - Math.max(a0, a1), Y1 - b1);
  touch(X + Math.max(a0, a1), Y0 + b0);
  const op = o.op === undefined ? '' : ` fill-opacity="${o.op}"`;
  let s = `<path d="M${n1(X - xt)},${n1(yt)}L${n1(X - xb)},${n1(yb)}A${n1(a0)},${n1(b0)} 0 ${sin < 0 ? 0 : 1} 0 ${n1(X + xb)},${n1(yb)}L${n1(X + xt)},${n1(yt)}${r1 > 0 ? `A${n1(a1)},${n1(b1)} 0 ${sin < 0 ? 1 : 0} 1 ${n1(X - xt)},${n1(yt)}` : ''}Z" fill="url(#${hGrad(m)})"${strokeOf(ink, LW)}${op}/>`;
  if (r1 > 0 && !o.noCap) {
    s += `<ellipse cx="${n1(X)}" cy="${n1(Y1)}" rx="${n1(a1)}" ry="${n1(b1)}" fill="${o.cap ?? m.top}" stroke="none"${op}/>`;
    s += `<path d="M${n1(X - xt)},${n1(yt)}A${n1(a1)},${n1(b1)} 0 ${sin < 0 ? 1 : 0} 0 ${n1(X + xt)},${n1(yt)}" ${strokeOf(m.seam, SEAM)}/>`;
    s += `<path d="M${n1(X - xt)},${n1(yt)}A${n1(a1)},${n1(b1)} 0 ${sin < 0 ? 0 : 1} 1 ${n1(X + xt)},${n1(yt)}" ${strokeOf(ink, LW)}/>`;
  }
  return s;
};
export const cyl = (cx, cy, z, r, h, c, o) => {
  return frustum(cx, cy, z, r, r, h, c, o);
};
// Ring drawn around an upright cylinder at height z (front half only)
export const band = (cx, cy, z, r, stroke, sw = LW) => {
  const [X, Y] = P(cx, cy, z);
  return `<path d="M${n1(X - r * EX)},${n1(Y)}A${n1(r * EX)},${n1(r * EY)} 0 0 0 ${n1(X + r * EX)},${n1(Y)}" ${strokeOf(stroke, sw)}/>`;
};
// Sphere of radius r centred at (cx, cy, zc)
export const sphere = (cx, cy, zc, r, c, o = {}) => {
  const m = matOf(c, o.mat);
  const [X, Y] = P(cx, cy, zc);
  const R = r * EX;
  touch(X - R, Y - R);
  touch(X + R, Y + R);
  return `<circle cx="${n1(X)}" cy="${n1(Y)}" r="${n1(R)}" fill="url(#${ballGrad(m)})"${strokeOf(o.line ?? c.line, LW)}/>`;
};
// Upper half of a sphere resting on height z; o.k squashes or stretches it,
// o.seam draws the base edge as an inner edge (when it sits on a cylinder)
export const dome = (cx, cy, z, r, c, o = {}) => {
  const m = matOf(c, o.mat);
  const [X, Y] = P(cx, cy, z);
  const a = r * EX, b = r * EY, hgt = a * (o.k ?? 1);
  touch(X - a, Y - hgt);
  touch(X + a, Y + b);
  return `<path d="M${n1(X - a)},${n1(Y)}A${n1(a)},${n1(hgt)} 0 0 1 ${n1(X + a)},${n1(Y)}A${n1(a)},${n1(b)} 0 0 1 ${n1(X - a)},${n1(Y)}z" fill="url(#${ballGrad(m)})" stroke="none"/>`
    + `<path d="M${n1(X - a)},${n1(Y)}A${n1(a)},${n1(b)} 0 0 0 ${n1(X + a)},${n1(Y)}"${strokeOf(o.seam ? m.seam : o.line ?? c.line, o.seam ? SEAM : LW)}/>`
    + `<path d="M${n1(X - a)},${n1(Y)}A${n1(a)},${n1(hgt)} 0 0 1 ${n1(X + a)},${n1(Y)}"${strokeOf(o.line ?? c.line, LW)}/>`;
};
// Torus lying flat: ring radius R, tube radius r, resting on height z
export const torus = (cx, cy, z, R, r, c, o = {}) => {
  const m = matOf(c, o.mat);
  const [X, Y] = P(cx, cy, z + r);
  const w = 2 * r * EX;
  touch(X - R * EX - w / 2, Y - R * EY - w / 2);
  touch(X + R * EX + w / 2, Y + R * EY + w / 2);
  const e = `<ellipse cx="${n1(X)}" cy="${n1(Y)}" rx="${n1(R * EX)}" ry="${n1(R * EY)}"`;
  const id = def(`t${m.left}${m.right}`, (i) => {
    return `<linearGradient id="${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0.1" stop-color="${m.top}"/><stop offset="0.5" stop-color="${m.left}"/><stop offset="0.95" stop-color="${m.right}"/></linearGradient>`;
  });
  return `${e} stroke-width="${n1(w + 2 * LW)}"/>${e} stroke="url(#${id})" stroke-width="${n1(w)}"/>`
    + `<path d="M${n1(X - R * EX * 0.9)},${n1(Y - R * EY * 0.55)}A${n1(R * EX)},${n1(R * EY)} 0 0 1 ${n1(X + R * EX * 0.2)},${n1(Y - R * EY * 1.0)}" stroke="${mix(m.top, 0.6)}" stroke-width="${n1(w * 0.22)}" transform="translate(0 ${n1(-w * 0.2)})"/>`;
};
// Soft contact shadow on the ground
export const shadow = (c, r = 2.1, cx = 0, cy = 0, ry = r) => {
  const [X, Y] = P(cx, cy, 0);
  const id = def(`s${c.line}`, (i) => {
    return `<radialGradient id="${i}"><stop offset="0.45" stop-color="${c.line}" stop-opacity="0.3"/><stop offset="1" stop-color="${c.line}" stop-opacity="0"/></radialGradient>`;
  });
  touch(X - r * EX, Y - ry * EY);
  touch(X + r * EX, Y + ry * EY);
  return `<ellipse cx="${n1(X)}" cy="${n1(Y)}" rx="${n1(r * EX)}" ry="${n1(ry * EY)}" fill="url(#${id})" stroke="none"/>`;
};

// ---------------------------------------------------------------------------
// Drawing on surfaces. The content is plain SVG in world units, mapped onto a
// plane with an affine matrix, so circles, rounded rects and strokes all
// follow the surface.

export const onPlane = (origin, u, v, inner) => {
  const [e, f] = lin(...origin);
  const [a, b] = lin(...u);
  const [c2, d] = lin(...v);
  return `<g transform="matrix(${n3(a)} ${n3(b)} ${n3(c2)} ${n3(d)} ${n1(e)} ${n1(f)})" stroke="none">${inner}</g>`;
};
// Left-facing plane; origin = top-left corner, u along +x, v down
export const onL = (x, y, z, inner) => {
  return onPlane([x, y, z], [1, 0, 0], [0, 0, -1], inner);
};
// Right-facing plane; origin = top-left corner as seen (front), u along -y, v down
export const onR = (x, y, z, inner) => {
  return onPlane([x, y, z], [0, -1, 0], [0, 0, -1], inner);
};
// Top plane; origin = far corner, u along +x, v along +y
export const onT = (x, y, z, inner) => {
  return onPlane([x, y, z], [1, 0, 0], [0, 1, 0], inner);
};
// Top plane, but "screen upright": origin = centre, u to the right of the
// screen, v towards the viewer. A circle of radius r covers a ground circle.
export const onG = (cx, cy, z, inner) => {
  const q = Math.SQRT1_2;
  return onPlane([cx, cy, z], [q, -q, 0], [q, q, 0], inner);
};
// Faces of a box given like box()
export const faceL = (x, y, z, w, d, h, inner) => onL(x, y + d, z + h, inner);
export const faceR = (x, y, z, w, d, h, inner) => onR(x + w, y + d, z + h, inner);
export const faceT = (x, y, z, w, d, h, inner) => onT(x, y, z + h, inner);
// Billboard facing the camera; origin at a world point, units = world units, v down
export const onB = (x, y, z, inner) => {
  const [X, Y] = lin(x, y, z);
  return `<g transform="matrix(${n3(S)} 0 0 ${n3(S)} ${n1(X)} ${n1(Y)})" stroke="none">${inner}</g>`;
};
// Reserve room for billboard content: (dx, dy) in world units, dy up
export const reserve = (x, y, z, dx, dy) => {
  const [X, Y] = lin(x, y, z);
  touch(X + dx * S, Y - dy * S);
  return '';
};

// 2D content helpers (world units; `px` converts a pixel width)
export const px = (v) => v / S;
const strokeAttr = (o) => {
  return `${o.stroke ? ` stroke="${o.stroke}" stroke-width="${n3(o.sw ?? px(1))}"` : ''}${o.op === undefined ? '' : ` opacity="${o.op}"`}`;
};
export const R = (x, y, w, h, fill, o = {}) => {
  return `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}"${o.rx ? ` rx="${n2(o.rx)}"` : ''} fill="${fill}"${strokeAttr(o)}/>`;
};
export const Ci = (cx, cy, r, fill, o = {}) => {
  return o.ry
    ? `<ellipse cx="${n2(cx)}" cy="${n2(cy)}" rx="${n2(r)}" ry="${n2(o.ry)}" fill="${fill}"${strokeAttr(o)}/>`
    : `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(r)}" fill="${fill}"${strokeAttr(o)}/>`;
};
const pts2 = (list) => {
  return list
    .map((p) => {
      return `${n2(p[0])},${n2(p[1])}`;
    })
    .join(' ');
};
export const Ln = (list, stroke, sw = px(1.6), o = {}) => {
  return `<polyline points="${pts2(list)}" stroke="${stroke}" stroke-width="${n3(sw)}"${o.cap ? ` stroke-linecap="${o.cap}"` : ''}${o.op === undefined ? '' : ` opacity="${o.op}"`}/>`;
};
export const Pg = (list, fill, o = {}) => {
  return `<polygon points="${pts2(list)}" fill="${fill}"${strokeAttr(o)}/>`;
};
export const Pa = (d, fill, o = {}) => {
  return `<path d="${d.replace(/-?\d+\.\d{3,}(e-?\d+)?/g, (v) => n2(Number(v)))}" fill="${fill}"${strokeAttr(o)}/>`;
};
// Rows of text-like lines: x, y, width, row gap, count; last row is shorter
export const rows = (x, y, w, gap, count, stroke, sw = px(1.5), lastShort = 0.6) => {
  let s = '';
  for (let i = 0; i < count; i++) s += Ln([[x, y + i * gap], [x + w * (i === count - 1 ? lastShort : 1), y + i * gap]], stroke, sw);
  return s;
};

// ---------------------------------------------------------------------------
// Assemble one icon into an <svg>

export const render = (draw, color) => {
  const c = palette(color);
  begin(c.line);
  const body = draw(c);
  const top = Math.floor(ctx.minY - 2);
  const h = Math.ceil(VB_BOTTOM - top);
  const warn = [];
  if (ctx.maxY > VB_BOTTOM + 0.01) warn.push(`bottom overflow ${(ctx.maxY - VB_BOTTOM).toFixed(1)}px`);
  if (ctx.minX < VB_X + 0.5 || ctx.maxX > VB_X + VB_W - 0.5) warn.push(`side overflow ${ctx.minX.toFixed(1)}..${ctx.maxX.toFixed(1)}`);
  const defs = ctx.defs.length ? `<defs>${ctx.defs.join('')}</defs>` : '';
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB_X} ${top} ${VB_W} ${h}" width="${VB_W}" height="${h}" fill="none" stroke="${c.line}" stroke-width="${LW}" stroke-linejoin="round" stroke-linecap="round">${defs}${body}</svg>`,
    warn
  };
};

// ---------------------------------------------------------------------------
// Icon registry: each set file calls `const icon = set('af-...')` and then
// icon(id, polishName, englishName, draw)

export const ICONS = [];
export const set = (cat) => {
  return (id, pl, en, draw) => {
    ICONS.push({ id, cat, pl, en, draw });
  };
};
