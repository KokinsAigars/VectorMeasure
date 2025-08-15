/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ actions.js;
 */

import { debugLog } from './debug.js';
import * as state from './state.js';
import {clearCanvasContainer, drawingCanvas, pdfCanvas, renderAtCurrentTransform} from './canvas.js';
import { PdfPlanPath, PdfPlanReversePath, PdfPlanVerticalPath, pxPerMeter } from "./state.js";
import { loadPdfByName } from './loader.js';

let isPanning = false;
let panStart = { x: 0, y: 0 };

export async function handleZoomIn() {
    if(debugLog) console.log('actions.js > handleZoomIn() is called');

    const next = Math.min(state.currentScale + state.ZOOM.step, state.ZOOM.max);
    if (next === state.currentScale) return;
    state.setCurrentScale(next);
    state.recomputePxPerMeter();
    await renderAtCurrentTransform();
}

export async function handleZoomOut() {
    if(debugLog) console.log('actions.js > handleZoomOut() is called');

    const next = Math.max(state.currentScale - state.ZOOM.step, state.ZOOM.min);
    if (next === state.currentScale) return;
    state.setCurrentScale(next);
    state.recomputePxPerMeter();
    await renderAtCurrentTransform();
}

export function startPan(event) {
    if(debugLog) console.log('actions.js > startPan(event) is called');

    isPanning = true;
    panStart = { x: event.clientX - state.panOffset.x, y: event.clientY - state.panOffset.y };
}

export function movePan(event) {
    if(debugLog) console.log('actions.js > movePan(event) is called');

    if (!isPanning) return;
    const x = event.clientX - panStart.x;
    const y = event.clientY - panStart.y;
    state.setPanOffset(x, y);

    // Pan is CSS translate on overlays; update transform only
    const all = document.querySelectorAll(
        '#pdf-canvas, #measure-canvas, #preview-canvas, #drawing-canvas'
    );
    all.forEach(c => {
        c.style.transform = `translate(${x}px, ${y}px)`;
        c.style.transformOrigin = 'top left';
    });
}

export function endPan() {
    if(debugLog) console.log('actions.js > endPan() is called');

    isPanning = false;
}

export async function handleResetView() {
    if(debugLog) console.log('actions.js > handleResetView() is called');

    clearCanvasContainer()

    loadPdfByName(PdfPlanPath, pxPerMeter).then(success => {
        if (success) {
            if(debugLog) console.log('Loaded! ', PdfPlanPath);
        }
    });
}

export function flipPdfHorizontal() {
    if(debugLog) console.log('actions.js > flipPdfHorizontal() is called');

    clearCanvasContainer()

    loadPdfByName(PdfPlanReversePath, pxPerMeter).then(success => {
        if (success) {
            if(debugLog) console.log('Loaded! ', PdfPlanReversePath);
        }
    });
}

export function flipPdfVertical() {
    if(debugLog) console.log('actions.js > flipPdfVertical() is called');

    clearCanvasContainer()

    loadPdfByName(PdfPlanVerticalPath, pxPerMeter).then(success => {
        if (success) {
            if(debugLog) console.log('Loaded! ', PdfPlanVerticalPath);
        }
    });
}

export function handleSaveClick() {

    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = pdfCanvas.width;
    mergedCanvas.height = pdfCanvas.height;

    const mergedCtx = mergedCanvas.getContext('2d');
    mergedCtx.drawImage(pdfCanvas, 0, 0);
    mergedCtx.drawImage(drawingCanvas, 0, 0);

    const imageData = mergedCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'VectorMeasure.png';
    link.click();
}


