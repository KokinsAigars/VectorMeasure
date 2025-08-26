/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ measure.js;
 */

import { debugLogLevelA } from "../debug.js";
import { DivInfo, DivMeasurementTip } from "./ui.js";
import { measureCanvas, previewCanvas } from './canvas.js';
import * as state from './state.js';

let startPoint = null;
let isDrawing = false;
let lastMeasuredStart = null;
let lastMeasuredEnd = null;
let measuring = false;

// keep page-space copies so we can reproject on zoom
let lastMeasuredStartPage = null;
let lastMeasuredEndPage = null;

export function setMeasureActive(on) {
    if(debugLogLevelA) console.log('measure.js > setMeasureActive() is called');

    if (on === measuring) return; // no-op
    measuring = on;

    if (on) {
        // Let this canvas receive clicks/mousemove
        measureCanvas.style.pointerEvents = 'auto';
        previewCanvas.style.pointerEvents = 'none'; // purely visual overlay

        measureCanvas.addEventListener('click',     (e) => { canvasOnMeasureClick(e); });
        measureCanvas.addEventListener('mousemove', (e) => { onMeasureMove(e); });
        measureCanvas.addEventListener('mouseleave', () => { hideTipAndPreview(); });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') cancelCurrentMeasure();
        });

        if (DivInfo) DivInfo.innerText = 'Click two points to measure. (Esc to cancel)';

    }
    else {
        measureCanvas.removeEventListener('click',     (e) => { canvasOnMeasureClick(e) });
        measureCanvas.removeEventListener('mousemove', (e) => { onMeasureMove(e); });
        measureCanvas.removeEventListener('mouseleave', () => { hideTipAndPreview(); });
        window.removeEventListener('keydown', (e) => {
            if (e.key === 'Escape') cancelCurrentMeasure();
        });

        measureCanvas.style.pointerEvents = 'none';
        cancelCurrentMeasure();

        if (DivInfo) DivInfo.innerText = '';
    }
}

function hideTipAndPreview() {
    if(debugLogLevelA) console.log('measure.js > hideTipAndPreview() is called');

    if (DivMeasurementTip) DivMeasurementTip.style.display = 'none';

    const p_ctx = previewCanvas.getContext('2d');
    p_ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
}

export function clearMeasurementState() {
    console.log('measure.js > clearMeasurementState() is called');

    startPoint = null;
    lastMeasuredStart = null;
    lastMeasuredEnd = null;
    lastMeasuredStartPage = null;
    lastMeasuredEndPage = null;
    isDrawing = false;
}

export function cancelCurrentMeasure() {
    if(debugLogLevelA) console.log('measure.js > cancelCurrentMeasure() is called');

    // reset transient state + visuals
    clearMeasurementState();
    hideTipAndPreview();

    // also clear the permanent line if the user cancels midway
    const m_ctx = measureCanvas.getContext('2d');
    m_ctx.clearRect(0, 0, measureCanvas.width, measureCanvas.height);

    const c_tx = previewCanvas.getContext('2d');
    c_tx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
}

export function onMeasureMove(event) {
    console.log('measure.js > onMeasureMove(event) is called');

    if (!isDrawing || !startPoint) return;

    const rect = previewCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const p_ctx = previewCanvas.getContext('2d');
    p_ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    p_ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    p_ctx.lineWidth = 4;
    p_ctx.beginPath();
    p_ctx.moveTo(startPoint.x, startPoint.y);
    p_ctx.lineTo(x, y);
    p_ctx.stroke();

    const dx = x - startPoint.x;
    const dy = y - startPoint.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    const meters = state.pxPerMeter ? pixelDistance / state.pxPerMeter : pixelDistance;

    const flooredMeters = Math.floor(meters * 10) / 10;
    const isWhole = flooredMeters % 1 === 0;
    const distanceText = isWhole
        ? `${flooredMeters.toFixed(0)} m`
        : `${flooredMeters.toFixed(1)} m`;

    const tooltip = document.getElementById('measurement-tip');
    tooltip.innerText = distanceText;
    tooltip.style.left = `${event.clientX + 12}px`;
    tooltip.style.top = `${event.clientY + 12}px`;
    tooltip.style.display = 'block';
}

export function canvasOnMeasureClick(event) {
    console.log('measure.js > canvasOnMeasureClick(event) is called');

    if (!measureCanvas || !state.pxPerMeter) return;

    const rect = measureCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const m_ctx = measureCanvas.getContext('2d');

    if (!startPoint) {
        m_ctx.clearRect(0, 0, measureCanvas.width, measureCanvas.height);
        startPoint = { x, y };
        isDrawing = true;
    } else {
        m_ctx.strokeStyle = 'rgba(255, 0, 0)';
        m_ctx.lineWidth = 4;
        m_ctx.beginPath();
        m_ctx.moveTo(startPoint.x, startPoint.y);
        m_ctx.lineTo(x, y);
        m_ctx.stroke();

        // keep both overlay-space (for current UI tooltips/calibration)
        // and page-space (for stable redraw after zoom)
        lastMeasuredStart = startPoint;
        lastMeasuredEnd = { x, y };
        const s = state.currentScale || 1;
        lastMeasuredStartPage = { x: startPoint.x / s, y: startPoint.y / s };
        lastMeasuredEndPage   = { x: x / s, y: y / s };

        const dx = x - startPoint.x;
        const dy = y - startPoint.y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);
        const meters = pixelDistance / state.pxPerMeter;

        const firstDecimalDigit = Math.floor((meters * 10) % 10);
        const displayDistance = firstDecimalDigit === 0
            ? `${Math.round(meters)} m`
            : `${meters.toFixed(2)} m`;

        document.getElementById('info').innerText = `📏 Segment: ${displayDistance}`;

        const p_ctx = previewCanvas.getContext('2d');
        p_ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        startPoint = null;
        isDrawing = false;

        document.getElementById('measurement-tip').style.display = 'none';
    }
}

export function getMeasurementPoints() {
    console.log('measure.js > getMeasurementPoints() is called');

    return { lastMeasuredStart, lastMeasuredEnd };
}

// ---- keep the last measured line aligned after zoom/resize
export function redrawMeasurement() {
  if (!measureCanvas) return;
  const ctx = measureCanvas.getContext('2d');
  ctx.clearRect(0, 0, measureCanvas.width, measureCanvas.height);

  if (!lastMeasuredStartPage || !lastMeasuredEndPage) return;
  const s = state.currentScale || 1;
  const x1 = lastMeasuredStartPage.x * s;
  const y1 = lastMeasuredStartPage.y * s;
  const x2 = lastMeasuredEndPage.x   * s;
  const y2 = lastMeasuredEndPage.y   * s;

  ctx.strokeStyle = 'rgba(255,0,0)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}
