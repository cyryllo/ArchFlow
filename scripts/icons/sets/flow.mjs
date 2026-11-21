// Flow & process

import {
  set, shadow, band, box, prism, slabY, slabX, cyl, frustum, sphere, dome, rrect, circle, arc, bez, thick,
  faceL, faceR, faceT, onL, onR, onT, onG, onB, onPlane, reserve, wire, dotAt,
  px, R, Ci, Ln, Pg, Pa, rows
} from '../iso.mjs';
import { ledRow, check, cross, plus, arrow, sheet, envelopeFlap } from '../parts.mjs';
import { database } from './data.mjs';

const icon = set('af-flow');

// Event: round tile with a glyph drawn "screen upright" on top
const event = (c, glyph, mat) => {
  return shadow(c, 2.2) + cyl(0, 0, 0, 1.75, 0.5, c, { mat }) + onG(0, 0, 0.5, glyph);
};
// Gateway: sharp square tile (a diamond on screen)
const gateway = (c, glyph, mat) => {
  return shadow(c, 2.3) + box(-1.55, -1.55, 0, 3.1, 3.1, 0.8, c, { mat }) + onG(0, 0, 0.8, glyph);
};

icon('start', 'Start / zdarzenie początkowe', 'Start event', (c) => {
  return event(c, Pg([[-0.42, -0.8], [0.9, 0], [-0.42, 0.8]], c.white, { stroke: c.white, sw: px(2) }));
});
icon('end', 'Koniec / zdarzenie końcowe', 'End event', (c) => {
  return event(c, Ci(0, 0, 1.32, 'none', { stroke: c.white, sw: px(3.4) }) + R(-0.55, -0.55, 1.1, 1.1, c.white, { rx: 0.12 }), 'deep');
});
icon('intermediate-event', 'Zdarzenie pośrednie', 'Intermediate event', (c) => {
  return event(c, Ci(0, 0, 1.35, 'none', { stroke: c.mid, sw: px(2.2) }) + Ci(0, 0, 0.98, 'none', { stroke: c.mid, sw: px(2.2) }) + Ci(0, 0, 0.3, c.mid), 'soft');
});
icon('error', 'Błąd / wyjątek', 'Error / exception', (c) => {
  return event(c, Pg([[0.2, -1.05], [-0.6, 0.12], [-0.08, 0.12], [-0.25, 1.05], [0.6, -0.22], [0.08, -0.22]], c.white, { stroke: c.white, sw: px(1.5) }));
});
icon('signal', 'Sygnał', 'Signal', (c) => {
  return event(c, Pg([[0, -0.95], [0.95, 0.65], [-0.95, 0.65]], c.white, { stroke: c.white, sw: px(2.4) }));
});
const letter = (c, fill, stroke) => R(-0.95, -0.62, 1.9, 1.24, fill, { rx: 0.1, stroke, sw: px(2) }) + Ln([[-0.95, -0.55], [0, 0.15], [0.95, -0.55]], stroke, px(2));
icon('message-send', 'Wysłanie komunikatu', 'Send message', (c) => {
  return event(c, letter(c, c.night, c.white), 'main');
});
icon('message-receive', 'Odebranie komunikatu', 'Receive message', (c) => {
  return event(c, letter(c, c.white, c.mid), 'soft');
});
icon('approval', 'Akceptacja', 'Approval', (c) => {
  return event(c, check(0, 0.05, 0.85, c.white, px(4.6)));
});
icon('rejection', 'Odrzucenie', 'Rejection', (c) => {
  return event(c, cross(0, 0, 0.7, c.white, px(4.6)), 'deep');
});

