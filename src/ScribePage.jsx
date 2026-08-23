/* eslint-disable */
// ─────────────────────────────────────────────────────────────────────────────
// ScribePage.jsx — stylus study page (KJV only, portrait, fixed printed page)
//
// Usage from DailyBibleApp.jsx:
//   import ScribePage from "./ScribePage";
//   {scribeOpen && (
//     <ScribePage supabase={supabase} user={user}
//                 initialBook="1 John" initialChapter={1}
//                 onExit={() => setScribeOpen(false)} />
//   )}
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import defaultClient from "./supabaseClient";

// ─── PAGE GEOMETRY (A4 portrait at 150 units/inch) ───────────────────────────
// Everything inside the page is measured in these units and the whole page is
// scaled to the device with one CSS transform. Identical on every screen.
const PAGE_W = 1240;
const PAGE_H = 1754;
const UPP    = PAGE_W / 595.28;          // units per typographic point
const MARGIN = 96;
const CONTENT_W = PAGE_W - MARGIN * 2;
const TEXT_W = Math.round(CONTENT_W * 0.4);
const GUTTER = 40;
const RULE_X0 = MARGIN + TEXT_W + GUTTER;
const RULE_X1 = PAGE_W - MARGIN;
const TEXT_H = PAGE_H - MARGIN * 2;
const FONT_PT = 10;
const FONT_SIZE = FONT_PT * UPP;         // ≈ 20.8 units = physical 10pt
const LINE_H = FONT_SIZE * 1.5;
const RULE_GAP = 36;                     // narrow-ruled, ~6mm at print size
const RASTER = 2;                        // canvas backing resolution multiplier
const RAIL_W = 96;                       // vertical tool rail
const BAR_H  = 52;                       // compact top bar

// ─── PALETTE (taken from the reference page) ─────────────────────────────────
const PAPER  = "var(--parchment)";
const INK    = "var(--ink)";
const ACCENT = "var(--gold)";
const RULE   = "var(--border)";
const CHROME = "var(--parchment-dark)";

// Stroke colour is stored as an index into this array, never as a hex string.
// Index 0 is the theme's own ink colour, resolved at draw time so notes stay
// legible in both light and dark mode. The rest are fixed mid-tones that read
// on either paper.
const PEN_COLOURS = [
  null, "#297373", "#8C3A3A", "#4F7A34",
  "#2F4F7F", "#9A6B2F", "#7A4E8C", "#8A8378",
];
const PEN_WIDTHS = [1.6, 3.0, 5.5];      // in page units, before pressure
const ERASER_R   = [12, 26, 52];         // circle eraser radius, same S/M/L control
const HL_COLOURS = ["#F2D14E", "#9BD98C", "#F2A6C2", "#8FC7E8", "#F0A868"];
const HL_WIDTHS  = [16, 26, 40];         // highlighter nib, no pressure response
const HL_ALPHA   = 0.33;

const FONT_STACK = "'Lato', sans-serif";   // same face as the reading app

const CHAPTER_COUNTS = {
  "Genesis":50,"Exodus":40,"Leviticus":27,"Numbers":36,"Deuteronomy":34,"Joshua":24,
  "Judges":21,"Ruth":4,"1 Samuel":31,"2 Samuel":24,"1 Kings":22,"2 Kings":25,
  "1 Chronicles":29,"2 Chronicles":36,"Ezra":10,"Nehemiah":13,"Esther":10,"Job":42,
  "Psalms":150,"Proverbs":31,"Ecclesiastes":12,"Song of Solomon":8,"Isaiah":66,
  "Jeremiah":52,"Lamentations":5,"Ezekiel":48,"Daniel":12,"Hosea":14,"Joel":3,
  "Amos":9,"Obadiah":1,"Jonah":4,"Micah":7,"Nahum":3,"Habakkuk":3,"Zephaniah":3,
  "Haggai":2,"Zechariah":14,"Malachi":4,"Matthew":28,"Mark":16,"Luke":24,"John":21,
  "Acts":28,"Romans":16,"1 Corinthians":16,"2 Corinthians":13,"Galatians":6,
  "Ephesians":6,"Philippians":4,"Colossians":4,"1 Thessalonians":5,"2 Thessalonians":3,
  "1 Timothy":6,"2 Timothy":4,"Titus":3,"Philemon":1,"Hebrews":13,"James":5,
  "1 Peter":5,"2 Peter":3,"1 John":5,"2 John":1,"3 John":1,"Jude":1,"Revelation":22,
};
const BOOKS = Object.keys(CHAPTER_COUNTS);

