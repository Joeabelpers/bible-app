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
const RULE_GAP = 52;
const RASTER = 1.5;                      // canvas backing resolution multiplier

// ─── PALETTE (taken from the reference page) ─────────────────────────────────
const PAPER  = "#F7F3EC";
const INK    = "#3A3733";
const ACCENT = "#C1663B";
const RULE   = "#E4CBB8";
const CHROME = "#2E2B27";

// Stroke colour is stored as an index into this array, never as a hex string.
const PEN_COLOURS = [
  "#2E2B27", "#1F4E79", "#7A1F1F", "#1F5A3D",
  "#5B3A87", "#C1663B", "#B08900", "#6B6660",
];
const PEN_WIDTHS = [1.6, 3.0, 5.5];      // in page units, before pressure

const FONT_STACK =
  '"Nunito Sans","Avenir Next","Segoe UI",system-ui,-apple-system,sans-serif';

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
function simplify(pts, eps = 0.8) {
  if (pts.length < 3) return pts;
  let maxD = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [pts[0], pts[pts.length - 1]];
  return [
    ...simplify(pts.slice(0, idx + 1), eps).slice(0, -1),
    ...simplify(pts.slice(idx), eps),
  ];
}
function compress(pts) {
  return simplify(pts).map(p => [Math.round(p[0]), Math.round(p[1]), Math.round(p[2] * 100) / 100]);
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
function InkLayer({ pageKey, supabase, user, tool, colour, width, onWordHit, onSwipe }) {
  const canvasRef = useRef(null);
  const strokesRef = useRef([]);
  const historyRef = useRef([]);
  const drawingRef = useRef(null);
  const saveTimer = useRef(null);
  const swipeRef = useRef(null);
  const [, force] = useState(0);

  const ctx = () => canvasRef.current?.getContext("2d");

  const redraw = useCallback(() => {
    const c = ctx(); if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, PAGE_W * RASTER, PAGE_H * RASTER);
    c.scale(RASTER, RASTER);
    c.lineCap = "round"; c.lineJoin = "round";
    for (const s of strokesRef.current) drawStroke(c, s);
  }, []);

  function drawStroke(c, s) {
    const pts = s.p;
    c.strokeStyle = PEN_COLOURS[s.c] || PEN_COLOURS[0];
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

    // Word tapping: finger anywhere, or the pen while the link tool is active.
    if (!isPen || tool === "link") {
      const hit = findWord(e.clientX, e.clientY);
      if (hit) { onWordHit(hit, tool === "link"); return; }
      if (!isPen) { swipeRef.current = { x: e.clientX, y: e.clientY }; return; }
      return;
    }
    if (tool === "link") return;

    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    const [x, y] = toPage(e);
    const pr = e.pressure > 0 ? e.pressure : 0.5;

    if (tool === "eraser") { erase(x, y); drawingRef.current = { erasing: true }; return; }

    historyRef.current.push(strokesRef.current);
    if (historyRef.current.length > 40) historyRef.current.shift();
    drawingRef.current = { c: colour, w: PEN_WIDTHS[width], p: [[x, y, pr]] };
    force(n => n + 1);
  }

  function onPointerMove(e) {
    const d = drawingRef.current; if (!d) return;
    e.preventDefault();
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    if (d.erasing) { for (const ev of events) { const [x, y] = toPage(ev); erase(x, y); } return; }
    const c = ctx();
    c.setTransform(RASTER, 0, 0, RASTER, 0, 0);
    c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = PEN_COLOURS[d.c];
    for (const ev of events) {
      const [x, y] = toPage(ev);
      const pr = ev.pressure > 0 ? ev.pressure : 0.5;
      const a = d.p[d.p.length - 1];
      if (Math.hypot(x - a[0], y - a[1]) < 0.6) continue;
      c.lineWidth = d.w * (0.35 + 0.65 * ((a[2] + pr) / 2));
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(x, y); c.stroke();
      d.p.push([x, y, pr]);
    }
  }

  function onPointerUp(e) {
    if (swipeRef.current) {
      const dx = e.clientX - swipeRef.current.x;
      const dy = Math.abs(e.clientY - swipeRef.current.y);
      swipeRef.current = null;
      if (Math.abs(dx) > 90 && dy < 70) onSwipe(dx < 0 ? 1 : -1);
      return;
    }
    const d = drawingRef.current; if (!d) return;
    drawingRef.current = null;
    if (d.erasing) { persist(); return; }
    strokesRef.current = [...strokesRef.current, { c: d.c, w: d.w, p: compress(d.p) }];
    redraw();
    persist();
    force(n => n + 1);
  }

  function erase(x, y) {
    const R = 16;
    const keep = strokesRef.current.filter(s => !s.p.some(p => Math.hypot(p[0] - x, p[1] - y) < R));
    if (keep.length !== strokesRef.current.length) {
      historyRef.current.push(strokesRef.current);
      strokesRef.current = keep;
      redraw();
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

  useEffect(() => { redraw(); }, [redraw]);

  return (
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
function Rules({ x0 = RULE_X0, x1 = RULE_X1, top = MARGIN }) {
  return (
    <div style={{
      position: "absolute", left: x0, top, width: x1 - x0, height: TEXT_H, zIndex: 1,
      backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${RULE_GAP - 1}px, ${RULE} ${RULE_GAP - 1}px ${RULE_GAP}px)`,
    }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function ScribePage({ supabase, user, initialBook = "1 John", initialChapter = 1, onExit }) {
  const [book, setBook] = useState(initialBook);
  const [chapter, setChapter] = useState(initialChapter);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([[0, 0]]);
  const [pageIdx, setPageIdx] = useState(0);
  const [scale, setScale] = useState(0.5);

  const [tool, setTool] = useState("pen");
  const [colour, setColour] = useState(0);
  const [width, setWidth] = useState(1);

  const [links, setLinks] = useState([]);          // word_links for this chapter
  const [wordPage, setWordPage] = useState(null);  // open word note page
  const [showIndex, setShowIndex] = useState(false);
  const [allLinks, setAllLinks] = useState([]);

  const measureRef = useRef(null);
  const headRef = useRef(null);

  // ── font (self-host these files for full offline use) ────────────────────
  useEffect(() => {
    const id = "scribe-font";
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&display=swap";
    document.head.appendChild(l);
  }, []);

  // ── fit the page to the viewport ─────────────────────────────────────────
  useEffect(() => {
    const fit = () => {
      const k = Math.min((window.innerWidth - 24) / PAGE_W, (window.innerHeight - 88) / PAGE_H);
      setScale(k);
    };
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, []);

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

  // ── word links for this chapter ──────────────────────────────────────────
  useEffect(() => {
    if (!user) { setLinks([]); return; }
    supabase.from("word_links")
      .select("*").eq("user_id", user.id).eq("book", book).eq("chapter", chapter)
      .then(({ data }) => setLinks(data || []));
  }, [user?.id, book, chapter, supabase]);

  // ── pagination: measure once, then slice verses into fixed pages ─────────
  useLayoutEffect(() => {
    if (!verses.length || !measureRef.current) return;
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
    if (!createIfMissing || !user) return;
    const clean = hit.word.replace(/[^A-Za-z'’-]/g, "");
    if (!clean) return;
    const row = {
      user_id: user.id, book, chapter, verse: hit.verse, word: clean,
      start_offset: hit.start, end_offset: hit.end,
      page_key: wordPageKey(book, chapter, hit.verse, hit.start),
    };
    const { data } = await supabase.from("word_links")
      .upsert(row, { onConflict: "user_id,book,chapter,verse,start_offset" })
      .select().maybeSingle();
    const saved = data || row;
    setLinks(prev => [...prev, saved]);
    setWordPage(saved);
  }

  async function openIndex() {
    if (!user) return;
    const { data } = await supabase.from("word_links")
      .select("*").eq("user_id", user.id).order("book").order("chapter").order("verse");
    setAllLinks(data || []);
    setShowIndex(true);
  }

  const activeKey = wordPage
    ? wordPage.page_key
    : scripturePageKey(book, chapter, pageIdx);

  const [pStart, pEnd] = pages[pageIdx] || [0, -1];
  const visible = verses.slice(pStart, pEnd + 1);

  // ─── render ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#191713",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: FONT_STACK, overflow: "hidden", userSelect: "none",
      WebkitUserSelect: "none", WebkitTouchCallout: "none",
    }}>
      <Toolbar
        {...{ book, setBook, chapter, setChapter, maxCh, verses, jumpToVerse,
              pageIdx, pages, turn, tool, setTool, colour, setColour, width, setWidth,
              onExit, openIndex, wordPage, setWordPage }}
      />

      <div style={{ flex: 1, display: "grid", placeItems: "center", width: "100%" }}>
        <div style={{
          width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`,
          transformOrigin: "center center", position: "relative",
          background: PAPER, boxShadow: "0 8px 40px rgba(0,0,0,.55)", overflow: "hidden",
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
                {loading && <div style={{ color: "#9a8f83" }}>Loading…</div>}
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
            colour={colour}
            width={width}
            onWordHit={handleWordHit}
            onSwipe={turn}
          />
        </div>
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

      {showIndex && (
        <WordIndex links={allLinks} onClose={() => setShowIndex(false)} onOpen={(l) => {
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

// ─── TOOLBAR ─────────────────────────────────────────────────────────────────
function Toolbar(props) {
  const {
    book, setBook, chapter, setChapter, maxCh, verses, jumpToVerse,
    pageIdx, pages, turn, tool, setTool, colour, setColour, width, setWidth,
    onExit, openIndex, wordPage, setWordPage,
  } = props;

  const sel = {
    background: "transparent", color: "#EDE6DC", border: "1px solid #4A453E",
    borderRadius: 6, padding: "6px 8px", fontSize: 14, fontFamily: "inherit",
  };
  const btn = (active) => ({
    ...sel, cursor: "pointer", padding: "6px 10px",
    background: active ? "#3E3830" : "transparent",
    borderColor: active ? ACCENT : "#4A453E",
  });

  return (
    <div style={{
      width: "100%", height: 56, flexShrink: 0, background: CHROME,
      display: "flex", alignItems: "center", gap: 8, padding: "0 12px",
      color: "#EDE6DC", overflowX: "auto",
    }}>
      {onExit && <button style={btn(false)} onClick={onExit}>Close</button>}

      {wordPage ? (
        <>
          <button style={btn(false)} onClick={() => setWordPage(null)}>Back to text</button>
          <span style={{ fontSize: 15, marginLeft: 8 }}>
            {wordPage.word} — {wordPage.book} {wordPage.chapter}:{wordPage.verse}
          </span>
        </>
      ) : (
        <>
          <select style={sel} value={book} onChange={e => { setBook(e.target.value); setChapter(1); }}>
            {BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select style={sel} value={chapter} onChange={e => setChapter(Number(e.target.value))}>
            {Array.from({ length: maxCh }, (_, i) => i + 1).map(c => <option key={c} value={c}>ch {c}</option>)}
          </select>
          <select style={sel} value="" onChange={e => e.target.value && jumpToVerse(Number(e.target.value))}>
            <option value="">verse…</option>
            {verses.map(v => <option key={v.verse} value={v.verse}>v {v.verse}</option>)}
          </select>
          <button style={btn(false)} onClick={() => turn(-1)}>‹</button>
          <span style={{ fontSize: 14, minWidth: 48, textAlign: "center" }}>
            {pageIdx + 1}/{pages.length}
          </span>
          <button style={btn(false)} onClick={() => turn(1)}>›</button>
        </>
      )}

      <span style={{ flex: 1 }} />

      {PEN_COLOURS.map((c, i) => (
        <button key={c} aria-label={`Ink colour ${i + 1}`} onClick={() => { setColour(i); setTool("pen"); }}
          style={{
            width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer",
            border: colour === i && tool === "pen" ? `2px solid #EDE6DC` : "1px solid #4A453E",
          }} />
      ))}
      {PEN_WIDTHS.map((w, i) => (
        <button key={i} style={btn(width === i && tool === "pen")}
          onClick={() => { setWidth(i); setTool("pen"); }}>{["S", "M", "L"][i]}</button>
      ))}
      <button style={btn(tool === "eraser")} onClick={() => setTool(tool === "eraser" ? "pen" : "eraser")}>Erase</button>
      <button style={btn(tool === "link")} onClick={() => setTool(tool === "link" ? "pen" : "link")}>Link word</button>
      <button style={btn(false)} onClick={() => window.__scribeInk?.undo()}>Undo</button>
      <button style={btn(false)} onClick={() => { if (window.confirm("Clear all ink on this page?")) window.__scribeInk?.clear(); }}>Clear</button>
      <button style={btn(false)} onClick={openIndex}>Word pages</button>
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
        background: PAPER, color: INK, width: 520, maxHeight: "70vh", overflowY: "auto",
        borderRadius: 10, padding: "20px 24px",
      }}>
        <div style={{ fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>
          Word pages
        </div>
        {links.length === 0 && (
          <div style={{ color: "#8a8079" }}>
            No word pages yet. Choose “Link word”, then tap a word in the text.
          </div>
        )}
        {links.map(l => (
          <div key={l.id || l.page_key} onClick={() => onOpen(l)} style={{
            padding: "10px 0", borderBottom: `1px solid ${RULE}`, cursor: "pointer",
            display: "flex", justifyContent: "space-between",
          }}>
            <span style={{ fontWeight: 600 }}>{l.word}</span>
            <span style={{ color: "#8a8079" }}>{l.book} {l.chapter}:{l.verse}</span>
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