icon('process', 'Krok procesu', 'Process step', (c) => {
  let s = shadow(c, 2.4, 0, 0, 1.9);
  s += box(-1.9, -1.3, 0, 3.8, 2.6, 0.9, c, { r: 0.3, steps: 3 });
  s += faceT(-1.9, -1.3, 0, 3.8, 2.6, 0.9, rows(0.75, 0.9, 2.3, 0.45, 2, c.white, px(2.6)));
  return s;
});
icon('subprocess', 'Podproces', 'Sub-process', (c) => {
  let s = shadow(c, 2.4, 0, 0, 1.9);
  s += box(-1.9, -1.3, 0, 3.8, 2.6, 0.9, c, { r: 0.3, steps: 3 });
  s += faceT(-1.9, -1.3, 0, 3.8, 2.6, 0.9, Ln([[0.75, 0.7], [3.05, 0.7]], c.white, px(2.6)) + R(1.5, 1.25, 0.8, 0.8, 'none', { stroke: c.white, sw: px(2), rx: 0.1 }) + plus(1.9, 1.65, 0.22, c.white, px(2)));
  return s;
});

icon('diamond', 'Decyzja', 'Decision', (c) => {
  return gateway(c, Pa('M-0.42,-0.42a0.44,0.5 0 1 1 0.62,0.42q-0.2,0.12 -0.2,0.42', 'none', { stroke: c.white, sw: px(3.4) }) + Ci(0, 1.0, 0.15, c.white, { ry: 0.2 }));
});
icon('parallel-gateway', 'Bramka równoległa', 'Parallel gateway', (c) => {
  return gateway(c, plus(0, 0, 0.85, c.white, px(4.4)));
});
icon('merge', 'Scalenie ścieżek', 'Merge', (c) => {
  return gateway(c, Ln([[-1.05, -0.75], [-0.1, 0], [-1.05, 0.75]], c.mid, px(3)) + arrow(-0.1, 0, 1.15, 0, c.mid, px(3), 0.4), 'soft');
});

const page = (c, y, content) => sheet(c, -1.3, 0, 2.6, 3.3, y, content, { fold: 0.75, d: 0.2 });
const pageText = (c) => R(0.35, 0.45, 1.0, 0.26, c.mid, { rx: 0.08 }) + rows(0.35, 1.15, 1.9, 0.38, 5, c.pale, px(1.9));
icon('document', 'Dokument', 'Document', (c) => {
  return shadow(c, 1.7) + page(c, -0.1, pageText(c));
});
icon('documents', 'Dokumenty', 'Documents', (c) => {
  return shadow(c, 2.0) + page(c, -0.95, '') + page(c, -0.25, '') + page(c, 0.45, pageText(c));
});
icon('report', 'Raport / analityka', 'Report / analytics', (c) => {
  const chart = R(0.35, 0.45, 1.0, 0.26, c.mid, { rx: 0.08 }) + rows(0.35, 1.05, 1.9, 0.34, 2, c.pale, px(1.9))
    + R(0.4, 2.3, 0.4, 0.55, c.pale) + R(0.95, 1.95, 0.4, 0.9, c.mid) + R(1.5, 2.15, 0.4, 0.7, c.pale) + R(2.05, 1.7, 0.4, 1.15, c.mid) + Ln([[0.3, 2.87], [2.5, 2.87]], c.dark, px(1.4));
  return shadow(c, 1.7) + page(c, -0.1, chart);
});
icon('note', 'Notatka / adnotacja', 'Note / annotation', (c) => {
  let s = shadow(c, 1.8);
  s += slabY([[-1.45, 0], [0.85, 0], [1.45, 0.6], [1.45, 2.9], [-1.45, 2.9]], -0.1, 0.2, c, { cap: c.tint });
  s += onL(-1.45, 0.1, 2.9, rows(0.4, 0.6, 2.1, 0.45, 4, c.mid, px(2)) + Pg([[2.3, 2.9], [2.3, 2.3], [2.9, 2.3]], c.pale, { stroke: c.mid, sw: px(1) }));
  return s;
});
icon('checklist', 'Lista kontrolna', 'Checklist', (c) => {
  let s = shadow(c, 1.9);
  s += slabY(rrect(-1.5, 0, 3.0, 3.5, 0.16), -0.14, 0.28, c);
  let f = R(0.22, 0.32, 2.56, 2.96, c.white, { rx: 0.06 }) + R(0.95, 0.1, 1.1, 0.42, c.night, { rx: 0.12 });
  for (let i = 0; i < 3; i++) {
    const y = 1.05 + i * 0.72;
    f += R(0.45, y - 0.2, 0.42, 0.42, i < 2 ? c.mid : c.white, { rx: 0.08, stroke: c.mid, sw: px(1.4) }) + (i < 2 ? check(0.66, y + 0.01, 0.14, c.white, px(1.6)) : '') + Ln([[1.15, y], [2.4, y]], c.pale, px(2));
  }
  s += onL(-1.5, 0.14, 3.5, f);
  return s;
});
icon('calendar', 'Kalendarz / termin', 'Calendar / deadline', (c) => {
  let s = shadow(c, 2.0);
  s += slabY(rrect(-1.6, 0, 3.2, 3.0, 0.2), -0.16, 0.32, c, { cap: c.white });
  let f = Pa('M0,0.85V0.2a0.2,0.2 0 0 1 0.2,-0.2H3a0.2,0.2 0 0 1 0.2,0.2V0.85z', c.mid);
  for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) f += R(0.36 + q * 0.66, 1.15 + r * 0.56, 0.44, 0.36, r === 1 && q === 2 ? c.mid : c.tint, { rx: 0.07 });
  f += Ln([[0.8, -0.18], [0.8, 0.35]], c.night, px(3.2)) + Ln([[2.4, -0.18], [2.4, 0.35]], c.night, px(3.2));
  s += onL(-1.6, 0.16, 3.0, f) + reserve(0, 0.16, 3.0, 0, 0.3);
  return s;
});

