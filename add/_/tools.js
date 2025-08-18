/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ tools.js;
 */

import { debugLogLevelA } from "./debug.js";

import * as ui from './ui.js';
import { measureCanvas, previewCanvas, drawingCanvas, pdfCanvas, renderAtCurrentTransform } from './canvas.js';
import * as state from './state.js';

const TOOL = Object.freeze({ NONE:'NONE', PAN:'PAN', MEASURE:'MEASURE', DRAW:'DRAW' });
let activeTool = TOOL.NONE;

// transient states
let measureStart = null;
let drawStart = null;
let isPanning = false;
let panStart = { x:0, y:0 };

// ---- public init ----
export function initTools() {
    wireButtons();
    wireCanvas();
    setTool(TOOL.NONE);
}

// ---- UI wiring ----
function wireButtons() {
    ui.BtnMeasure?.addEventListener('click', () => toggleTool(TOOL.MEASURE));
    ui.BtnAddLine?.addEventListener('click', () => toggleTool(TOOL.DRAW));
    ui.BtnPanToggle?.addEventListener('click', () => toggleTool(TOOL.PAN));

    // keep zoom minimal & local
    ui.BtnZoomIn?.addEventListener('click', handleZoomIn);
    ui.BtnZoomOut?.addEventListener('click', handleZoomOut);

    // optional: Esc cancels transient ops
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cancelTransient();
    });
}

function wireCanvas() {
    // MEASURE
    measureCanvas.addEventListener('click', onMeasureClick);
    measureCanvas.addEventListener('mousemove', onMeasureMove);

    // DRAW
    drawingCanvas.addEventListener('mousedown', onDrawDown);
    document.addEventListener('mousemove', onDrawMove);
    document.addEventListener('mouseup', onDrawUp);

    // PAN
    pdfCanvas.addEventListener('mousedown', onPanDown);
    document.addEventListener('mousemove', onPanMove);
    document.addEventListener('mouseup', onPanUp);
}

// ---- tool switching ----
function toggleTool(tool) {
    setTool(activeTool === tool ? TOOL.NONE : tool);
}

function setTool(tool) {
    activeTool = tool;

    // pointer interactivity
    setInteractive(measureCanvas, tool === TOOL.MEASURE, 'crosshair');
    setInteractive(drawingCanvas, tool === TOOL.DRAW, 'crosshair');
    setInteractive(pdfCanvas,     tool === TOOL.PAN, 'grab');

    // button states
    renderButton(ui.BtnMeasure,   tool === TOOL.MEASURE, '📏 Measure Distance', '✅ Measuring');
    renderButton(ui.BtnAddLine,   tool === TOOL.DRAW,    'Line',                '✅ Line');
    renderButton(ui.BtnPanToggle, tool === TOOL.PAN,     'Pan',                 '✅ Pan');

    // clear previews/tips when switching tools
    cancelTransient();
}

function setInteractive(canvas, on, cursor) {
    canvas.style.pointerEvents = on ? 'auto' : 'none';
    canvas.style.cursor = on ? cursor : 'default';
}

function renderButton(btn, on, offLabel, onLabel) {
    if (!btn) return;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.dataset.mode = on ? 'on' : 'off';
    btn.textContent = on ? onLabel : offLabel;
}

// ---- measurement ----
function onMeasureClick(e) {
    if (activeTool !== TOOL.MEASURE) return;
    const p = localXY(e, measureCanvas);
    const mCtx = measureCanvas.getContext('2d');
    const gCtx = previewCanvas.getContext('2d');

    if (!measureStart) {
        measureStart = p;
        ui.DivInfo.innerText = 'Click second point…';
    } else {
        // finalize segment
        mCtx.strokeStyle = 'rgba(255,0,0,1)';
        mCtx.lineWidth = 4;
        mCtx.beginPath(); mCtx.moveTo(measureStart.x, measureStart.y); mCtx.lineTo(p.x, p.y); mCtx.stroke();

        const meters = dist(measureStart, p) / state.pxPerMeter;
        ui.DivInfo.innerText = `📏 Segment: ${fmtMeters(meters)}`;

        gCtx.clearRect(0,0, previewCanvas.width, previewCanvas.height);
        hideTip();
        measureStart = null;
    }
}

