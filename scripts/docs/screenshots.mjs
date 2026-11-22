#!/usr/bin/env node
// Takes the documentation screenshots (docs/screenshots/<lang>-<name>.png)
// from a running ArchFlow instance, in Polish and English, using the demo
// diagram from demo-diagram.mjs.
//
// Usage:
//   1. Start a throwaway ArchFlow with empty storage, e.g.
//        docker run -d --rm --name archflow-docs -p 9599:80 \
//          -v "$(mktemp -d):/data/diagrams" ghcr.io/cyryllo/archflow:latest
//   2. APP_URL=http://localhost:9599 CHROME=/path/to/chrome \
//        node scripts/docs/screenshots.mjs [--only name1,name2] [--lang pl]
//
// The script saves the demo diagram into that instance's storage, so don't
// point it at an instance with real data.

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { buildDemo } from './demo-diagram.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'docs/screenshots');
const APP_URL = (process.env.APP_URL || 'http://localhost:9599').replace(/\/$/, '');
const CHROME = process.env.CHROME || 'chromium';
const W = 1920, H = 1080;
const PORT = 9335;
const ZOOM_IN_STEPS = Number(process.env.ZOOM_IN_STEPS ?? 5);

const args = process.argv.slice(2);
const argVal = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const only = argVal('--only')?.split(',');
const langs = argVal('--lang') ? [argVal('--lang')] : ['en', 'pl'];
// Which sets to take: 'docs' (README/site) and/or 'quickstart' (quick start guide)
const sets = (argVal('--set') ?? 'docs,quickstart').split(',');

// ---------------------------------------------------------------------------
// Minimal Chrome DevTools Protocol client

const profile = mkdtempSync(join(tmpdir(), 'archflow-shots-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  `--window-size=${W},${H}`, 'about:blank'
], { stdio: 'ignore' });

let ws; let seq = 0; const pending = new Map();
const send = (method, params = {}) => {
  return new Promise((res) => {
    const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
  });
};
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description);
  return r.result?.result?.value;
};

async function connect() {
  for (let i = 0; i < 60; i++) {
    try {
      const page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page');
      if (page) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((r) => ws.addEventListener('open', r, { once: true }));
        ws.addEventListener('message', (ev) => {
          const msg = JSON.parse(ev.data);
          if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
          if (msg.method === 'Page.javascriptDialogOpening') {
            ws.send(JSON.stringify({ id: ++seq, method: 'Page.handleJavaScriptDialog', params: { accept: true } }));
          }
        });
        return;
      }
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error(`Chrome didn't start (CHROME=${CHROME})`);
}

const mouse = (type, x, y, o = {}) => {
  return send('Input.dispatchMouseEvent', { type, x, y, button: o.button ?? 'left', buttons: o.buttons ?? (type === 'mouseReleased' ? 0 : 1), clickCount: 1, modifiers: o.modifiers ?? 0 });
};
const move = (x, y, buttons = 0) => {
  return send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: buttons ? 'left' : 'none', buttons });
};
const click = async (x, y, o = {}) => {
  await move(x, y); await sleep(60);
  await mouse('mousePressed', x, y, o); await sleep(50);
  await mouse('mouseReleased', x, y, { ...o, buttons: 0 }); await sleep(250);
};
const rightClick = (x, y) => {
  return click(x, y, { button: 'right', buttons: 2 });
};
const drag = async (x1, y1, x2, y2, steps = 16) => {
  await move(x1, y1); await sleep(50);
  await mouse('mousePressed', x1, y1); await sleep(50);
  for (let i = 1; i <= steps; i++) { await move(x1 + ((x2 - x1) * i) / steps, y1 + ((y2 - y1) * i) / steps, 1); await sleep(20); }
  await mouse('mouseReleased', x2, y2); await sleep(250);
};
const key = async (k, code, keyCode, modifiers = 0) => {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: keyCode, modifiers });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: keyCode, modifiers });
  await sleep(250);
};
const esc = () => {
  return key('Escape', 'Escape', 27);
};

