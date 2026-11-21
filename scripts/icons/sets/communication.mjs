// Communication

import {
  set, shadow, band, box, prism, slabY, slabX, cyl, frustum, sphere, dome, loft, extrude, rrect, circle, arc, thick,
  faceL, faceR, faceT, onL, onR, onT, onG, onB, onPlane, reserve, wire, dotAt,
  px, R, Ci, Ln, Pg, Pa, rows
} from '../iso.mjs';
import { display, ledRow, arrow, waves, envelope, bubble, phone } from '../parts.mjs';

const icon = set('af-communication');

icon('mail', 'E-mail', 'E-mail', (c) => {
  return shadow(c, 2.1) + envelope(c, -1.8, 0, 3.6, 2.45, -0.15, 0.3);
});

icon('mailmultiple', 'Wiele e-maili', 'Multiple e-mails', (c) => {
  let s = shadow(c, 2.3);
  for (let i = 0; i < 3; i++) s += envelope(c, -1.6, 0, 3.2, 2.2, -1.1 + i * 0.85, 0.24);
  return s;
});

icon('speech', 'Wiadomość / czat', 'Message / chat', (c) => {
  let s = shadow(c, 1.9);
  s += slabY(bubble(-1.75, 0.8, 3.5, 2.3, 0.5, -1.0), -0.28, 0.56, c);
  s += onL(-1.75, 0.28, 3.1, ledRow(0.95, 1.15, 3, 0.8, c.white, 0.2));
  return s;
});

icon('chat-group', 'Rozmowa grupowa', 'Group chat', (c) => {
  let s = shadow(c, 2.2);
  s += slabY(bubble(-0.7, 1.55, 2.6, 1.75, 0.4, 1.0, 0.45, 0.5, 0.6), -0.9, 0.45, c, { mat: 'soft' });
  s += onL(-0.7, -0.45, 3.3, rows(0.5, 0.6, 1.6, 0.42, 2, c.pale, px(2.2)));
  s += slabY(bubble(-1.9, 0.75, 2.7, 1.8, 0.4, -1.3, 0.5, 0.6), 0.3, 0.45, c);
  s += onL(-1.9, 0.75, 2.55, ledRow(0.72, 0.9, 3, 0.63, c.white, 0.17));
  return s;
});

icon('sms', 'SMS', 'SMS / text message', (c) => {
  let s = shadow(c, 2.1);
  s += phone(c, -1.75, -0.7, 1.8, 3.3, Ln([[0.65, 0.42], [1.15, 0.42]], c.dark, px(2)) + R(0.3, 0.75, 0.85, 0.4, c.dark, { rx: 0.12 }) + R(0.3, 1.3, 0.6, 0.4, c.dark, { rx: 0.12 }));
  s += slabY(bubble(-0.55, 1.0, 2.45, 1.6, 0.35, -0.15, 0.5, 0.6), 0.45, 0.4, c, { mat: 'soft', cap: c.white });
  s += onL(-0.55, 0.85, 2.6, rows(0.45, 0.55, 1.55, 0.4, 2, c.mid, px(2.4)));
  return s;
});

icon('push', 'Powiadomienie push', 'Push notification', (c) => {
  let s = shadow(c, 1.9);
  let f = '';
  for (let i = 0; i < 2; i++) f += R(0.3, 1.9 + i * 0.6, 1.04, 0.4, c.dark, { rx: 0.1 });
  s += phone(c, -1.2, -0.45, 1.9, 3.5, f + Ln([[0.6, 3.12], [1.05, 3.12]], c.pale, px(1.6)));
  s += slabY(rrect(-1.75, 2.0, 3.0, 1.0, 0.2), 0.35, 0.22, c, { mat: 'soft', cap: c.white });
  s += onL(-1.75, 0.57, 3.0, Ci(0.5, 0.5, 0.24, c.mid) + rows(1.0, 0.36, 1.6, 0.3, 2, c.pale, px(2)));
  return s;
});

icon('notification', 'Powiadomienie / alert', 'Notification / alert', (c) => {
  let s = shadow(c, 1.9);
  s += sphere(0, 0, 0.36, 0.34, c, { mat: 'deep' });
  s += frustum(0, 0, 0.45, 1.6, 0.74, 1.75, c);
  s += band(0, 0, 0.72, 1.48, c.main.seam, 0.9);
  s += dome(0, 0, 2.2, 0.74, c, { seam: true });
  s += sphere(0, 0, 3.2, 0.2, c, { mat: 'soft' });
  s += onB(0, 0, 2.1, waves(0, 0, [1.55, 1.95], -25, 25, c.mid, px(2)) + waves(0, 0, [1.55, 1.95], 155, 205, c.mid, px(2)));
  return s;
});