function onMeasureMove(e) {
    if (activeTool !== TOOL.MEASURE || !measureStart) return;
    const p = localXY(e, measureCanvas);
    const gCtx = previewCanvas.getContext('2d');

    gCtx.clearRect(0,0, previewCanvas.width, previewCanvas.height);
    gCtx.strokeStyle = 'rgba(255,0,0,.5)';
    gCtx.lineWidth = 4;
    gCtx.beginPath(); gCtx.moveTo(measureStart.x, measureStart.y); gCtx.lineTo(p.x, p.y); gCtx.stroke();

    const meters = dist(measureStart, p) / state.pxPerMeter;
    showTip(e.clientX, e.clientY, fmtMetersTooltip(meters));
}

// ---- drawing ----
function onDrawDown(e) {
    if (activeTool !== TOOL.DRAW) return;
    drawStart = localXY(e, drawingCanvas);
}

function onDrawMove(e) {
    if (activeTool !== TOOL.DRAW || !drawStart) return;
    const p = localXY(e, drawingCanvas);
    const gCtx = previewCanvas.getContext('2d');

    gCtx.clearRect(0,0, previewCanvas.width, previewCanvas.height);
    gCtx.lineWidth = 3;
    gCtx.beginPath(); gCtx.moveTo(drawStart.x, drawStart.y); gCtx.lineTo(p.x, p.y); gCtx.stroke();
}

function onDrawUp(e) {
    if (activeTool !== TOOL.DRAW || !drawStart) return;
    const end = localXY(e, drawingCanvas);
    const dCtx = drawingCanvas.getContext('2d');

    dCtx.lineWidth = 3;
    dCtx.beginPath(); dCtx.moveTo(drawStart.x, drawStart.y); dCtx.lineTo(end.x, end.y); dCtx.stroke();

    previewCanvas.getContext('2d').clearRect(0,0, previewCanvas.width, previewCanvas.height);
    drawStart = null;
}

// ---- pan ----
function onPanDown(e) {
    if (activeTool !== TOOL.PAN) return;
    isPanning = true;
    pdfCanvas.style.cursor = 'grabbing';
    panStart = { x: e.clientX - state.panOffset.x, y: e.clientY - state.panOffset.y };
}

function onPanMove(e) {
    if (!isPanning || activeTool !== TOOL.PAN) return;
    const x = e.clientX - panStart.x;
    const y = e.clientY - panStart.y;
    state.setPanOffset(x, y);

    ['#pdf-canvas', '#measure-canvas', '#preview-canvas', '#drawing-canvas'].forEach(sel => {
        const c = document.querySelector(sel);
        if (c) { c.style.transform = `translate(${x}px, ${y}px)`; c.style.transformOrigin = 'top left'; }
    });
}

function onPanUp() {
    if (!isPanning) return;
    isPanning = false;
    pdfCanvas.style.cursor = activeTool === TOOL.PAN ? 'grab' : 'default';
}

// ---- zoom (kept minimal here) ----
async function handleZoomIn() {
    const next = Math.min(state.currentScale + state.ZOOM.step, state.ZOOM.max);
    if (next === state.currentScale) return;
    state.setCurrentScale(next);
    state.recomputePxPerMeter();
    cancelTransient();
    await renderAtCurrentTransform();
}

async function handleZoomOut() {
    const next = Math.max(state.currentScale - state.ZOOM.step, state.ZOOM.min);
    if (next === state.currentScale) return;
    state.setCurrentScale(next);
    state.recomputePxPerMeter();
    cancelTransient();
    await renderAtCurrentTransform();
}

// ---- helpers ----
function cancelTransient() {
    previewCanvas.getContext('2d').clearRect(0,0, previewCanvas.width, previewCanvas.height);
    measureStart = null;
    drawStart = null;
    hideTip();
}

function showTip(x, y, text) {
    ui.DivMeasurementTip.innerText = text;
    ui.DivMeasurementTip.style.left = `${x + 12}px`;
    ui.DivMeasurementTip.style.top = `${y + 12}px`;
    ui.DivMeasurementTip.style.display = 'block';
}

function hideTip() { ui.DivMeasurementTip.style.display = 'none'; }

function localXY(e, el) { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function dist(a,b) { return Math.hypot(b.x - a.x, b.y - a.y); }
function fmtMeters(m) { const dm = Math.floor(m*10)/10; return (dm % 1 === 0 ? dm.toFixed(0) : dm.toFixed(1)) + ' m'; }
const fmtMetersTooltip = fmtMeters;





