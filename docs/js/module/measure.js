/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ measure.js;
 */

import { measureCanvas, previewCanvas } from './canvas.js';
import { pxPerMeter } from './state.js';
import { addSegment } from './measure_model.js';
import { overlayToPageXY } from './coord.js';

let startPoint = null;
let lastMeasuredStart = null;
let lastMeasuredEnd = null;
let isDrawing = false;

const previewCtx = () => previewCanvas.getContext('2d');
const measureCtx = () => measureCanvas.getContext('2d');

export function canvasOnMeasureClick(event) {
    console.log('measure.js > onMeasureClick()')
    if (!measureCanvas || !pxPerMeter) return;

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
        const meters = pixelDistance / pxPerMeter;

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

export function onMeasureMove(event) {
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
    const meters = pxPerMeter ? pixelDistance / pxPerMeter : pixelDistance;

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

export function getMeasurementPoints() {
    return { lastMeasuredStart, lastMeasuredEnd };
}

export function clearMeasurementState() {
    startPoint = null;
    lastMeasuredStart = null;
    lastMeasuredEnd = null;
    isDrawing = false;
}

export function cancelMeasurement() {

    console.log('cancelMeasurement() is called');

    const previewCanvasEl = document.getElementById('preview-canvas');
    const ctx = previewCanvasEl.getContext('2d');

    ctx.clearRect(0, 0, previewCanvasEl.width, previewCanvasEl.height);

    startPoint = null;
    isDrawing = false;

    document.getElementById('info').innerText = 'Measuring mode stopped by ESC.';
    document.getElementById('measurement-tip').style.display = 'none';
}

export function commitSegment(startOverlay, endOverlay) {
    const aPage = overlayToPageXY(startOverlay);
    const bPage = overlayToPageXY(endOverlay);
    addSegment(aPage, bPage);
}