icon('megaphone', 'Ogłoszenie / megafon', 'Broadcast / megaphone', (c) => {
  let s = shadow(c, 1.9);
  const ring = (r, y) => circle(0, 0, r, 28).map(([x, z]) => [x, y, 1.75 + z]);
  s += slabY(circle(0, 1.75, 0.5, 18), -1.55, 0.4, c, { mat: 'deep' });
  s += box(-0.2, -0.75, 0, 0.4, 0.5, 1.35, c, { mat: 'deep', r: 0.1 });
  s += loft(ring(1.4, 1.3), ring(0.42, -1.2), c, { cap: c.main.right });
  s += onL(0, 1.3, 1.75, Ci(0, 0, 1.13, c.night) + Ci(0, 0, 0.4, c.dark) + Pa('M-0.85,-0.2A0.9,0.9 0 0 1 -0.2,-0.85', 'none', { stroke: c.pale, sw: px(1.6), op: 0.6 }));
  return s;
});

icon('phone', 'Telefon / połączenie', 'Phone call', (c) => {
  let s = shadow(c, 2.2);
  const y0 = -1.25, z0 = 1.35, y1 = 1.3, z1 = 0.5;
  s += slabX([[y0, 0], [y1, 0], [y1, z1], [y0, z0]], -1.75, 3.5, c, { crease: 2 });
  const len = Math.hypot(y1 - y0, z1 - z0);
  const V = [0, (y1 - y0) / len, (z1 - z0) / len], N = [0, (z0 - z1) / len, (y1 - y0) / len];
  let f = R(1.75, 0.3, 1.4, 0.5, c.night, { rx: 0.08 });
  for (let r = 0; r < 3; r++) f += ledRow(2.0, 1.2 + r * 0.45, 3, 0.45, c.white, 0.13);
  s += onPlane([-1.75, y0, z0], [1, 0, 0], V, f);
  // handset lying in its cradle
  const at = (u, v, lift) => [-1.75 + u, y0 + V[1] * v + N[1] * lift, z0 + V[2] * v + N[2] * lift];
  s += extrude(rrect(0.25, 0.2, 0.95, 2.25, 0.3).map(([u, v]) => at(u, v, 0.42)), [0, -N[1] * 0.42, -N[2] * 0.42], c, { mat: 'deep' });
  return s;
});

icon('webhook', 'Webhook', 'Webhook', (c) => {
  let s = shadow(c, 1.6);
  const hook = [[0.75, 2.75], [0.75, 1.2], ...arc(-0.1, 1.2, 0.85, 0, -180, 12).slice(1), [-0.95, 1.7]];
  s += slabY(thick(hook, 0.56), -0.28, 0.56, c);
  s += slabY([[-1.6, 1.65], [-0.3, 1.65], [-0.95, 2.6]], -0.28, 0.56, c);
  s += slabY(thick(arc(0.75, 3.2, 0.5, -70, 250, 16), 0.34), -0.28, 0.56, c, { mat: 'soft' });
  return s;
});

icon('queue', 'Kolejka komunikatów', 'Message queue', (c) => {
  let s = shadow(c, 2.4);
  s += box(-1.55, -1.95, 0, 3.1, 3.9, 0.16, c, { mat: 'deep', r: 0.12 });
  for (let i = 0; i < 4; i++) s += envelope(c, -1.25, 0.16, 2.5, 1.65, -1.6 + i * 0.95, 0.2);
  return s;
});

icon('event-bus', 'Szyna zdarzeń / temat', 'Event bus / topic', (c) => {
  let s = shadow(c, 2.3, 0, 0, 1.5);
  s += box(-1.95, -0.45, 0, 3.9, 0.9, 0.5, c, { mat: 'deep', r: 0.2 });
  s += faceL(-1.95, -0.45, 0, 3.9, 0.9, 0.5, ledRow(0.5, 0.25, 8, 0.42, c.pale, 0.07));
  ['soft', 'main', 'soft'].forEach((mat, i) => {
    const x = -1.25 + i * 1.25, z = 1.1 + (i === 1 ? 0.5 : 0);
    s += cyl(x, 0, 0.5, 0.1, z - 0.5, c, { mat: 'soft' });
    s += box(x - 0.45, -0.45, z, 0.9, 0.9, 0.9, c, { mat, r: 0.1 });
  });
  return s;
});

