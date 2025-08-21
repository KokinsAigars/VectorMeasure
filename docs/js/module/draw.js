/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * Adds simple line drawing with live preview and zoom-safe storage.
 * module/ draw.js;
 */

import { debugLogLevelA } from '../debug.js';
import * as state from './state.js';
import { drawingCanvas, previewCanvas } from './canvas.js';

let drawing = false;
let start = null;
const HIT_TOLERANCE_SCR = 8;

/** Store lines in PAGE coordinates so they scale with zoom nicely */
const lines = []; // [{x1,y1,x2,y2,color,width} in page px]

function canvasPointFromEvent(canvas, e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function clearPreview() {
    const p = previewCanvas?.getContext('2d');
    if (!p) return;
    p.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
}

function stroke(ctx, x1, y1, x2, y2, color = '#1f7aed', width = 3) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

/** Public: mousedown on drawingCanvas */
export function onDrawMouseDown(e) {
    if (!drawingCanvas) return;
    drawing = true;
    start = canvasPointFromEvent(drawingCanvas, e);

    if (debugLogLevelA) console.log('draw.js > start', start);
}

/** Public: mousemove (document) */
export function onDrawMouseMove(e) {
    if (!drawing || !start) return;
    if (!previewCanvas) return;

    const curr = canvasPointFromEvent(drawingCanvas, e);
    const p = previewCanvas.getContext('2d');
    clearPreview();
    stroke(p, start.x, start.y, curr.x, curr.y, 'rgba(31,122,237,0.6)', 3);
}

/** Public: mouseup (document) */
export function onDrawMouseUp(e) {
    if (!drawing || !start) return;
    if (!drawingCanvas) return;

    const end = canvasPointFromEvent(drawingCanvas, e);

    // Save in PAGE space
    const s = state.currentScale || 1;
    lines.push({
        x1: start.x / s,
        y1: start.y / s,
        x2: end.x / s,
        y2: end.y / s,
        color: '#1f7aed',
        width: 3,
    });

    // Paint permanently onto drawingCanvas
    const ctx = drawingCanvas.getContext('2d');
    stroke(ctx, start.x, start.y, end.x, end.y, '#1f7aed', 3);

    // cleanup
    clearPreview();
    drawing = false;
    start = null;

    if (debugLogLevelA) console.log('draw.js > saved lines:', lines.length);
}

/** Public: if user switches tool mid-draw */
export function cancelDrawing() {
    drawing = false;
    start = null;
    clearPreview();
}

/** Public: redraw all stored lines after zoom/resize */
export function redrawAllLines() {
    if (!drawingCanvas) return;
    const ctx = drawingCanvas.getContext('2d');
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

    const s = state.currentScale || 1;
    for (const L of lines) {
        stroke(ctx, L.x1 * s, L.y1 * s, L.x2 * s, L.y2 * s, L.color || '#1f7aed', L.width || 3);
    }
}

// export function clearAllLines() {
//     lines.length = 0;
//     if (!drawingCanvas) return;
//     const ctx = drawingCanvas.getContext('2d');
//     ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
// }

// Utility: shortest distance from point to segment (screen space)
function distPointToSeg(px, py, x1, y1, x2, y2) {
    const vx = x2 - x1, vy = y2 - y1;
    const wx = px - x1, wy = py - y1;
    const c1 = vx * wx + vy * wy;
    if (c1 <= 0) return Math.hypot(px - x1, py - y1);
    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) return Math.hypot(px - x2, py - y2);
    const t = c1 / c2;
    const projx = x1 + t * vx;
    const projy = y1 + t * vy;
    return Math.hypot(px - projx, py - projy);
}
// Find nearest line index under cursor within tolerance (returns -1 if none)
function findLineIndexAtEvent(e) {
    if (!drawingCanvas) return -1;
    const pt = canvasPointFromEvent(drawingCanvas, e);
    const s = state.currentScale || 1;

    let bestIdx = -1;
    let bestDist = Infinity;

    for (let i = 0; i < lines.length; i++) {
        const L = lines[i];
        // Convert PAGE → SCREEN coords (multiply by currentScale)
        const x1 = L.x1 * s, y1 = L.y1 * s, x2 = L.x2 * s, y2 = L.y2 * s;
        const d = distPointToSeg(pt.x, pt.y, x1, y1, x2, y2);
        if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
        }
    }
    return bestDist <= HIT_TOLERANCE_SCR ? bestIdx : -1;
}
// Public: hover highlight for delete mode
export function onDeleteHover(e) {
    if (!previewCanvas || !drawingCanvas) return;
    clearPreview();

    const idx = findLineIndexAtEvent(e);
    if (idx < 0) return;

    const p_ctx = previewCanvas.getContext('2d');
    const s = state.currentScale || 1;
    const L = lines[idx];

    // red dashed highlight
    stroke(p_ctx, L.x1 * s, L.y1 * s, L.x2 * s, L.y2 * s, '#e53935', 4);
}
// Public: click to delete line
export function onDeleteClick(e) {
    const idx = findLineIndexAtEvent(e);
    if (idx < 0) return;

    lines.splice(idx, 1);
    clearPreview();
    redrawAllLines(); // reuse your existing function
}

// Public: clear highlight on leave or tool change
export function clearDeleteHover() {
    clearPreview();
}
