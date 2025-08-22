/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * canvas-based numbered bubbles persisted in sessionStorage
 * module/ comments.js;
 */

import { debugLogLevelLoading } from '../debug.js';
import * as actions from './actions.js';
import * as state from './state.js';
import { commentCanvas } from './canvas.js';
import { DivPdfContainer } from './ui.js';

/** Stored in PAGE coordinates (pre-scale), so redraw scales them */
let items = [];        // [{id, n, x, y, text}]
// let docKey = 1;
// const key = () => `vm:comments:${docKey || 'default'}`;
const key = () => `vm:comments`;

// one active editor in DOM
export let editorEl = null;
let editorForId = null;

function load() {
    if (debugLogLevelLoading) console.log('comments.js > load()');
    try { items = JSON.parse(sessionStorage.getItem(key()) || '[]'); }
    catch { items = []; }
}
function save() {
    sessionStorage.setItem(key(), JSON.stringify(items));
}



/** screen → page coords */
function pageXYFromEvent(e) {
    const r = commentCanvas.getBoundingClientRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    const s = state.currentScale || 1;
    return { x: sx / s, y: sy / s };
}

/** page → screen (for editor positioning) */
export function screenXYFromPage(px, py) {
    const s = state.currentScale || 1;
    return {
        x: px * s + state.panOffset.x,   // ← keep if overlays are translated via CSS
        y: py * s + state.panOffset.y,   // ← remove the +panOffset if not using CSS translate
    };
}

/** low-level draw of one bubble + number */
function drawBubble(ctx, x, y, n) {
    const s = state.currentScale || 1;
    const r = Math.max(8, Math.min(12 * s, 26));

    ctx.beginPath();
    ctx.arc(x * s, y * s, r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = Math.max(2, 2 * s);
    ctx.strokeStyle = '#1f7aed';
    ctx.stroke();

    ctx.fillStyle = '#1f7aed';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontPx = Math.max(10, Math.min(12 * s, 20));
    ctx.font = `600 ${fontPx}px system-ui, sans-serif`;
    ctx.fillText(String(n), x * s, y * s);
}

/** public: redraw all bubbles */
export function redrawComments() {
    if (!commentCanvas) return;
    const ctx = commentCanvas.getContext('2d');
    ctx.clearRect(0, 0, commentCanvas.width, commentCanvas.height);
    for (const c of items) drawBubble(ctx, c.x, c.y, c.n);

    // keep editor aligned on zoom/pan
    if (editorEl && editorForId) {
        const c = items.find(i => i.id === editorForId);
        if (c) {
            const pos = screenXYFromPage(c.x, c.y);
            editorEl.style.left = `${pos.x + 12}px`;
            editorEl.style.top  = `${pos.y}px`;
        }
    }
}

/** hit-test in SCREEN space; returns comment or null */
export function hitTest(e) {
    const s = state.currentScale || 1;
    const r = commentCanvas.getBoundingClientRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    const bubbleR = Math.max(8, Math.min(12 * s, 26));
    for (let i = items.length - 1; i >= 0; i--) {
        const c = items[i];
        const cx = c.x * s;
        const cy = c.y * s;
        if (Math.hypot(sx - cx, sy - cy) <= bubbleR + 3) return c;
    }
    return null;
}

/** re-number sequentially after any delete */
function renumber() {
    items.forEach((c, i) => c.n = i + 1);
}

/** delete one by id */
function deleteById(id) {
    const idx = items.findIndex(c => c.id === id);
    if (idx < 0) return;
    items.splice(idx, 1);
    renumber();
    save();
    redrawComments();
}

/** open inline editor near bubble */
function openEditor(c) {
    closeEditor();

    const pos = screenXYFromPage(c.x, c.y);

    const el = document.createElement('div');
    el.className = 'comment-editor';
    el.style.position = 'absolute';
    el.style.left = `${pos.x + 12}px`;
    el.style.top  = `${pos.y}px`;

    // add these:
    el.style.zIndex = '9999';          // above all canvases
    el.style.pointerEvents = 'auto';   // clickable

    el.innerHTML = `
    <textarea placeholder="Add a note..."></textarea>
    <div class="row">
      <button data-act="save">Save</button>
      <button data-act="delete">Delete</button>
      <button data-act="cancel">Cancel</button>
    </div>
  `;

    const ta = el.querySelector('textarea');
    ta.value = c.text || '';

    el.addEventListener('click', (ev) => {
        const act = ev.target?.getAttribute?.('data-act');
        if (!act) return;

        if (act === 'save') {
            c.text = ta.value.trim();
            save();
            closeEditor();
        } else if (act === 'delete') {
            closeEditor();
            deleteById(c.id);
        } else if (act === 'cancel') {
            closeEditor();
        }
    });

    console.log('DivPdfContainer?', DivPdfContainer);
    console.log('Appending editor…');
    DivPdfContainer.appendChild(el);
    editorEl = el;
    editorForId = c.id;
    ta.focus();
    console.log('Editor in DOM?', document.body.contains(el));
}

function closeEditor() {
    if (editorEl && editorEl.parentNode) editorEl.parentNode.removeChild(editorEl);
    editorEl = null;
    editorForId = null;
}

/** public: wipe everything for current doc (used by Reset) */
export function clearAllComments() {
    items = [];
    save();              // overwrites storage for current key with []
    closeEditor();
    redrawComments();
}

/** init: load, draw, click-to-add/edit in COMMENT mode */
export function initComments() {
    if (debugLogLevelLoading) console.log('comments.js > initComments()');

    load();
    redrawComments();

    commentCanvas.addEventListener('click', (e) => {
        if (actions.activeTool !== actions.TOOL.COMMENT) return;

        const hit = hitTest(e);
        if (hit) {
            openEditor(hit);
            return;
        }

        // create new bubble
        const pt = pageXYFromEvent(e);
        const c = { id: crypto.randomUUID(), n: items.length + 1, x: pt.x, y: pt.y, text: '' };
        items.push(c);
        save();
        redrawComments();
        openEditor(c);
    });
}


export function exportCommentsJSON() {
    if (debugLogLevelLoading) console.log('comments.js > exportCommentsJSON()');

    return JSON.stringify({
        items: items.map(({n, text}) => ({
            n, text: text || ''
        })),
        meta: { exportedAt: new Date().toISOString() }
    }, null, 2);
    // return JSON.stringify({
    //     version: 1,
    //     scale_invariant: true,
    //     items: items.map(({id, n, x, y, text}) => ({
    //         id, n, x, y, text: text || ''
    //     })),
    //     meta: { exportedAt: new Date().toISOString() }
    // }, null, 2);
}