icon('video-call', 'Wideorozmowa', 'Video call', (c) => {
  let s = shadow(c, 2.1);
  s += slabY(rrect(-1.85, 0, 3.7, 2.8, 0.2), -0.12, 0.24, c);
  const f = Ci(1.5, 1.05, 0.48, c.pale) + Pa('M0.55,2.52a0.95,0.95 0 0 1 1.9,0z', c.pale)
    + R(2.4, 0.3, 0.86, 0.66, c.mid, { rx: 0.08 }) + Ci(2.83, 0.56, 0.14, c.glow) + Ci(2.83, 2.1, 0.22, c.white);
  s += onL(-1.85, 0.12, 2.8, display(0.14, 0.14, 3.42, 2.52, c, f, 0.1));
  return s;
});

icon('newsletter', 'Newsletter / biuletyn', 'Newsletter', (c) => {
  let s = shadow(c, 1.9);
  s += slabY(rrect(-1.5, 0, 3.0, 3.3, 0.06), -0.1, 0.2, c, { cap: c.white });
  s += onL(-1.5, 0.1, 3.3, R(0.25, 0.25, 2.5, 0.55, c.mid, { rx: 0.06 }) + R(0.25, 1.05, 1.1, 1.0, c.tint, { rx: 0.06 })
    + rows(1.6, 1.15, 1.15, 0.27, 4, c.pale, px(1.6)) + rows(0.25, 2.35, 2.5, 0.27, 3, c.pale, px(1.6)));
  return s;
});

icon('rss', 'Kanał RSS / feed', 'RSS / feed', (c) => {
  let s = shadow(c, 1.8);
  s += slabY(rrect(-1.4, 0, 2.8, 2.8, 0.5, 3), -0.3, 0.6, c);
  const o = { stroke: c.white, sw: px(3.4) };
  s += onL(-1.4, 0.3, 2.8, Ci(0.78, 2.02, 0.24, c.white) + Pa('M0.62,1.32a0.86,0.86 0 0 1 0.86,0.86', 'none', o) + Pa('M0.62,0.62a1.56,1.56 0 0 1 1.56,1.56', 'none', o));
  return s;
});

icon('inbox', 'Skrzynka odbiorcza', 'Inbox', (c) => {
  let s = shadow(c, 2.3);
  s += box(-1.75, -1.3, 0, 3.5, 2.6, 0.95, c, { r: 0.15 });
  s += faceT(-1.75, -1.3, 0, 3.5, 2.6, 0.95, R(0.22, 0.22, 3.06, 2.16, c.night, { rx: 0.1 }));
  s += envelope(c, -1.25, 0.75, 2.5, 1.65, -0.35, 0.2);
  s += envelope(c, -1.25, 0.6, 2.5, 1.65, 0.3, 0.2);
  s += box(-1.75, 1.0, 0, 3.5, 0.3, 0.95, c, { r: 0.1 });
  s += faceL(-1.75, 1.0, 0, 3.5, 0.3, 0.95, arrow(1.75, 0.2, 1.75, 0.75, c.white, px(2.2), 0.25));
  return s;
});

icon('chatbot', 'Chatbot / asystent', 'Chatbot / assistant', (c) => {
  let s = shadow(c, 2.0);
  s += cyl(0, 0, 0, 1.05, 0.28, c, { mat: 'deep' }) + cyl(0, 0, 0.28, 0.45, 0.45, c, { mat: 'deep' });
  s += box(-1.4, -1.05, 0.73, 2.8, 2.1, 2.0, c, { r: 0.4, steps: 3 });
  s += faceL(-1.4, -1.05, 0.73, 2.8, 2.1, 2.0, R(0.42, 0.42, 1.96, 1.0, c.night, { rx: 0.35 }) + Ci(0.98, 0.92, 0.2, c.glow) + Ci(1.82, 0.92, 0.2, c.glow)
    + Ln([[1.1, 1.65], [1.7, 1.65]], c.white, px(2)));
  s += cyl(0, 0, 2.73, 0.07, 0.5, c, { mat: 'deep' }) + sphere(0, 0, 3.3, 0.2, c, { mat: 'soft' });
  return s;
});