icon('data-io', 'Dane wejściowe / wyjściowe', 'Data input / output', (c) => {
  let s = shadow(c, 2.4, 0, 0, 1.8);
  s += prism([[-1.25, -1.25], [1.95, -1.25], [1.25, 1.25], [-1.95, 1.25]], 0, 0.7, c);
  s += onT(-1.6, -1.25, 0.7, arrow(0.75, 0.85, 2.5, 0.85, c.white, px(2.6), 0.34) + arrow(2.45, 1.65, 0.7, 1.65, c.white, px(2.6), 0.34));
  return s;
});
icon('data-store', 'Magazyn danych', 'Data store', (c) => {
  return shadow(c, 2.1) + database(c, 0, 0, 1.55, 2, 0.78);
});
icon('manual-input', 'Wprowadzanie ręczne', 'Manual input', (c) => {
  let s = shadow(c, 2.3);
  const y0 = -1.25, z0 = 1.35, y1 = 1.3, z1 = 0.45;
  s += slabX([[y0, 0], [y1, 0], [y1, z1], [y0, z0]], -1.8, 3.6, c);
  const len = Math.hypot(y1 - y0, z1 - z0);
  let f = '';
  for (let r = 0; r < 3; r++) for (let q = 0; q < 6; q++) f += R(0.36 + q * 0.5, 0.4 + r * 0.6, 0.36, 0.42, c.white, { rx: 0.08 });
  f += R(0.86, 2.2, 1.86, 0.3, c.white, { rx: 0.08 });
  s += onPlane([-1.8, y0, z0], [1, 0, 0], [0, (y1 - y0) / len, (z1 - z0) / len], f);
  return s;
});
icon('manual-task', 'Zadanie ręczne', 'Manual task', (c) => {
  let s = shadow(c, 2.3);
  s += box(-1.6, -1.6, 0, 3.2, 3.2, 0.7, c, { r: 0.4, steps: 3 });
  let f = R(-0.55, -0.15, 1.1, 1.1, c.white, { rx: 0.3 });
  [[-0.41, -0.95], [-0.14, -1.2], [0.14, -1.12], [0.41, -0.8]].forEach(([x, y]) => {
    f += Ln([[x, 0.2], [x, y]], c.white, px(3.6));
  });
  f += Ln([[-0.45, 0.55], [-1.0, 0.05]], c.white, px(3.8));
  s += onG(0, 0, 0.7, f);
  return s;
});

