/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * numbered comment markers with collapsible notes, persisted in localStorage
 * module/ comments.js;
 */

import {debugLogLevelLoading} from './debug.js';
import * as ui from './ui.js';
import * as actions from './actions.js'; // for TOOL / activeTool if you have it
import * as state from './state.js';     // expects currentScale and panOffset (or default to 1 / {0,0})

let items = []; // [{id, n, x, y, text}]  x,y in PAGE coords (pre-scale, pre-pan)
let openEditorId = null; // only one editor open at a time
let docKey = 1;
const key = () => `vm:comments:${docKey || 'default'}`;

function load() {
    if (debugLogLevelLoading) console.log('comments.js > load() function called');

    try { items = JSON.parse(localStorage.getItem(key()) || '[]'); }
    catch { items = []; }
}
function save() {
    localStorage.setItem(key(), JSON.stringify(items));
}

function screenXY(x, y) {
    const s = state.currentScale || 1; // layer will be translated by pan, so we only multiply by scale here
    return { left: x * s, top: y * s };
}

function pageXYFromEvent(e) {
    const rect = ui.DivPdfContainer.getBoundingClientRect();
    const s = state.currentScale || 1;
    const pan = state.panOffset || { x: 0, y: 0 };
    const px = e.clientX - rect.left - pan.x;
    const py = e.clientY - rect.top  - pan.y;
    return { x: px / s, y: py / s };
}

function clearLayer() { ui.CommentLayer.innerHTML = ''; }

function renderOne(c) {
    // badge
    const b = document.createElement('div');
    b.className = 'comment-badge';
    b.dataset.id = c.id;
    b.textContent = c.n;

    const p = screenXY(c.x, c.y);
    b.style.left = `${p.left}px`;
    b.style.top  = `${p.top}px`;
    b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        showEditor(c.id);
    });
    ui.CommentLayer.appendChild(b);

    // editor (only if open)
    if (openEditorId === c.id) {
        const wrap = document.createElement('div');
        wrap.className = 'comment-editor';
        wrap.dataset.id = c.id;
        wrap.style.left = `${p.left}px`;
        wrap.style.top  = `${p.top}px`;
        wrap.innerHTML = `
      <div style="font-weight:600; margin-bottom:6px;">Comment ${c.n}</div>
      <textarea>${c.text || ''}</textarea>
      <div class="row">
        <button data-act="save">Save</button>
        <button data-act="cancel">Cancel</button>
      </div>
    `;
        wrap.querySelector('[data-act="save"]').addEventListener('click', () => {
            const ta = wrap.querySelector('textarea');
            c.text = ta.value;
            save();
            openEditorId = null;
            renderAll();
        });
        wrap.querySelector('[data-act="cancel"]').addEventListener('click', () => {
            // if new & empty, remove it
            if (!c.text || !c.text.trim()) {
                // detect if it was just created and has no text
                items = items.filter(it => it.id !== c.id);
                // re-number
                items.forEach((it, i) => it.n = i + 1);
                save();
            }
            openEditorId = null;
            renderAll();
        });
        ui.CommentLayer.appendChild(wrap);
    }
}

function renderAll() {
    if (debugLogLevelLoading) console.log('comments.js > renderAll() function called');

    if (!ui.CommentLayer) return;
    clearLayer();
    for (const c of items) renderOne(c);
}

export function initComments() {
    if (debugLogLevelLoading) console.log('comments.js > initComments() function called');

    load();
    renderAll();

    // event delegation: click empty space to add comment (only in COMMENT tool)
    ui.CommentLayer.addEventListener('click', (e) => {
        if (actions.activeTool !== actions.TOOL.COMMENT) return;
        if (e.target.closest('.comment-badge, .comment-editor')) return; // ignore UI
        const pt = pageXYFromEvent(e);
        const c = {
            id: crypto.randomUUID(),
            n: items.length + 1,
            x: pt.x, y: pt.y,
            text: ''
        };
        items.push(c);
        save();
        openEditorId = c.id;   // open editor immediately
        renderAll();
    }, false);
}

export function showEditor(id) {
    openEditorId = id;
    renderAll();
}

export function applyCommentTransform() {
    // keep the whole layer translated/scaled like your overlay canvases
    const s = state.currentScale || 1;
    const p = state.panOffset || { x: 0, y: 0 };
    ui.CommentLayer.style.transform = `translate(${p.x}px, ${p.y}px) scale(${s})`;
    ui.CommentLayer.style.transformOrigin = 'top left';
    // badges/editors are positioned in page*scale space, so no extra work here
}
//
// export function setLayerInteractive(on) {
//     // pointer-events only when COMMENT tool active
//     ui.CommentLayer.style.pointerEvents = on ? 'auto' : 'none';
// }
//


