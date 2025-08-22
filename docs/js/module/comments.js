/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * numbered comment markers with collapsible notes, persisted in localStorage
 * module/ comments.js;
 */

import {debugLogLevelLoading} from '../debug.js';
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