icon('delay', 'Opóźnienie / oczekiwanie', 'Delay / wait', (c) => {
  let s = shadow(c, 1.6);
  s += cyl(0, 0, 0, 1.0, 0.2, c, { mat: 'deep' });
  s += frustum(0, 0, 0.2, 0.72, 0.2, 0.7, c);
  s += frustum(0, 0, 0.2, 0.88, 0.13, 1.6, c, { mat: 'soft', op: 0.55 });
  s += frustum(0, 0, 1.8, 0.13, 0.88, 1.6, c, { mat: 'soft', cap: c.main.top });
  s += cyl(0, 0, 3.4, 1.0, 0.2, c, { mat: 'deep' });
  return s;
});
icon('timer', 'Czas / timer', 'Timer', (c) => {
  let s = shadow(c, 1.9);
  s += box(-0.22, -0.25, 3.05, 0.44, 0.5, 0.4, c, { mat: 'deep' });
  s += slabY(circle(0, 1.6, 1.55, 30), -0.28, 0.56, c);
  let f = Ci(0, 0, 1.2, c.white);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    f += Ln([[Math.cos(a) * 0.95, Math.sin(a) * 0.95], [Math.cos(a) * 1.08, Math.sin(a) * 1.08]], c.pale, px(1.5));
  }
  s += onL(0, 0.28, 1.6, f + Ln([[0, -0.75], [0, 0], [0.5, 0.3]], c.dark, px(2.8)) + Ci(0, 0, 0.12, c.dark));
  return s;
});
icon('loop', 'Pętla / ponowienie', 'Loop / retry', (c) => {
  let s = shadow(c, 2.2);
  s += prism(thick(arc(0, 0, 1.3, 40, 310, 22), 0.62), 0, 0.45, c);
  const a = (310 * Math.PI) / 180, p = [1.3 * Math.cos(a), 1.3 * Math.sin(a)];
  s += prism([[p[0] - Math.sin(a) * 1.0, p[1] + Math.cos(a) * 1.0], [p[0] + Math.cos(a) * 0.68, p[1] + Math.sin(a) * 0.68], [p[0] - Math.cos(a) * 0.68, p[1] - Math.sin(a) * 0.68]], 0, 0.45, c);
  return s;
});
icon('milestone', 'Kamień milowy', 'Milestone', (c) => {
  let s = shadow(c, 1.4);
  s += cyl(0, 0, 0, 0.95, 0.2, c, { mat: 'deep' });
  s += cyl(0, 0, 0.2, 0.1, 3.6, c, { mat: 'soft' });
  const flag = [...bez([0.1, 2.25], [0.75, 1.9], [1.45, 2.65], [2.15, 2.3], 8), ...bez([2.15, 3.65], [1.45, 4.0], [0.75, 3.25], [0.1, 3.6], 8)];
  s += slabY(flag, -0.07, 0.14, c);
  return s;
});
icon('swimlane', 'Tor / uczestnik procesu', 'Swimlane / pool', (c) => {
  let s = shadow(c, 2.5);
  s += box(-1.95, -1.7, 0, 3.9, 3.4, 0.2, c, { mat: 'soft', r: 0.12 });
  s += faceT(-1.95, -1.7, 0, 3.9, 3.4, 0.2, R(0, 0, 0.8, 3.4, c.mid, { rx: 0.1 }) + Ln([[0.8, 1.7], [3.9, 1.7]], c.pale, px(1.6), { cap: 'butt' }) + Ln([[2.0, 0.85], [2.9, 0.85], [2.9, 2.55]], c.dark, px(1.6)));
  s += box(-0.75, -1.3, 0.2, 1.2, 0.9, 0.35, c, { r: 0.12 });
  s += cyl(0.95, 0.85, 0.2, 0.5, 0.35, c);
  return s;
});