// Bounding box of the first visible element matching a selector (+ padding)
const box = (selector, pad = 0) => {
  return evaluate(`(() => {
    const els = [...document.querySelectorAll(${JSON.stringify(selector)})].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    const e = els[els.length - 1]; if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: Math.max(0, r.x - ${pad}), y: Math.max(0, r.y - ${pad}), width: Math.min(${W}, r.width + ${pad * 2}), height: Math.min(${H}, r.height + ${pad * 2}) };
  })()`);
};
// Union of several boxes
const union = (...bs) => {
  const list = bs.filter(Boolean);
  const x = Math.min(...list.map((b) => b.x)), y = Math.min(...list.map((b) => b.y));
  const r = Math.max(...list.map((b) => b.x + b.width)), btm = Math.max(...list.map((b) => b.y + b.height));
  return { x, y, width: Math.min(W, r) - x, height: Math.min(H, btm) - y };
};
// Centre of the element whose own text is exactly `text`
const textPos = (text, selector = 'body *') => {
  return evaluate(`(() => {
    const e = [...document.querySelectorAll(${JSON.stringify(selector)})].find((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() === ${JSON.stringify(text)}));
    if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
};
const clickText = async (text, selector) => {
  const p = await textPos(text, selector);
  if (!p) throw new Error(`Text not found: ${text}`);
  await click(p.x, p.y);
};

let lang = 'en';
const shoot = async (name, clip) => {
  if (only && !only.includes(name)) return;
  const params = { format: 'png' };
  if (clip) params.clip = { ...clip, scale: 1 };
  const r = await send('Page.captureScreenshot', params);
  const file = join(OUT, `${lang}-${name}.png`);
  writeFileSync(file, Buffer.from(r.result.data, 'base64'));
  console.log('saved', file);
};
const want = (name) => {
  return !only || only.includes(name);
};

// ---------------------------------------------------------------------------

const L = {
  en: { save: 'Save', saveCurrent: 'Save Current Diagram', server: 'Server', database: 'Database', nameWeb: 'Web server', nameDb: 'Customer database', zoneText: 'Production', diagramName: 'My first diagram', cancel: 'Cancel', load: 'Load', myDiagrams: 'My diagrams', settings: 'Settings', exportJson: 'Export as JSON', exportImage: 'Export as image', orders: 'Orders', db: 'Orders DB', dbFull: 'Orders DB', payments: 'Payments', queue: 'Event queue' },
  pl: { save: 'Zapisz', saveCurrent: 'Zapisz bieżący diagram', server: 'Serwer', database: 'Baza danych', nameWeb: 'Serwer WWW', nameDb: 'Baza klientów', zoneText: 'Produkcja', diagramName: 'Mój pierwszy diagram', cancel: 'Anuluj', load: 'Wczytaj', myDiagrams: 'Moje diagramy', settings: 'Ustawienia', exportJson: 'Eksportuj do JSON', exportImage: 'Eksportuj do obrazu', orders: 'Zamówienia', db: 'Baza zamówień', dbFull: 'Baza zamówień', payments: 'Płatności', queue: 'Kolejka zdarzeń' }
};

async function api(path, init) {
  const r = await fetch(`${APP_URL}/api${path}`, init);
  return r.ok ? r.json() : null;
}

// Start from a clean instance: only this language's demo in storage, empty
// browser state, then open the demo through "My diagrams" (as a user would)
async function openFresh(l) {
  const demo = buildDemo(l);
  const list = (await api('/diagrams')) ?? [];
  for (const d of list) await api(`/diagrams/${encodeURIComponent(d.id)}`, { method: 'DELETE' });
  await api('/diagrams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...demo, name: demo.title })
  });

  await send('Page.navigate', { url: `${APP_URL}/` });
  await sleep(1200);
  await evaluate(`localStorage.clear(); localStorage.setItem('i18nextLng', '${l === 'pl' ? 'pl-PL' : 'en-US'}'); true`);
  await send('Page.reload');
  await sleep(3000);

  await clickText(L[l].myDiagrams, 'button, button *');
  await sleep(1000);
  await clickText(L[l].load, '.diagram-manager button');
  await sleep(2500);
  await fitAndZoom();
}

async function fitAndZoom() {
  await key('!', 'Digit1', 49, 8); // Shift+1: fit the diagram on screen
  await sleep(800);
  // "Fit" leaves generous margins; zoom in a few steps so labels are readable
  for (let i = 0; i < ZOOM_IN_STEPS; i++) await key('=', 'Equal', 187, 2);
  await sleep(600);
  await move(W / 2, 20); // park the mouse on the top bar, off the drawing
  await sleep(300);
}

// Item panel (a MUI Card) docked on the left under the top row
const panelBox = () => {
  return evaluate(`(() => {
    const c = [...document.querySelectorAll('.MuiCard-root')].map((e) => e.getBoundingClientRect())
      .filter((r) => r.top > 110 && r.left < 400 && r.height > 120).sort((a, b) => b.height - a.height)[0];
    return c ? { x: Math.max(0, c.x - 16), y: c.y - 16, width: c.width + 32, height: Math.min(${H} - c.y + 16, c.height + 32) } : null;
  })()`);
};
// Screen position of a node's icon (its label box sits above it)
const nodePos = async (name) => {
  const p = await textPos(name);
  return p ? { x: p.x, y: p.y + Number(process.env.NODE_DY ?? 48) } : null;
};
const menuBox = () => {
  return box('.MuiPopover-paper', 12);
};
const openMainMenu = async () => {
  await click(61, 86);
  await sleep(400);
};
const menuItem = async (text) => {
  await clickText(text, '.MuiPopover-paper *');
  await sleep(900);
};

async function run(l) {
  lang = l;
  const t = L[l];
  await openFresh(l);

  await shoot('editor');
  await shoot('toolbar', { x: 0, y: 0, width: W, height: 122 });

  if (want('main-menu')) {
    await openMainMenu();
    await shoot('main-menu', union({ x: 30, y: 60, width: 60, height: 60 }, await menuBox()));
    await esc();
  }

  if (want('context-canvas')) {
    await rightClick(W * 0.5, H * 0.86);
    await sleep(400);
    await shoot('context-canvas', await menuBox());
    await esc();
  }

  if (want('context-node')) {
    const p = await nodePos(t.orders);
    await rightClick(p.x, p.y);
    await sleep(400);
    const m = await menuBox();
    await shoot('context-node', union(m, { x: p.x - 120, y: p.y - 90, width: 240, height: 140 }));
    await esc();
  }

  if (want('icon-picker')) {
    await key('n', 'KeyN', 78);
    await sleep(900);
    await shoot('icon-picker', await panelBox());
    await esc();
  }

  if (want('node-panel')) {
    const p = await nodePos(t.db);
    await click(p.x, p.y);
    await sleep(800);
    await shoot('node-panel', await panelBox());
    await esc();
  }

  if (want('connector-panel')) {
    // Middle of the line from "Orders" to "Orders DB"
    const a = await nodePos(t.orders), b = await nodePos(t.dbFull);
    await click((a.x + b.x) / 2, (a.y + b.y) / 2 + 4);
    await sleep(800);
    await shoot('connector-panel', await panelBox());
    await esc();
  }

  if (want('selection')) {
    const top = await textPos(t.payments), left = await textPos(t.orders), bottom = await textPos(t.queue);
    await drag(left.x - 90, top.y - 40, top.x + 190, bottom.y + 120);
    await sleep(500);
    await move(W / 2, 20);
    // Crop to the diagram itself (the full window is mostly empty canvas)
    const names = Object.values(buildDemo(l).items).map((i) => i.name);
    const pts = (await Promise.all(names.map((n) => textPos(n)))).filter(Boolean);
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const x = Math.max(0, Math.min(...xs) - 260), y = Math.max(0, Math.min(...ys) - 90);
    await shoot('selection', { x, y, width: Math.min(W - x, Math.max(...xs) + 200 - x), height: Math.min(H - y, Math.max(...ys) + 130 - y) });
    await esc();
  }

  if (want('app-storage')) {
    await clickText(t.myDiagrams, 'button, button *');
    await sleep(1000);
    await shoot('app-storage', await box('.diagram-manager', 0));
    await click(...(await evaluate(`(() => { const r = document.querySelector('.diagram-manager .close-button').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`)));
  }

  if (want('export-file')) {
    await openMainMenu();
    await menuItem(t.exportJson);
    await shoot('export-file', await box('.dialog', 0));
    await clickText(t.cancel, '.dialog button');
  }

  if (want('export-image')) {
    await openMainMenu();
    await menuItem(t.exportImage);
    await sleep(1500);
    await shoot('export-image', await box('.MuiDialog-paper', 0));
    await esc();
  }

  if (want('settings')) {
    await openMainMenu();
    await menuItem(t.settings);
    await shoot('settings', await box('.MuiDialog-paper', 0));
    await esc();
  }

  if (want('help')) {
    await key('F1', 'F1', 112);
    await sleep(700);
    await shoot('help', await box('.MuiDialog-paper', 0));
    await esc();
  }
}


// ---------------------------------------------------------------------------
// Quick start guide: build a small diagram from an empty canvas, step by step.
// Saved as docs/screenshots/<lang>-qs-<step>.png

const typeText = async (text) => {
  await send('Input.insertText', { text });
  await sleep(300);
};

async function openEmpty(l) {
  const list = (await api('/diagrams')) ?? [];
  for (const d of list) await api(`/diagrams/${encodeURIComponent(d.id)}`, { method: 'DELETE' });
  await send('Page.navigate', { url: `${APP_URL}/` });
  await sleep(1200);
  await evaluate(`localStorage.clear(); localStorage.setItem('i18nextLng', '${l === 'pl' ? 'pl-PL' : 'en-US'}'); true`);
  await send('Page.reload');
  await sleep(3000);
  await move(W / 2, 20);
}

async function quickstart(l) {
  lang = l;
  const t = L[l];
  await openEmpty(l);
  // Points on the canvas (one tile on screen to the right = 141.5 px at 100%)
  const A = { x: 820, y: 600 };
  const B = { x: A.x + 283, y: A.y };
  const area = { x: 420, y: 300, width: 1080, height: 520 };
  const withPanel = { x: 0, y: 60, width: 1500, height: 900 };

  await shoot('qs-empty');

  // Add a node: N, pick "Server", click the canvas
  await key('n', 'KeyN', 78);
  await sleep(900);
  await shoot('qs-picker', withPanel);
  await clickText(t.server, '.MuiCard-root *');
  await sleep(300);
  await click(A.x, A.y);
  await sleep(700);
  await move(W / 2, 20);
  await shoot('qs-node', area);

  // Name it: click the node, F2, type
  await click(A.x, A.y);
  await sleep(700);
  await key('F2', 'F2', 113);
  await sleep(300);
  await key('a', 'KeyA', 65, 2);
  await typeText(t.nameWeb);
  await move(W / 2, 20);
  await shoot('qs-name', withPanel);
  await esc();

  // Second node: a database next to it (found with the picker's search)
  await key('n', 'KeyN', 78);
  await sleep(900);
  await evaluate(`(() => { const el = [...document.querySelectorAll('.MuiCard-root input')].find((e) => e.offsetParent && e.type !== 'file' && e.type !== 'checkbox'); el?.focus(); return !!el; })()`);
  await typeText(t.database);
  await sleep(500);
  await clickText(t.database, '.MuiCard-root *');
  await sleep(300);
  await click(B.x, B.y);
  await sleep(700);
  await click(B.x, B.y);
  await sleep(600);
  await key('F2', 'F2', 113);
  await key('a', 'KeyA', 65, 2);
  await typeText(t.nameDb);
  await esc();

  // Zone: R and drag a rectangle around both nodes
  await key('r', 'KeyR', 82);
  await sleep(300);
  await drag(A.x - 141, A.y, B.x + 141, B.y);
  await sleep(500);
  await esc();
  await move(W / 2, 20);
  await shoot('qs-zone', area);

  // Connect: C, click the first node, then the second
  await key('c', 'KeyC', 67);
  await sleep(300);
  await click(A.x, A.y);
  await sleep(300);
  await click(B.x, B.y);
  await sleep(500);
  await esc();
  await move(W / 2, 20);
  await shoot('qs-connect', area);

  // Text: T, click below the zone, type into its panel
  await key('t', 'KeyT', 84);
  await sleep(400);
  await click(A.x + 40, A.y + 250);
  await sleep(800);
  await evaluate(`(() => { const el = [...document.querySelectorAll('.MuiCard-root input, .MuiCard-root textarea')].find((e) => e.offsetParent); el?.focus(); el?.select?.(); return !!el; })()`);
  await key('a', 'KeyA', 65, 2);
  await typeText(t.zoneText);
  await move(W / 2, 20);
  await shoot('qs-text', withPanel);
  await esc();

  // Select and move: box around everything, then drag it a bit
  // (the box must enclose the whole zone for it to be selected too)
  await drag(A.x - 250, A.y - 235, B.x + 250, A.y + 330);
  await sleep(400);
  await drag(A.x, A.y, A.x + 120, A.y + 40);
  await sleep(600);
  await move(W / 2, 20);
  await shoot('qs-move', { x: area.x, y: area.y, width: area.width + 160, height: area.height + 140 });
  await esc();

  // Save: top bar Save -> My diagrams -> name it
  await clickText(t.save, '.toolbar button, .toolbar button *');
  await sleep(1000);
  await clickText(t.saveCurrent, '.diagram-manager button');
  await sleep(600);
  await evaluate(`(() => { const el = document.querySelector('.diagram-manager input'); el?.focus(); el?.select(); return !!el; })()`);
  await typeText(t.diagramName);
  await shoot('qs-save', await box('.diagram-manager', 0));
  await key('Enter', 'Enter', 13);
  await sleep(1200);
  await evaluate(`(() => { const b = document.querySelector('.diagram-manager .close-button'); b?.click(); return !!b; })()`);
  await sleep(600);
  await move(W / 2, 20);
  await shoot('qs-saved', { x: 0, y: 0, width: 560, height: 56 });
}

try {
  mkdirSync(OUT, { recursive: true });
  await connect();
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  for (const l of langs) {
    if (sets.includes('docs')) await run(l);
    if (sets.includes('quickstart')) await quickstart(l);
  }
} finally {
  ws?.close();
  const exited = new Promise((r) => chrome.once('exit', r));
  chrome.kill();
  await Promise.race([exited, sleep(3000)]);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch { /* temp profile, fine to leave behind */ }
}
