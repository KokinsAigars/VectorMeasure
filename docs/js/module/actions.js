/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * module/ actions.js
 */

import {
    canvas,
    ctx,
    measureCanvas,
    previewCanvas,
    previewCtx,
    originalPdfImage, drawingCanvas
} from './canvas.js';
import { renderAtCurrentTransform } from './canvas.js';
import {
    ZOOM,
    currentScale,
    setCurrentScale,
    panOffset,
    setPanOffset,
    recomputePxPerMeter,
    pxPerMeter,
    setPxPerMeter,
    basePxPerMeter,
    originalCanvasWidth,
    unscaledViewport
} from './state.js';
import { clearCanvasContainer } from './canvas.js';
import { clearMeasurementState } from './measure.js';

let isPanning = false;
let panStart = { x: 0, y: 0 };


export function handleSaveClick() {
    const pdfCanvas = canvas;
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = pdfCanvas.width;
    mergedCanvas.height = pdfCanvas.height;

    const mergedCtx = mergedCanvas.getContext('2d');
    mergedCtx.drawImage(pdfCanvas, 0, 0);
    mergedCtx.drawImage(measureCanvas, 0, 0);

    const imageData = mergedCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'VectorMeasure.png';
    link.click();
}

export function handleMeasureMode() {
    handleClearClick();
    measureCanvas.style.pointerEvents = 'auto';
    document.getElementById('info').innerText = 'Click two points to measure.';
}

export function handleClearClick() {
    const ctxMeasure = measureCanvas.getContext('2d');
    ctxMeasure.clearRect(0, 0, measureCanvas.width, measureCanvas.height);

    const ctxPreview = previewCanvas.getContext('2d');
    ctxPreview.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    clearMeasurementState();

    document.getElementById('info').innerText = 'Measurements cleared.';
    document.getElementById('measurement-tip').style.display = 'none';
}

export async function resetPdfView() {
    const scale = originalCanvasWidth / unscaledViewport.width;
    setCurrentScale(scale);
    setPanOffset(0, 0);
    setPxPerMeter(basePxPerMeter);

    [canvas, measureCanvas, previewCanvas].forEach(c => {
        c.style.transform = 'none';
        c.style.left = '0px';
        c.style.top = '0px';
    });

    const ctxCanvas = canvas.getContext('2d');
    ctxCanvas.setTransform(1, 0, 0, 1, 0, 0);
    ctxCanvas.clearRect(0, 0, canvas.width, canvas.height);

    if (originalPdfImage.complete) {
        ctxCanvas.drawImage(originalPdfImage, 0, 0);
    } else {
        originalPdfImage.onload = () => {
            ctxCanvas.drawImage(originalPdfImage, 0, 0);
        };
    }

    requestAnimationFrame(() => {
        document.getElementById('info').innerText = '🔄 View reset to original state';
        console.log('Reset scale:', currentScale);
        console.log('Canvas size:', canvas.width, canvas.height);
        console.log('Transform:', canvas.style.transform);
    });
}

export function flipPdfHorizontal() {
    const ctxCanvas = canvas.getContext('2d');

    const copyCanvas = document.createElement('canvas');
    copyCanvas.width = canvas.width;
    copyCanvas.height = canvas.height;
    const copyCtx = copyCanvas.getContext('2d');
    copyCtx.drawImage(canvas, 0, 0);

    ctxCanvas.clearRect(0, 0, canvas.width, canvas.height);
    ctxCanvas.save();
    ctxCanvas.scale(-1, 1);
    ctxCanvas.translate(-canvas.width, 0);
    ctxCanvas.drawImage(copyCanvas, 0, 0);
    ctxCanvas.restore();

    handleClearClick();
}

export function flipPdfVertical() {
    const ctxCanvas = canvas.getContext('2d');

    const copyCanvas = document.createElement('canvas');
    copyCanvas.width = canvas.width;
    copyCanvas.height = canvas.height;
    const copyCtx = copyCanvas.getContext('2d');
    copyCtx.drawImage(canvas, 0, 0);

    ctxCanvas.clearRect(0, 0, canvas.width, canvas.height);
    ctxCanvas.save();
    ctxCanvas.scale(1, -1);
    ctxCanvas.translate(0, -canvas.height);
    ctxCanvas.drawImage(copyCanvas, 0, 0);
    ctxCanvas.restore();

    handleClearClick();
}

export function  handleClrBuffer() {
    console.log('handleClrBuffer() function called')

    clearCanvasContainer();
}

export async function handleZoomIn() {
    const next = Math.min(currentScale + ZOOM.step, ZOOM.max);
    if (next === currentScale) return;
    setCurrentScale(next);
    recomputePxPerMeter();
    await renderAtCurrentTransform();
}

export async function handleZoomOut() {
    const next = Math.max(currentScale - ZOOM.step, ZOOM.min);
    if (next === currentScale) return;
    setCurrentScale(next);
    recomputePxPerMeter();
    await renderAtCurrentTransform();
}

export async function handleZoomReset() {
    // match initial “fit to container width”
    const fit = originalCanvasWidth / unscaledViewport.width;
    setCurrentScale(fit);
    recomputePxPerMeter();

    const container = document.getElementById('pdf-container');
    const pdfW = unscaledViewport.width  * fit;
    const pdfH = unscaledViewport.height * fit;
    const offsetX = (container.clientWidth  - pdfW) / 2;
    const offsetY = (container.clientHeight - pdfH) / 2;

    setPanOffset(offsetX, offsetY);
    await renderAtCurrentTransform();
}

export function startPan(event) {
    isPanning = true;
    panStart = { x: event.clientX - panOffset.x, y: event.clientY - panOffset.y };
    console.log('panStart');
}

export async function movePan(event) {
    if (!isPanning) return;
    const x = event.clientX - panStart.x;
    const y = event.clientY - panStart.y;
    setPanOffset(x, y);

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
    isPanning = false;
}