//
// import * as ui from './ui.js';
// import * as state from './state.js'; // expect state.currentScale and panOffset if you store them here
//
// // Storage key per document (use your own doc id/source if available)
// function getDocKey() {
//     // If you have a pdfUrl or docId in state, use that. Otherwise default:
//     return state.docKey || 'vm:default-document';
// }
// const LS_KEY = () => `vm:comments:${getDocKey()}`;
//
// let comments = []; // [{id, idx, x, y, text, open, createdAt}]; x,y in PAGE coords
//
// function save() {
//     localStorage.setItem(LS_KEY(), JSON.stringify(comments));
// }
// function load() {
//     try {
//         comments = JSON.parse(localStorage.getItem(LS_KEY()) || '[]');
//     } catch { comments = []; }
// }
//
// export function initComments() {
//     load();
//     renderAll();
// }
//
// export function setDocKey(docKey) {
//     state.docKey = docKey;
// }
//
// function nextIndex() { return comments.length + 1; }
//
// function screenFromPage(x, y) {
//     const s = state.currentScale || 1;
//     // pan is applied to the whole layer via CSS transform, so positions here are pre-transform (page*scale)
//     return { left: x * s, top: y * s };
// }
//
// function pageFromEvent(e) {
//     const rect = ui.DivPdfContainer.getBoundingClientRect();
//     const s = state.currentScale || 1;
//     const px = e.clientX - rect.left - (state.panOffset?.x || 0);
//     const py = e.clientY - rect.top  - (state.panOffset?.y || 0);
//     return { x: px / s, y: py / s };
// }
//
// // ----- DOM helpers -----
// function badgeId(id) { return `c-badge-${id}`; }
// function noteId(id)  { return `c-note-${id}`; }
//
// function makeBadge(c) {
//     const el = document.createElement('div');
//     el.className = 'comment-badge';
//     el.id = badgeId(c.id);
//     el.textContent = c.idx;
//     const pos = screenFromPage(c.x, c.y);
//     el.style.left = `${pos.left}px`;
//     el.style.top  = `${pos.top}px`;
//
//     el.addEventListener('click', (ev) => {
//         ev.stopPropagation();
//         toggleNote(c.id, true);
//     });
//     return el;
// }
//
// function makeNote(c) {
//     const wrap = document.createElement('div');
//     wrap.className = 'comment-note';
//     wrap.id = noteId(c.id);
//
//     // place the note next to the badge (absolute; same left/top as badge container)
//     const pos = screenFromPage(c.x, c.y);
//     wrap.style.left = `${pos.left}px`;
//     wrap.style.top  = `${pos.top}px`;
//
//     wrap.innerHTML = `
//     <div style="font-weight:600; margin-bottom:6px;">Comment ${c.idx}</div>
//     <textarea>${c.text || ''}</textarea>
//     <div class="row">
//       <button type="button" data-act="save">Save</button>
//       <button type="button" data-act="delete">Delete</button>
//       <button type="button" data-act="close">Close</button>
//     </div>
//   `;
//
//     const ta = wrap.querySelector('textarea');
//     wrap.querySelector('[data-act="save"]').addEventListener('click', () => {
//         c.text = ta.value;
//         save();
//     });
//     wrap.querySelector('[data-act="delete"]').addEventListener('click', () => {
//         deleteComment(c.id);
//     });
//     wrap.querySelector('[data-act="close"]').addEventListener('click', () => {
//         toggleNote(c.id, false);
//     });
//
//     return wrap;
// }
//
// function toggleNote(id, open) {
//     const c = comments.find(x => x.id === id);
//     if (!c) return;
//     c.open = open;
//     save();
//     renderAll(); // simple re-render
// }
//
// // ----- Public API -----
//
// export function handleCommentClick(e) {
//     // Only add when COMMENT tool is active and not clicking UI
//     if (actions.activeTool !== actions.TOOL.COMMENT) return;
//     if (e.target.closest('.comment-badge, .comment-editor')) return;
//
//     const pt = pageXYFromEvent(e);
//     const c = {
//         id: crypto.randomUUID(),
//         n: items.length + 1,
//         x: pt.x, y: pt.y,
//         text: ''
//     };
//     items.push(c);
//     save();
//     openEditorId = c.id;   // open editor immediately
//     renderAll();
// }
//
// export function renderAll() {
//     if (!ui.CommentLayer) return;
//     ui.CommentLayer.innerHTML = ''; // simple full re-render (small count ~ fine)
//
//     for (const c of comments) {
//         const b = makeBadge(c);
//         ui.CommentLayer.appendChild(b);
//         if (c.open) {
//             const n = makeNote(c);
//             ui.CommentLayer.appendChild(n);
//         }
//     }
// }
//
// export function renumber() {
//     comments.forEach((c, i) => c.idx = i + 1);
// }
//
// export function deleteComment(id) {
//     const idx = comments.findIndex(x => x.id === id);
//     if (idx < 0) return;
//     comments.splice(idx, 1);
//     renumber();
//     save();
//     renderAll();
// }
//
// export function clearAllComments() {
//     comments = [];
//     save();
//     renderAll();
// }
//
// export function exportComments() {
//     // Export as JSON (page-space coords)
//     const data = {
//         docKey: getDocKey(),
//         exportedAt: new Date().toISOString(),
//         comments,
//     };
//     const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `comments-${getDocKey().replace(/[^\w-]+/g, '_')}.json`;
//     a.click();
//     URL.revokeObjectURL(url);
// }
//
// export function importComments(jsonString) {
//     try {
//         const data = JSON.parse(jsonString);
//         if (Array.isArray(data.comments)) {
//             comments = data.comments;
//             save();
//             renderAll();
//         }
//     } catch {}
// }
//
// // Keep layer visually aligned with pan/zoom
// export function applyTransformLikeCanvases() {
//     const s = state.currentScale || 1;
//     const p = state.panOffset || { x: 0, y: 0 };
//     if (!ui.CommentLayer) return;
//     ui.CommentLayer.style.transform = `translate(${p.x}px, ${p.y}px) scale(${s})`;
//     ui.CommentLayer.style.transformOrigin = 'top left';
//
//     // Also reposition opened notes and badges (their left/top are in screen coords)
//     // We simply rebuild after a zoom or size change:
//     renderAll();
// }
