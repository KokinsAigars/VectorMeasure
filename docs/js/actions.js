/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * actions.js
 */

import {
    canvas,
    ctx,
    measureCanvas,
    previewCanvas,
    previewCtx,
    originalPdfImage
} from './canvas.js';
import { renderAtCurrentTransform } from './canvas.js';
import {
    ZOOM,
    currentScale,
    setCurrentScale,
    panOffset,
    setPanOffset,
    pxPerMeter,
    basePxPerMeter,
    originalCanvasWidth,
    unscaledViewport,
    setPxPerMeter
} from './state.js';
import { clearCanvasContainer } from './canvas.js';
import { clearMeasurementState } from './measure.js';


function handleSaveClick() {
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

function handleMeasureMode() {
    handleClearClick();
    measureCanvas.style.pointerEvents = 'auto';
    document.getElementById('info').innerText = 'Click two points to measure.';
}

function handleClearClick() {
    const ctxMeasure = measureCanvas.getContext('2d');
    ctxMeasure.clearRect(0, 0, measureCanvas.width, measureCanvas.height);

    const ctxPreview = previewCanvas.getContext('2d');
    ctxPreview.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    clearMeasurementState();

    document.getElementById('info').innerText = 'Measurements cleared.';
    document.getElementById('measurement-tip').style.display = 'none';
}

async function resetPdfView() {
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

function flipPdfHorizontal() {
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

function flipPdfVertical() {
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

function  handleClrBuffer() {
    console.log('handleClrBuffer() function called')

    clearCanvasContainer();
}

async function handleZoomIn() {
    const next = Math.min(currentScale + ZOOM.step, ZOOM.max);
    if (next === currentScale) return;
    setCurrentScale(next);
    await renderAtCurrentTransform();
}

async function handleZoomOut() {
    const next = Math.max(currentScale - ZOOM.step, ZOOM.min);
    if (next === currentScale) return;
    setCurrentScale(next);
    await renderAtCurrentTransform();
}

async function handleZoomReset() {
    setCurrentScale(1.0);
    setPanOffset(0, 0);
    await renderAtCurrentTransform();
}

// --- Pan (drag) support ---
let isPanning = false;
let panStart = { x: 0, y: 0 };

function startPan(event) {
    isPanning = true;
    panStart = { x: event.clientX - panOffset.x, y: event.clientY - panOffset.y };
}

async function movePan(event) {
    if (!isPanning) return;
    const x = event.clientX - panStart.x;
    const y = event.clientY - panStart.y;
    setPanOffset(x, y);
    // Pan is purely a CSS translate on overlays; update transform only
    const overlays = document.querySelectorAll('#measure-canvas, #preview-canvas');
    overlays.forEach(c => {
        c.style.transform = `translate(${x}px, ${y}px)`;
        c.style.transformOrigin = 'top left';
    });
}

function endPan() {
    isPanning = false;
}



export {
    handleSaveClick,
    handleMeasureMode,
    handleClearClick,
    resetPdfView,
    flipPdfHorizontal,
    flipPdfVertical,
    handleClrBuffer,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    startPan,
    movePan,
    endPan
};