// ─── INDEXEDDB (local-first write target, ~50 lines, no dependency) ──────────
const DB_NAME = "scribe", STORE = "pages";
const LINKS_KEY = "word-links";   // whole link list under one key
let _dbp = null;
function db() {
  if (_dbp) return _dbp;
  _dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return _dbp;
}
async function idbGet(key) {
  const d = await db();
  return new Promise((res, rej) => {
    const rq = d.transaction(STORE, "readonly").objectStore(STORE).get(key);
    rq.onsuccess = () => res(rq.result || null);
    rq.onerror = () => rej(rq.error);
  });
}
async function idbSet(key, val) {
  const d = await db();
  return new Promise((res, rej) => {
    const tx = d.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(val, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
async function idbDirtyKeys() {
  const d = await db();
  return new Promise((res) => {
    const out = [];
    const rq = d.transaction(STORE, "readonly").objectStore(STORE).openCursor();
    rq.onsuccess = () => {
      const c = rq.result;
      if (!c) return res(out);
      if (c.value && c.value.dirty) out.push({ key: c.key, ...c.value });
      c.continue();
    };
    rq.onerror = () => res(out);
  });
}

// ─── STROKE SIMPLIFICATION (Douglas–Peucker on x/y) ──────────────────────────
function perpDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
  const cx = a[0] + t * dx, cy = a[1] + t * dy;
  return Math.hypot(p[0] - cx, p[1] - cy);
}
// Iterative rather than recursive: at the current sampling density a long,
// slow stroke can run to thousands of points and blow the call stack.
function simplify(pts, eps = 0.4) {
  const n = pts.length;
  if (n < 3) return pts;
  const keep = new Uint8Array(n);
  keep[0] = 1; keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = perpDist(pts[i], pts[a], pts[b]);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (idx >= 0 && maxD > eps) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(pts[i]);
  return out;
}
// One decimal on coordinates: at 2x raster a whole page unit is two device
// pixels, so integers were visibly quantising the curves.
function compress(pts) {
  return simplify(pts).map(p => [
    Math.round(p[0] * 10) / 10,
    Math.round(p[1] * 10) / 10,
    Math.round(p[2] * 100) / 100,
  ]);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const scripturePageKey = (book, ch, pageIdx) => `${book}:${ch}:p${pageIdx + 1}`;
const wordPageKey = (book, ch, v, start) => `word:${book}-${ch}-${v}-${start}`;

function tokenize(text) {
  const out = []; const re = /\S+/g; let m;
  while ((m = re.exec(text)) !== null) out.push({ w: m[0], s: m.index, e: m.index + m[0].length });
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// INK LAYER — one transparent canvas over the whole page
// ─────────────────────────────────────────────────────────────────────────────
function InkLayer({ pageKey, supabase, user, tool, eraseMode, colour, hlColour, width, inkColour, onWordHit, onSwipe, onPan }) {
  const canvasRef = useRef(null);
  const strokesRef = useRef([]);
  const historyRef = useRef([]);
  const drawingRef = useRef(null);
  const saveTimer = useRef(null);
  const swipeRef = useRef(null);
  const [overlay, setOverlay] = useState(null);   // live eraser shape
  const [, force] = useState(0);

  const ctx = () => canvasRef.current?.getContext("2d");

  const redraw = useCallback(() => {
    const c = ctx(); if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, PAGE_W * RASTER, PAGE_H * RASTER);
    c.scale(RASTER, RASTER);
    c.lineCap = "round"; c.lineJoin = "round";
    // highlighter first so ink always sits on top of it
    const ordered = [...strokesRef.current].sort((a, b) => (a.h ? 0 : 1) - (b.h ? 0 : 1));
    for (const s of ordered) drawStroke(c, s);
    // inkColour must be a dependency: colour 0 follows the theme, and a stale
    // closure here repaints every theme-ink stroke in the old colour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inkColour]);

  function drawStroke(c, s) {
    const pts = s.p;

    if (s.h) {                                   // highlighter: flat, translucent
      c.save();
      c.globalAlpha = HL_ALPHA;
      c.globalCompositeOperation = "multiply";
      c.strokeStyle = HL_COLOURS[s.c] || HL_COLOURS[0];
      c.lineWidth = s.w;
      c.lineCap = "round"; c.lineJoin = "round";
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      if (pts.length === 1) c.lineTo(pts[0][0] + 0.01, pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        c.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      if (pts.length > 1) c.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      c.stroke();
      c.restore();
      return;
    }

    c.strokeStyle = PEN_COLOURS[s.c] || inkColour;
    if (pts.length === 1) {
      c.fillStyle = c.strokeStyle;
      c.beginPath();
      c.arc(pts[0][0], pts[0][1], (s.w * (pts[0][2] || 0.5)) / 1.4, 0, 6.2832);
      c.fill();
      return;
    }
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      c.lineWidth = s.w * (0.35 + 0.65 * ((a[2] + b[2]) / 2));
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
  }

  // ── load: local first, then reconcile with the server ────────────────────
  useEffect(() => {
    let cancelled = false;
    strokesRef.current = []; historyRef.current = []; redraw();
    (async () => {
      let local = null;
      try { local = await idbGet(pageKey); } catch {}
      if (!cancelled && local?.strokes) { strokesRef.current = local.strokes; redraw(); }
      if (!user) return;
      const { data } = await supabase
        .from("ink_pages").select("stroke_data, updated_at")
        .eq("user_id", user.id).eq("page_key", pageKey).maybeSingle();
      if (cancelled || !data) return;
      const remoteNewer = !local || new Date(data.updated_at) > new Date(local.updated_at || 0);
      if (remoteNewer && !local?.dirty) {
        strokesRef.current = data.stroke_data || [];
        redraw();
        idbSet(pageKey, { strokes: strokesRef.current, updated_at: data.updated_at, dirty: false });
      }
    })();
    return () => { cancelled = true; flush(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey, user?.id]);

  // ── save ─────────────────────────────────────────────────────────────────
  const persist = useCallback(async () => {
    const payload = {
      strokes: strokesRef.current,
      updated_at: new Date().toISOString(),
      dirty: true,
      meta: pageKeyMeta(pageKey),
    };
    try { await idbSet(pageKey, payload); } catch {}
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => syncOne(pageKey, payload, supabase, user), 3000);
  }, [pageKey, supabase, user?.id]);

  function flush() {
    clearTimeout(saveTimer.current);
    idbGet(pageKey).then(v => { if (v?.dirty) syncOne(pageKey, v, supabase, user); }).catch(() => {});
  }
  useEffect(() => {
    const h = () => flush();
    document.addEventListener("visibilitychange", h);
    window.addEventListener("pagehide", h);
    return () => {
      document.removeEventListener("visibilitychange", h);
      window.removeEventListener("pagehide", h);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  // ── input ────────────────────────────────────────────────────────────────
  function toPage(e) {
    const r = canvasRef.current.getBoundingClientRect();
    return [
      ((e.clientX - r.left) / r.width) * PAGE_W,
      ((e.clientY - r.top) / r.height) * PAGE_H,
    ];
  }

  function onPointerDown(e) {
    const isPen = e.pointerType === "pen" || e.pointerType === "mouse";

    // A touch that arrives mid-stroke is a palm. Ignore it completely.
    if (!isPen && drawingRef.current) return;

    // Word tapping: finger anywhere, or the pen while the link tool is active.
    if (!isPen || tool === "link") {
      const hit = findWord(e.clientX, e.clientY);
      if (hit) { onWordHit(hit, tool === "link"); return; }
      if (!isPen) {
        canvasRef.current.setPointerCapture(e.pointerId);
        swipeRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY };
        return;
      }
      return;
    }
    if (tool === "link") return;

    e.preventDefault();
    swipeRef.current = null;          // drop any pending palm/finger gesture
    canvasRef.current.setPointerCapture(e.pointerId);
    const [x, y] = toPage(e);
    const pr = e.pressure > 0 ? e.pressure : 0.5;

    if (tool === "eraser") {
      /* eslint-disable-next-line no-unused-expressions */
      if (eraseMode === "rect") {
        drawingRef.current = { rect: true, x0: x, y0: y, x1: x, y1: y };
        setOverlay({ type: "rect", x0: x, y0: y, x1: x, y1: y });
      } else {
        const r = eraseMode === "circle" ? ERASER_R[width] : 8;
        erase(x, y, r);
        drawingRef.current = { erasing: true };
        if (eraseMode === "circle") setOverlay({ type: "circle", x, y, r });
      }
      return;
    }

    historyRef.current.push(strokesRef.current);
    if (historyRef.current.length > 40) historyRef.current.shift();
    drawingRef.current = tool === "highlighter"
      ? { c: hlColour, w: HL_WIDTHS[width], h: 1, p: [[x, y, pr]] }
      : { c: colour, w: PEN_WIDTHS[width], p: [[x, y, pr]] };
    force(n => n + 1);
  }

  function onPointerMove(e) {
    // finger drag: pan when zoomed in, otherwise it becomes a page swipe.
    // Scoped to the pointer that began it, so a palm can't hijack the pen.
    const sw = swipeRef.current;
    if (sw && sw.id === e.pointerId) {
      if (onPan) { onPan(e.clientX - sw.x, e.clientY - sw.y); sw.x = e.clientX; sw.y = e.clientY; }
      return;
    }
    const d = drawingRef.current; if (!d) return;
    e.preventDefault();
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    if (d.rect) {
      const [x, y] = toPage(e);
      d.x1 = x; d.y1 = y;
      setOverlay({ type: "rect", x0: d.x0, y0: d.y0, x1: x, y1: y });
      return;
    }
    if (d.erasing) {
      const r = eraseMode === "circle" ? ERASER_R[width] : 8;
      for (const ev of events) { const [x, y] = toPage(ev); erase(x, y, r); }
      if (eraseMode === "circle") { const [x, y] = toPage(e); setOverlay({ type: "circle", x, y, r }); }
      return;
    }
    if (d.h) {
      for (const ev of events) {
        const [x, y] = toPage(ev);
        const a = d.p[d.p.length - 1];
        if (Math.hypot(x - a[0], y - a[1]) < 1.2) continue;
        d.p.push([x, y, 1]);
      }
      redraw();
      const c2 = ctx();
      c2.setTransform(RASTER, 0, 0, RASTER, 0, 0);
      drawStroke(c2, d);
      return;
    }

    const c = ctx();
    c.setTransform(RASTER, 0, 0, RASTER, 0, 0);
    c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = PEN_COLOURS[d.c] || inkColour;
    for (const ev of events) {
      const [x, y] = toPage(ev);
      const pr = ev.pressure > 0 ? ev.pressure : 0.5;
      const a = d.p[d.p.length - 1];
      if (Math.hypot(x - a[0], y - a[1]) < 0.3) continue;
      c.lineWidth = d.w * (0.35 + 0.65 * ((a[2] + pr) / 2));
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(x, y); c.stroke();
      d.p.push([x, y, pr]);
    }
  }

  function onPointerUp(e) {
    if (swipeRef.current && swipeRef.current.id === e.pointerId) {
      const { sx, sy } = swipeRef.current;
      swipeRef.current = null;
      if (onPan) return;                       // zoomed: that drag was a pan
      const dx = e.clientX - sx;
      const dy = Math.abs(e.clientY - sy);
      if (Math.abs(dx) > 90 && dy < 70) onSwipe(dx < 0 ? 1 : -1);
      return;
    }
    const d = drawingRef.current; if (!d) return;
    drawingRef.current = null;
    if (d.rect) { eraseRect(d.x0, d.y0, d.x1, d.y1); setOverlay(null); persist(); return; }
    if (d.erasing) { setOverlay(null); persist(); return; }
    strokesRef.current = [...strokesRef.current,
      d.h ? { c: d.c, w: d.w, h: 1, p: compress(d.p) } : { c: d.c, w: d.w, p: compress(d.p) }];
    redraw();
    persist();
    force(n => n + 1);
  }

  // Touch/circle: any stroke the cursor grazes is removed whole.
  function erase(x, y, R = 8) {
    const keep = strokesRef.current.filter(s => !s.p.some(p => Math.hypot(p[0] - x, p[1] - y) < R));
    if (keep.length !== strokesRef.current.length) {
      historyRef.current.push(strokesRef.current);
      strokesRef.current = keep;
      redraw();
    }
  }

  // Box: only strokes lying entirely inside the drawn rectangle are removed,
  // so a long stroke passing through the box survives.
  function eraseRect(ax, ay, bx, by) {
    const x0 = Math.min(ax, bx), x1 = Math.max(ax, bx);
    const y0 = Math.min(ay, by), y1 = Math.max(ay, by);
    if (x1 - x0 < 4 && y1 - y0 < 4) return;
    const keep = strokesRef.current.filter(
      s => !s.p.every(p => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1));
    if (keep.length !== strokesRef.current.length) {
      historyRef.current.push(strokesRef.current);
      strokesRef.current = keep;
      redraw();
      force(n => n + 1);
    }
  }

  // expose undo / clear to the toolbar
  useEffect(() => {
    const api = {
      undo: () => {
        if (!historyRef.current.length) return;
        strokesRef.current = historyRef.current.pop();
        redraw(); persist(); force(n => n + 1);
      },
      clear: () => {
        historyRef.current.push(strokesRef.current);
        strokesRef.current = []; redraw(); persist(); force(n => n + 1);
      },
      count: () => strokesRef.current.length,
    };
    window.__scribeInk = api;
    window.__scribeSync = (k, v) => syncOne(k, v, supabase, user);
    return () => { if (window.__scribeInk === api) delete window.__scribeInk; };
  }, [redraw, persist]);

  useEffect(() => { redraw(); }, [redraw, inkColour]);

  return (
    <>
    {overlay && (
      <div style={overlay.type === "circle"
        ? {
            position: "absolute", zIndex: 4, pointerEvents: "none",
            left: overlay.x - overlay.r, top: overlay.y - overlay.r,
            width: overlay.r * 2, height: overlay.r * 2, borderRadius: "50%",
            border: "1.5px solid var(--ink-light)", background: "rgba(128,128,128,.12)",
          }
        : {
            position: "absolute", zIndex: 4, pointerEvents: "none",
            left: Math.min(overlay.x0, overlay.x1), top: Math.min(overlay.y0, overlay.y1),
            width: Math.abs(overlay.x1 - overlay.x0), height: Math.abs(overlay.y1 - overlay.y0),
            border: "1.5px dashed var(--ink-light)", background: "rgba(128,128,128,.10)",
          }} />
    )}
    <canvas
      ref={canvasRef}
      width={PAGE_W * RASTER}
      height={PAGE_H * RASTER}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: "absolute", inset: 0, width: PAGE_W, height: PAGE_H,
        touchAction: "none", zIndex: 3, cursor: tool === "link" ? "pointer" : "crosshair",
      }}
    />
    </>
  );
}

function pageKeyMeta(pageKey) {
  if (pageKey.startsWith("word:")) return { kind: "word" };
  const [book, ch] = pageKey.split(":");
  return { kind: "scripture", book, chapter: parseInt(ch, 10) };
}

async function syncOne(pageKey, payload, supabase, user) {
  if (!user) return;
  const meta = payload.meta || pageKeyMeta(pageKey);
  const { error } = await supabase.from("ink_pages").upsert({
    user_id: user.id,
    page_key: pageKey,
    kind: meta.kind,
    book: meta.book || null,
    chapter: meta.chapter || null,
    first_verse: meta.first_verse || null,
    last_verse: meta.last_verse || null,
    stroke_data: payload.strokes,
    updated_at: payload.updated_at,
  }, { onConflict: "user_id,page_key" });
  if (!error) await idbSet(pageKey, { ...payload, dirty: false });
}

// Find a word span underneath the canvas.
function findWord(clientX, clientY) {
  const stack = document.elementsFromPoint(clientX, clientY);
  const el = stack.find(n => n.dataset && n.dataset.word);
  if (!el) return null;
  return {
    word: el.dataset.word,
    verse: parseInt(el.dataset.verse, 10),
    chapter: parseInt(el.dataset.chapter, 10),
    start: parseInt(el.dataset.start, 10),
    end: parseInt(el.dataset.end, 10),
    linked: el.dataset.linked === "1",
  };
}

// ─── RULED NOTE AREA ─────────────────────────────────────────────────────────
// Drawn as SVG lines rather than a repeating gradient: at page scale a 1px
// gradient band rounds away to nothing and most of the rules vanish.
function Rules({ x0 = RULE_X0, x1 = RULE_X1, top = MARGIN }) {
  const w = x1 - x0;
  const n = Math.floor(TEXT_H / RULE_GAP);
  return (
    <svg width={w} height={TEXT_H} viewBox={`0 0 ${w} ${TEXT_H}`}
      style={{ position: "absolute", left: x0, top, zIndex: 1, pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => (
        <line key={i} x1={0} x2={w} y1={(i + 1) * RULE_GAP} y2={(i + 1) * RULE_GAP}
          stroke={RULE} strokeWidth={1.6} />
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function ScribePage({
  supabase: supabaseProp,
  user: userProp,
  initialBook,
  initialChapter,
  onExit,
}) {
  // Runs standalone by default; props are only for embedding it elsewhere.
  const supabase = supabaseProp || defaultClient;
  const exit = onExit || (() => { window.location.hash = "#/"; });

  // Own auth session (shared with the reading app via the same client).
  const [authUser, setAuthUser] = useState(userProp || null);
  useEffect(() => {
    if (userProp) { setAuthUser(userProp); return; }
    let dead = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!dead) setAuthUser(data?.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => { dead = true; sub?.subscription?.unsubscribe(); };
  }, [userProp, supabase]);
  const user = authUser;

  // Reopens wherever you left off.
  const remembered = (() => {
    try { return JSON.parse(localStorage.getItem("scribe-pos") || "null"); } catch { return null; }
  })();
  const [book, setBook] = useState(initialBook || remembered?.book || "1 John");
  const [chapter, setChapter] = useState(initialChapter || remembered?.chapter || 1);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([[0, 0]]);
  const [pageIdx, setPageIdx] = useState(0);
  const [fitScale, setFitScale] = useState(0.5);
  const [railMode, setRailMode] = useState(true);
  const [picker, setPicker] = useState(false);
  const [palette, setPalette] = useState(false);

  const [tool, setTool] = useState("pen");
  const [hlColour, setHlColour] = useState(0);
  const [zoom, setZoom] = useState(1);
  const scale = fitScale * zoom;   // must come after zoom: const has no hoisting
  const [eraseMode, setEraseMode] = useState("touch");   // touch | circle | rect
  const [colour, setColour] = useState(0);
  const [width, setWidth] = useState(1);

  const [allLinks, setAllLinks] = useState([]);    // every word link, local + synced
  const [wordPage, setWordPage] = useState(null);  // open word note page
  const [showIndex, setShowIndex] = useState(false);

  const measureRef = useRef(null);
  const scrollRef = useRef(null);
  const headRef = useRef(null);

  // ── theme: the same variables and typeface as the reading app ────────────
  const rootRef = useRef(null);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("bibleDarkMode") === "true"; } catch { return false; }
  });
  const [inkColour, setInkColour] = useState("#221E1E");

  useEffect(() => {
    const id = "scribe-theme";
    if (!document.getElementById(id)) {
      const st = document.createElement("style");
      st.id = id;
      st.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap');
.scribe {
  --parchment:#F1E9DB; --parchment-dark:#E8DCC8; --ink:#221E1E; --ink-light:#5a5050;
  --gold:#297373; --gold-light:#3a9090; --accent:#9BC53D; --border:#c9bfaa; --white:#faf6ef;
}
.scribe.dark {
  --parchment:#221E1E; --parchment-dark:#1a1616; --ink:#F1E9DB; --ink-light:#a89880;
  --gold:#297373; --gold-light:#3a9090; --accent:#9BC53D; --border:#3a3030; --white:#2e2828;
}
.scribe select { -webkit-appearance:none; appearance:none; }`;
      document.head.appendChild(st);
    }
    // follow the reading app if dark mode is changed in another tab
    const onStorage = (e) => {
      if (e.key === "bibleDarkMode") setDark(e.newValue === "true");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const v = getComputedStyle(rootRef.current).getPropertyValue("--ink").trim();
    if (v) setInkColour(v);
  }, [dark]);

  // ── fit the page to the viewport ─────────────────────────────────────────
  useEffect(() => {
    const fit = () => {
      // How much room is left beside the page at its natural fit?
      const base = Math.min((window.innerWidth - 24) / PAGE_W, (window.innerHeight - 24) / PAGE_H);
      const spare = window.innerWidth - PAGE_W * base;
      const rail = spare >= 230;                 // enough for the rail + breathing room
      const railW = rail ? RAIL_W : 0;
      const topH = rail ? 0 : BAR_H;             // rail mode gives the top bar's height back
      setRailMode(rail);
      setFitScale(Math.min(
        (window.innerWidth - railW - 24) / PAGE_W,
        (window.innerHeight - topH - 20) / PAGE_H,
      ));
    };
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, []);

  useEffect(() => {
    try { localStorage.setItem("scribe-pos", JSON.stringify({ book, chapter })); } catch {}
  }, [book, chapter]);

  // ── verses ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let dead = false;
    setLoading(true); setVerses([]); setPageIdx(0);
    supabase.from("bible_verses")
      .select("chapter, verse, text")
      .eq("book", book).eq("chapter", chapter).eq("version", "KJV")
      .order("verse", { ascending: true })
      .then(({ data, error }) => {
        if (dead) return;
        if (error) console.error(error);
        setVerses(data || []); setLoading(false);
      });
    return () => { dead = true; };
  }, [book, chapter, supabase]);

  // ── word links: local-first, so they work signed out too ─────────────────
  useEffect(() => {
    let dead = false;
    (async () => {
      let local = [];
      try { local = (await idbGet(LINKS_KEY)) || []; } catch {}
      if (!dead) setAllLinks(local);
      if (!user) return;

      const { data } = await supabase.from("word_links").select("*").eq("user_id", user.id);
      if (dead || !data) return;

      // union by page_key, remote wins on collision
      const byKey = new Map(local.map(l => [l.page_key, l]));
      for (const r of data) byKey.set(r.page_key, r);
      const merged = [...byKey.values()];
      setAllLinks(merged);
      try { await idbSet(LINKS_KEY, merged); } catch {}

      // push anything created while signed out
      const remoteKeys = new Set(data.map(l => l.page_key));
      const unsynced = local.filter(l => !remoteKeys.has(l.page_key));
      if (unsynced.length) {
        await supabase.from("word_links").upsert(
          unsynced.map(l => ({
            user_id: user.id, book: l.book, chapter: l.chapter, verse: l.verse,
            word: l.word, start_offset: l.start_offset, end_offset: l.end_offset,
            page_key: l.page_key,
          })),
          { onConflict: "user_id,book,chapter,verse,start_offset" },
        );
      }
    })();
    return () => { dead = true; };
  }, [user?.id, supabase]);

  const links = allLinks.filter(l => l.book === book && l.chapter === chapter);

  // ── pagination: measure once, then slice verses into fixed pages ─────────
  useLayoutEffect(() => {
    if (!verses.length || !measureRef.current) return;
    let cancelled = false;
    const measure = () => {
      if (cancelled || !measureRef.current) return;
    const headH = headRef.current ? headRef.current.getBoundingClientRect().height : 0;
    const avail = TEXT_H - headH;
    const kids = Array.from(measureRef.current.querySelectorAll("[data-vi]"));
    const out = []; let start = 0; let used = 0;
    kids.forEach((el, i) => {
      const h = el.getBoundingClientRect().height;
      if (i > start && used + h > avail) { out.push([start, i - 1]); start = i; used = 0; }
      used += h;
    });
    out.push([start, kids.length - 1]);
    setPages(out);
    setPageIdx(p => Math.min(p, out.length - 1));
    };
    // Page breaks depend on the exact font, so never measure a fallback face.
    if (document.fonts && document.fonts.status !== "loaded") {
      document.fonts.ready.then(measure);
    } else {
      measure();
    }
    return () => { cancelled = true; };
  }, [verses]);

  // ── navigation ───────────────────────────────────────────────────────────
  const maxCh = CHAPTER_COUNTS[book] || 1;
  function turn(dir) {
    if (wordPage) return;
    const next = pageIdx + dir;
    if (next >= 0 && next < pages.length) { setPageIdx(next); return; }
    if (dir > 0) {
      if (chapter < maxCh) { setChapter(chapter + 1); }
      else { const i = BOOKS.indexOf(book); if (i < BOOKS.length - 1) { setBook(BOOKS[i + 1]); setChapter(1); } }
    } else {
      if (chapter > 1) { setChapter(chapter - 1); setPageIdx(0); }
      else { const i = BOOKS.indexOf(book); if (i > 0) { setBook(BOOKS[i - 1]); setChapter(CHAPTER_COUNTS[BOOKS[i - 1]]); setPageIdx(0); } }
    }
  }
  function jumpToVerse(v) {
    const i = verses.findIndex(x => x.verse === v);
    if (i < 0) return;
    const p = pages.findIndex(([a, b]) => i >= a && i <= b);
    if (p >= 0) setPageIdx(p);
  }

  // ── word links ───────────────────────────────────────────────────────────
  async function handleWordHit(hit, createIfMissing) {
    const existing = links.find(l => l.verse === hit.verse && l.start_offset === hit.start);
    if (existing) { setWordPage(existing); return; }
    if (!createIfMissing) return;
    const clean = hit.word.replace(/[^A-Za-z'’-]/g, "");
    if (!clean) return;
    const row = {
      book, chapter, verse: hit.verse, word: clean,
      start_offset: hit.start, end_offset: hit.end,
      page_key: wordPageKey(book, chapter, hit.verse, hit.start),
      created_at: new Date().toISOString(),
    };
    const next = [...allLinks, row];
    setAllLinks(next);
    try { await idbSet(LINKS_KEY, next); } catch {}
    setWordPage(row);

    if (user) {
      supabase.from("word_links")
        .upsert({ ...row, user_id: user.id },
                { onConflict: "user_id,book,chapter,verse,start_offset" })
        .then(() => {}, () => {});   // local copy already saved; retried on next load
    }
  }

  function openIndex() { setShowIndex(true); }

  const sortedLinks = [...allLinks].sort((a, b) =>
    BOOKS.indexOf(a.book) - BOOKS.indexOf(b.book) ||
    a.chapter - b.chapter || a.verse - b.verse || a.start_offset - b.start_offset);

  const activeKey = wordPage
    ? wordPage.page_key
    : scripturePageKey(book, chapter, pageIdx);

  const [pStart, pEnd] = pages[pageIdx] || [0, -1];
  const visible = verses.slice(pStart, pEnd + 1);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
  }, [zoom]);

  const ZOOMS = [1, 1.5, 2, 3];
  const stepZoom = (dir) => setZoom(z => {
    const i = ZOOMS.indexOf(z);
    return ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, (i < 0 ? 0 : i) + dir))];
  });

  const toggleDark = () => setDark(v => {
    const n = !v;
    try { localStorage.setItem("bibleDarkMode", String(n)); } catch {}
    return n;
  });

  const panBy = (dx, dy) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft -= dx;
    el.scrollTop -= dy;
  };

  const ctl = {
    book, chapter, maxCh, verses, pageIdx, pages, turn, jumpToVerse,
    tool, setTool, eraseMode, setEraseMode, colour, setColour, width, setWidth, inkColour,
    hlColour, setHlColour, zoom, stepZoom, ZOOMS,
    exit, user, openIndex, wordPage, setWordPage,
    openPicker: () => setPicker(true),
    palette, setPalette, dark, toggleDark,
  };

  // ─── render ──────────────────────────────────────────────────────────────
  return (
    <div ref={rootRef} className={dark ? "scribe dark" : "scribe"} style={{
      position: "fixed", inset: 0, background: "var(--parchment-dark)",
      display: "flex", flexDirection: "column", alignItems: "stretch",
      fontFamily: FONT_STACK, overflow: "hidden", userSelect: "none",
      WebkitUserSelect: "none", WebkitTouchCallout: "none",
    }}>
      {!railMode && <CompactBar {...ctl} />}

      <div style={{ flex: 1, minHeight: 0, width: "100%", display: "flex", overflow: "hidden" }}>
      <div ref={scrollRef} style={{
        flex: 1, minWidth: 0, display: "flex",
        overflow: zoom > 1 ? "auto" : "hidden",
      }}>
        {/* margin auto centres the page and still reaches the edges when zoomed */}
        <div style={{ width: PAGE_W * scale, height: PAGE_H * scale, flexShrink: 0,
                      position: "relative", margin: "auto" }}>
        <div style={{
          width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`,
          transformOrigin: "top left", position: "absolute", top: 0, left: 0,
          background: PAPER, boxShadow: "0 6px 28px rgba(0,0,0,.22)", overflow: "hidden",
        }}>
          {wordPage ? (
            <>
              <div style={{
                position: "absolute", left: MARGIN, top: MARGIN - 46, width: CONTENT_W,
                fontSize: FONT_SIZE * 1.5, fontWeight: 700, color: ACCENT,
                letterSpacing: ".04em", textTransform: "uppercase",
              }}>
                {wordPage.word}
                <span style={{ color: INK, fontWeight: 400, fontSize: FONT_SIZE, textTransform: "none", marginLeft: 16 }}>
                  {wordPage.book} {wordPage.chapter}:{wordPage.verse}
                </span>
              </div>
              <Rules x0={MARGIN} x1={PAGE_W - MARGIN} top={MARGIN + 10} />
            </>
          ) : (
            <>
              <Rules />
              <div style={{
                position: "absolute", left: MARGIN, top: MARGIN, width: TEXT_W,
                height: TEXT_H, zIndex: 2, color: INK,
                fontSize: FONT_SIZE, lineHeight: `${LINE_H}px`,
                hyphens: "auto", WebkitHyphens: "auto", textAlign: "left",
              }} lang="en">
                <div ref={headRef} style={{
                  fontWeight: 700, fontSize: FONT_SIZE * 1.45, color: ACCENT,
                  letterSpacing: ".05em", textTransform: "uppercase",
                  paddingBottom: LINE_H * 0.9, lineHeight: 1.1,
                }}>
                  {book} {chapter} <span style={{ fontSize: FONT_SIZE * 0.8 }}>KJV</span>
                </div>
                {loading && <div style={{ color: "var(--ink-light)", fontStyle: "italic" }}>Loading…</div>}
                {visible.map(v => (
                  <VerseBlock key={v.verse} v={v} chapter={chapter} first={v.verse === 1} links={links} />
                ))}
              </div>
            </>
          )}

          <InkLayer
            pageKey={activeKey}
            supabase={supabase}
            user={user}
            tool={tool}
            eraseMode={eraseMode}
            colour={colour}
            hlColour={hlColour}
            width={width}
            inkColour={inkColour}
            onWordHit={handleWordHit}
            onSwipe={turn}
            onPan={zoom > 1 ? panBy : null}
          />
        </div>
        </div>
      </div>
      {railMode && <Rail {...ctl} />}
      </div>

      {/* hidden measuring column — identical width, font and styling */}
      <div ref={measureRef} aria-hidden style={{
        position: "absolute", left: -99999, top: 0, width: TEXT_W,
        fontFamily: FONT_STACK, fontSize: FONT_SIZE, lineHeight: `${LINE_H}px`,
        color: INK, hyphens: "auto", WebkitHyphens: "auto", visibility: "hidden",
      }} lang="en">
        {verses.map(v => (
          <VerseBlock key={v.verse} v={v} chapter={chapter} first={v.verse === 1} links={[]} measuring />
        ))}
      </div>

      {picker && (
        <PassagePicker
          book={book} chapter={chapter} verses={verses}
          onClose={() => setPicker(false)}
          onPick={(b, c, v) => {
            if (b !== book) { setBook(b); setChapter(c || 1); }
            else if (c && c !== chapter) setChapter(c);
            if (v) setTimeout(() => jumpToVerse(v), 0);
            setPicker(false);
          }}
        />
      )}

      {showIndex && (
        <WordIndex links={sortedLinks} onClose={() => setShowIndex(false)} onOpen={(l) => {
          setShowIndex(false);
          if (l.book !== book) setBook(l.book);
          if (l.chapter !== chapter) setChapter(l.chapter);
          setWordPage(l);
        }} />
      )}
    </div>
  );
}

// ─── ONE VERSE ───────────────────────────────────────────────────────────────
function VerseBlock({ v, chapter, first, links, measuring }) {
  const tokens = tokenize(v.text);
  const linked = new Set(links.filter(l => l.verse === v.verse).map(l => l.start_offset));
  return (
    <div data-vi={v.verse} style={{ display: "flow-root", paddingBottom: LINE_H * 0.12 }}>
      {first ? (
        <span style={{
          float: "left", fontSize: FONT_SIZE * 2.9, lineHeight: `${LINE_H * 1.55}px`,
          fontWeight: 700, color: ACCENT, marginRight: FONT_SIZE * 0.5,
        }}>{chapter}</span>
      ) : (
        <span style={{ color: ACCENT, fontWeight: 700, marginRight: FONT_SIZE * 0.3 }}>{v.verse}</span>
      )}
      {tokens.map((t, i) => (
        <span key={i}>
          <span
            data-word={measuring ? undefined : t.w}
            data-verse={v.verse}
            data-chapter={chapter}
            data-start={t.s}
            data-end={t.e}
            data-linked={linked.has(t.s) ? "1" : "0"}
            style={linked.has(t.s) ? {
              color: ACCENT,
              borderBottom: `1.5px dotted ${ACCENT}`,
            } : undefined}
          >{t.w}</span>{" "}
        </span>
      ))}
    </div>
  );
}

// ─── SHARED CONTROL BITS ─────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const ICONS = {
  erase: <><path d="M4 16 14 6a2 2 0 0 1 3 0l4 4a2 2 0 0 1 0 3l-7 7H7z" /><path d="M9 21h11" /></>,
  link:  <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></>,
  undo:  <><path d="M3 8h11a6 6 0 0 1 0 12H8" /><path d="m7 4-4 4 4 4" /></>,
  clear: <><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13h10l1-13" /></>,
  pages: <><path d="M4 5h16" /><path d="M4 12h16" /><path d="M4 19h16" /></>,
  back:  <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
  hl:    <><path d="M4 20h6" /><path d="m14 4 6 6-8 8H8l-2-2z" /></>,
  zoomIn:  <><circle cx="11" cy="11" r="7" /><path d="M11 8v6M8 11h6" /><path d="m20 20-4-4" /></>,
  zoomOut: <><circle cx="11" cy="11" r="7" /><path d="M8 11h6" /><path d="m20 20-4-4" /></>,
  theme: <><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" stroke="none" /></>,
};

const face = { fontFamily: "'Lato', sans-serif" };
const ghost = (active) => ({
  ...face, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
  background: active ? "var(--gold)" : "transparent",
  color: active ? "var(--white)" : "var(--ink)",
  border: "1px solid var(--gold)", borderRadius: 5, cursor: "pointer",
  fontSize: 12, fontWeight: 700, padding: "4px 8px", whiteSpace: "nowrap", flexShrink: 0,
});

function Swatches({ colour, setColour, hlColour, setHlColour, tool, setTool, inkColour, wrap }) {
  const hl = tool === "highlighter";
  const list = hl ? HL_COLOURS : PEN_COLOURS;
  const active = hl ? hlColour : colour;
  return (
    <div style={{ display: "flex", flexWrap: wrap ? "wrap" : "nowrap", gap: 6, justifyContent: "center" }}>
      {list.map((c, i) => (
        <button key={i} aria-label={`${hl ? "Highlighter" : "Ink"} colour ${i + 1}`}
          onClick={() => { if (hl) { setHlColour(i); } else { setColour(i); setTool("pen"); } }}
          style={{
            width: 20, height: 20, borderRadius: hl ? 4 : "50%", flexShrink: 0, cursor: "pointer",
            background: c || inkColour,
            border: active === i ? "2px solid var(--gold-light)" : "1px solid var(--border)",
          }} />
      ))}
    </div>
  );
}

function Widths({ width, setWidth, tool, setTool }) {
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
      {PEN_WIDTHS.map((w, i) => (
        <button key={i}
          style={{ ...ghost(width === i), padding: "3px 8px" }}
          onClick={() => { setWidth(i); setTool(t => (t === "pen" || t === "link") ? "pen" : t); }}>
          {["S", "M", "L"][i]}
        </button>
      ))}
    </div>
  );
}

const ERASE_MODES = [
  ["touch",  "Touch", "Removes any stroke the tip grazes"],
  ["circle", "Circle", "Wipe with a round eraser — S/M/L sets its size"],
  ["rect",   "Box",   "Drag a box; strokes fully inside it go"],
];

function EraseModes({ eraseMode, setEraseMode, stacked }) {
  return (
    <div style={{ display: "flex", flexDirection: stacked ? "column" : "row", gap: 4 }}>
      {ERASE_MODES.map(([id, label, hint]) => (
        <button key={id} title={hint}
          style={{ ...ghost(eraseMode === id), padding: "3px 7px", fontSize: 10,
                   width: stacked ? "100%" : undefined }}
          onClick={() => setEraseMode(id)}>{label}</button>
      ))}
    </div>
  );
}

const Sep = ({ vertical }) => (
  <div style={vertical
    ? { height: 1, width: "100%", background: "var(--border)", margin: "2px 0" }
    : { width: 1, height: 22, background: "var(--border)", flexShrink: 0 }} />
);

// ─── VERTICAL RAIL (wide screens — costs no vertical space) ──────────────────
function Rail(p) {
  const { book, chapter, pageIdx, pages, turn, tool, setTool, colour, setColour,
          width, setWidth, inkColour, exit, user, openIndex, wordPage, setWordPage,
          openPicker, dark, toggleDark, eraseMode, setEraseMode,
          hlColour, setHlColour, zoom, stepZoom, ZOOMS } = p;
  return (
    <div style={{
      ...face, width: RAIL_W, flexShrink: 0, height: "100%", overflowY: "auto",
      background: "var(--parchment)", borderLeft: "1px solid var(--border)",
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 8, padding: "10px 8px", color: "var(--ink)",
    }}>
      <button style={{ ...ghost(false), width: "100%" }} onClick={exit}>
        <Icon d={ICONS.back} size={14} />
      </button>

      {wordPage ? (
        <>
          <button style={{ ...ghost(false), width: "100%", fontSize: 11 }}
            onClick={() => setWordPage(null)}>Text</button>
          <div style={{ fontSize: 11, textAlign: "center", color: "var(--ink-light)", lineHeight: 1.3 }}>
            {wordPage.word}<br />{wordPage.chapter}:{wordPage.verse}
          </div>
        </>
      ) : (
        <>
          <button style={{ ...ghost(false), width: "100%", fontSize: 11, lineHeight: 1.25,
                           whiteSpace: "normal", textAlign: "center", padding: "6px 4px" }}
            onClick={openPicker}>{book}<br />{chapter}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button style={{ ...ghost(false), padding: "3px 7px" }} onClick={() => turn(-1)}>‹</button>
            <span style={{ fontSize: 11 }}>{pageIdx + 1}/{pages.length}</span>
            <button style={{ ...ghost(false), padding: "3px 7px" }} onClick={() => turn(1)}>›</button>
          </div>
        </>
      )}

      <Sep vertical />
      <div style={{ display: "flex", gap: 4, width: "100%" }}>
        <button style={{ ...ghost(tool === "pen"), flex: 1 }} onClick={() => setTool("pen")}>Pen</button>
        <button style={{ ...ghost(tool === "highlighter"), flex: 1 }}
          onClick={() => setTool("highlighter")} title="Highlighter">
          <Icon d={ICONS.hl} size={14} />
        </button>
      </div>
      <Swatches wrap {...{ colour, setColour, hlColour, setHlColour, tool, setTool, inkColour }} />
      <Widths {...{ width, setWidth, tool, setTool }} />
      <Sep vertical />

      <button style={{ ...ghost(tool === "eraser"), width: "100%" }}
        onClick={() => setTool(tool === "eraser" ? "pen" : "eraser")}>
        <Icon d={ICONS.erase} />
      </button>
      {tool === "eraser" && <EraseModes stacked {...{ eraseMode, setEraseMode }} />}
      <button style={{ ...ghost(tool === "link"), width: "100%" }}
        onClick={() => setTool(tool === "link" ? "pen" : "link")}>
        <Icon d={ICONS.link} />
      </button>
      <button style={{ ...ghost(false), width: "100%" }} onClick={() => window.__scribeInk?.undo()}>
        <Icon d={ICONS.undo} />
      </button>
      <button style={{ ...ghost(false), width: "100%" }}
        onClick={() => { if (window.confirm("Clear all ink on this page?")) window.__scribeInk?.clear(); }}>
        <Icon d={ICONS.clear} />
      </button>
      <button style={{ ...ghost(false), width: "100%" }} onClick={openIndex}>
        <Icon d={ICONS.pages} />
      </button>
      <button style={{ ...ghost(false), width: "100%" }} onClick={toggleDark}
        title={dark ? "Light mode" : "Dark mode"}>
        <Icon d={ICONS.theme} />
      </button>
      <Sep vertical />
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <button style={{ ...ghost(false), padding: "3px 5px" }} disabled={zoom === ZOOMS[0]}
          onClick={() => stepZoom(-1)}><Icon d={ICONS.zoomOut} size={13} /></button>
        <button style={{ ...ghost(false), padding: "3px 5px" }}
          disabled={zoom === ZOOMS[ZOOMS.length - 1]}
          onClick={() => stepZoom(1)}><Icon d={ICONS.zoomIn} size={13} /></button>
      </div>
      <span style={{ fontSize: 10, color: "var(--ink-light)" }}>{Math.round(zoom * 100)}%</span>

      <div style={{ flex: 1 }} />
      {!user && (
        <span title="Sign in on the reading app to sync" style={{
          fontSize: 9, fontWeight: 700, letterSpacing: ".4px", textTransform: "uppercase",
          color: "var(--ink-light)", textAlign: "center", lineHeight: 1.3,
        }}>local<br />only</span>
      )}
    </div>
  );
}

// ─── COMPACT BAR (narrow screens — everything fits one row) ──────────────────
function CompactBar(p) {
  const { book, chapter, pageIdx, pages, turn, tool, setTool, colour, setColour,
          width, setWidth, inkColour, exit, user, openIndex, wordPage, setWordPage,
          openPicker, palette, setPalette, dark, toggleDark, eraseMode, setEraseMode,
          hlColour, setHlColour, zoom, stepZoom, ZOOMS } = p;
  return (
    <div style={{
      ...face, width: "100%", height: BAR_H, flexShrink: 0, position: "relative",
      background: "var(--parchment)", borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", gap: 6, padding: "0 10px", color: "var(--ink)",
    }}>
      <button style={ghost(false)} onClick={exit}><Icon d={ICONS.back} size={14} /></button>

      {wordPage ? (
        <>
          <button style={ghost(false)} onClick={() => setWordPage(null)}>Text</button>
          <span style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {wordPage.word} · {wordPage.chapter}:{wordPage.verse}
          </span>
        </>
      ) : (
        <>
          <button style={{ ...ghost(false), overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}
            onClick={openPicker}>{book} {chapter}</button>
          <button style={ghost(false)} onClick={() => turn(-1)}>‹</button>
          <span style={{ fontSize: 12, minWidth: 34, textAlign: "center", flexShrink: 0 }}>
            {pageIdx + 1}/{pages.length}
          </span>
          <button style={ghost(false)} onClick={() => turn(1)}>›</button>
        </>
      )}

      <span style={{ flex: 1, minWidth: 4 }} />

      <button aria-label="Pen and colour" onClick={() => setPalette(v => !v)}
        style={{ ...ghost(palette), padding: "3px 6px" }}>
        <span style={{
          width: 16, height: 16, display: "block", border: "1px solid var(--border)",
          borderRadius: tool === "highlighter" ? 3 : "50%",
          background: tool === "highlighter"
            ? HL_COLOURS[hlColour] : (PEN_COLOURS[colour] || inkColour),
        }} />
        <span style={{ fontSize: 11 }}>{["S", "M", "L"][width]}</span>
      </button>
      <button style={ghost(tool === "highlighter")} title="Highlighter"
        onClick={() => setTool(tool === "highlighter" ? "pen" : "highlighter")}>
        <Icon d={ICONS.hl} /></button>
      <button style={ghost(tool === "eraser")}
        onClick={() => setTool(tool === "eraser" ? "pen" : "eraser")}><Icon d={ICONS.erase} /></button>
      {tool === "eraser" && <EraseModes {...{ eraseMode, setEraseMode }} />}
      <button style={ghost(tool === "link")}
        onClick={() => setTool(tool === "link" ? "pen" : "link")}><Icon d={ICONS.link} /></button>
      <button style={ghost(false)} onClick={() => window.__scribeInk?.undo()}><Icon d={ICONS.undo} /></button>
      <button style={ghost(false)} onClick={openIndex}><Icon d={ICONS.pages} /></button>
      <button style={ghost(false)} onClick={toggleDark}
        title={dark ? "Light mode" : "Dark mode"}><Icon d={ICONS.theme} /></button>

      {palette && (
        <div style={{
          position: "absolute", top: BAR_H + 4, right: 10, zIndex: 60,
          background: "var(--parchment)", border: "1px solid var(--border)",
          borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 8,
          boxShadow: "0 6px 20px rgba(0,0,0,.22)", width: 168,
        }}>
          <Swatches wrap {...{ colour, setColour, hlColour, setHlColour, tool, setTool, inkColour }} />
          <Widths {...{ width, setWidth, tool, setTool }} />
          <Sep vertical />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button style={{ ...ghost(false), padding: "3px 6px" }} disabled={zoom === ZOOMS[0]}
              onClick={() => stepZoom(-1)}><Icon d={ICONS.zoomOut} size={13} /></button>
            <span style={{ fontSize: 11 }}>{Math.round(zoom * 100)}%</span>
            <button style={{ ...ghost(false), padding: "3px 6px" }}
              disabled={zoom === ZOOMS[ZOOMS.length - 1]}
              onClick={() => stepZoom(1)}><Icon d={ICONS.zoomIn} size={13} /></button>
          </div>
          <Sep vertical />
          <button style={ghost(false)}
            onClick={() => { if (window.confirm("Clear all ink on this page?")) window.__scribeInk?.clear(); }}>
            <Icon d={ICONS.clear} /> Clear page
          </button>
          {!user && (
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                           color: "var(--ink-light)", textAlign: "center" }}>local only</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PASSAGE PICKER ──────────────────────────────────────────────────────────
function PassagePicker({ book, chapter, verses, onPick, onClose }) {
  const [b, setB] = useState(book);
  const [c, setC] = useState(chapter);
  const col = {
    flex: 1, minWidth: 0, overflowY: "auto", maxHeight: "58vh",
    borderRight: "1px solid var(--border)",
  };
  const row = (active) => ({
    ...face, display: "block", width: "100%", textAlign: "left", cursor: "pointer",
    background: active ? "var(--gold)" : "transparent",
    color: active ? "var(--white)" : "var(--ink)",
    border: "none", padding: "7px 12px", fontSize: 13,
  });
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
      display: "grid", placeItems: "center", zIndex: 60,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        ...face, background: "var(--parchment)", color: "var(--ink)",
        border: "1px solid var(--border)", borderRadius: 8,
        width: "min(560px, 92vw)", overflow: "hidden",
      }}>
        <div style={{ display: "flex" }}>
          <div style={col}>
            {BOOKS.map(x => (
              <button key={x} style={row(x === b)}
                onClick={() => { setB(x); setC(1); }}>{x}</button>
            ))}
          </div>
          <div style={col}>
            {Array.from({ length: CHAPTER_COUNTS[b] || 1 }, (_, i) => i + 1).map(x => (
              <button key={x} style={row(x === c)} onClick={() => setC(x)}>Chapter {x}</button>
            ))}
          </div>
          <div style={{ ...col, borderRight: "none" }}>
            <button style={row(false)} onClick={() => onPick(b, c, null)}>Whole chapter</button>
            {b === book && c === chapter && verses.map(v => (
              <button key={v.verse} style={row(false)} onClick={() => onPick(b, c, v.verse)}>
                Verse {v.verse}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: 10,
                      borderTop: "1px solid var(--border)" }}>
          <button style={ghost(false)} onClick={onClose}>Cancel</button>
          <button style={{ ...ghost(true) }} onClick={() => onPick(b, c, null)}>Go</button>
        </div>
      </div>
    </div>
  );
}

// ─── WORD PAGE INDEX ─────────────────────────────────────────────────────────
function WordIndex({ links, onClose, onOpen }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
      display: "grid", placeItems: "center", zIndex: 50,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--parchment)", color: "var(--ink)", width: 520,
        maxHeight: "70vh", overflowY: "auto", border: "1px solid var(--border)",
        borderRadius: 8, padding: "20px 24px", fontFamily: "'Lato', sans-serif",
      }}>
        <div style={{ fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>
          Word pages
        </div>
        {links.length === 0 && (
          <div style={{ color: "var(--ink-light)" }}>
            No word pages yet. Turn on the link tool, then tap a word in the text.
          </div>
        )}
        {links.map(l => (
          <div key={l.id || l.page_key} onClick={() => onOpen(l)} style={{
            padding: "10px 0", borderBottom: `1px solid ${RULE}`, cursor: "pointer",
            display: "flex", justifyContent: "space-between",
          }}>
            <span style={{ fontWeight: 600 }}>{l.word}</span>
            <span style={{ color: "var(--ink-light)" }}>{l.book} {l.chapter}:{l.verse}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BACKGROUND FLUSH: push anything left dirty when we come back online ─────
if (typeof window !== "undefined") {
  window.addEventListener("online", async () => {
    const dirty = await idbDirtyKeys().catch(() => []);
    if (window.__scribeSync) for (const d of dirty) window.__scribeSync(d.key, d);
  });
}
