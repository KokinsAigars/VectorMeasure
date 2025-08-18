/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ measure.js;
 */

import { debugLogLevelA } from "./debug.js";
import { DivInfo, DivMeasurementTip } from "./ui.js";
import { measureCanvas, previewCanvas, renderAtCurrentTransform } from './canvas.js';
import * as state from './state.js';
import { isPanning, panStart } from './actions.js';

let startPoint = null;
let isDrawing = false;
let lastMeasuredStart = null;
let lastMeasuredEnd = null;
let measuring = false;

const previewCtx = () => previewCanvas.getContext('2d');
const measureCtx = () => measureCanvas.getContext('2d');


/**
 * Turn measurement mode on/off.
 */
export function setMeasureActive(on) {
    if (on === measuring) return; // no-op
    measuring = on;

    if (on) {
        // Let this canvas receive clicks/mousemove
        measureCanvas.style.pointerEvents = 'auto';
        previewCanvas.style.pointerEvents = 'none'; // purely visual overlay

        measureCanvas.addEventListener('click',     handleMeasureClick);
        measureCanvas.addEventListener('mousemove', handleMeasureMove);
        measureCanvas.addEventListener('mouseleave', handleLeave);
        window.addEventListener('keydown', handleKeydown);

        if (DivInfo) DivInfo.innerText = 'Click two points to measure. (Esc to cancel)';

    } else {
        measureCanvas.removeEventListener('click',     handleMeasureClick);
        measureCanvas.removeEventListener('mousemove', handleMeasureMove);
        measureCanvas.removeEventListener('mouseleave', handleLeave);
        window.removeEventListener('keydown', handleKeydown);

        measureCanvas.style.pointerEvents = 'none';
        cancelCurrentMeasure();

        if (DivInfo) DivInfo.innerText = '';
    }
}


// --- named handlers so we can remove them later ---
function handleMeasureClick(e)  { canvasOnMeasureClick(e); }
function handleMeasureMove(e)   { onMeasureMove(e); }
function handleKeydown(e)       { if (e.key === 'Escape') cancelCurrentMeasure(); }
function handleLeave()          { hideTipAndPreview(); }

function hideTipAndPreview() {
    if (DivMeasurementTip) DivMeasurementTip.style.display = 'none';

    const p_ctx = previewCanvas.getContext('2d');
    p_ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
}

export function cancelCurrentMeasure() {
    // reset transient state + visuals
    clearMeasurementState();
    hideTipAndPreview();

    // also clear the permanent line if the user cancels midway
    const m_ctx = measureCanvas.getContext('2d');
    m_ctx.clearRect(0, 0, measureCanvas.width, measureCanvas.height);
}


export function isMeasureActive() { return measuring; }








export function onMeasureMove(event) {
    console.log('measure.js > onMeasureMove(event) is called');

    if (!isDrawing || !startPoint) return;

    const rect = previewCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const ctx = previewCtx();
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();

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

    const ctx = measureCtx();

    if (!startPoint) {
        ctx.clearRect(0, 0, measureCanvas.width, measureCanvas.height);
        startPoint = { x, y };
        isDrawing = true;
    } else {
        ctx.strokeStyle = 'rgba(255, 0, 0)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        lastMeasuredStart = startPoint;
        lastMeasuredEnd = { x, y };

        const dx = x - startPoint.x;
        const dy = y - startPoint.y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);
        const meters = pixelDistance / state.pxPerMeter;

        const firstDecimalDigit = Math.floor((meters * 10) % 10);
        const displayDistance = firstDecimalDigit === 0
            ? `${Math.round(meters)} m`
            : `${meters.toFixed(2)} m`;

        document.getElementById('info').innerText = `📏 Segment: ${displayDistance}`;

        previewCtx().clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        startPoint = null;
        isDrawing = false;

        document.getElementById('measurement-tip').style.display = 'none';
    }
}

export function getMeasurementPoints() {
    console.log('measure.js > getMeasurementPoints() is called');

    return { lastMeasuredStart, lastMeasuredEnd };
}

export function clearMeasurementState() {
    console.log('measure.js > clearMeasurementState() is called');

    startPoint = null;
    lastMeasuredStart = null;
    lastMeasuredEnd = null;
    isDrawing = false;
}

export function cancelMeasurement() {
    if (debugLogLevelA) console.log('measure.js > cancelMeasurement() is called');

    const ctx = previewCanvas.getContext('2d');

    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    startPoint = null;
    isDrawing = false;

    DivInfo.innerText = 'Measuring mode stopped by ESC.';
    DivMeasurementTip.style.display = 'none';
}
