/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * module/ actions.js
 */

import {
    canvas,
    measureCanvas,
    previewCanvas,
    clearCanvasContainer,
    renderAtCurrentTransform
} from './canvas.js';
import {
    ZOOM,
    currentScale,
    setCurrentScale,
    panOffset,
    setPanOffset,
    recomputePxPerMeter,
    setPxPerMeter,
    setBasePxPerMeter,
    originalCanvasWidth,
    unscaledViewport,
    isMeasureOn,
    setMeasureOn
} from './state.js';
import { clearMeasurementState } from './measure.js';
import { DivPdfContainer, BtnMeasure } from './ui.js';

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

    // infoEl.textContent = 'Measurements cleared.';
    document.getElementById('measurement-tip').style.display = 'none';
    measureCanvas.style.pointerEvents = 'none';
}

export function  handleClrBuffer() {
    console.log('handleClrBuffer() function called')

    clearCanvasContainer();
}

export async function zoomAt(clientX, clientY, deltaY) {
    const rect = DivPdfContainer.getBoundingClientRect();

    // cursor position relative to container (overlay coords)
    const p = { x: clientX - rect.left, y: clientY - rect.top };

    // convert delta to discrete steps (trackpads can be large)
    const sign = deltaY < 0 ? 1 : -1;
    const magnitude = Math.abs(deltaY);

    // Tune these to taste:
    // - baseSteps: at least 1 step
    // - extraSteps kick in for large deltas so big scrolls feel proportional
    const baseSteps = 1;
    const extraSteps = Math.min(4, Math.floor(magnitude / 120)); // 0..4 extra
    const totalSteps = baseSteps + extraSteps;

    for (let i = 0; i < totalSteps; i++) {
        const oldScale = currentScale;
        const next = Math.max(ZOOM.min, Math.min(ZOOM.max, oldScale + sign * ZOOM.step));
        if (next === oldScale) break;

        const k = next / oldScale;

        // keep cursor-anchored point stable: pan' = (1 - k) * p + k * pan
        const newPanX = (1 - k) * p.x + k * panOffset.x;
        const newPanY = (1 - k) * p.y + k * panOffset.y;

        setPanOffset(newPanX, newPanY);
        setCurrentScale(next);
        recomputePxPerMeter();

        // If you added render-cancellation in canvas.js, awaiting is safe & flicker-free
        await renderAtCurrentTransform();
    }
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
export function movePan(event) {
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


export function handleMeasureBtn() {
    console.log('actions.js > handleMeasureBtn()')
    renderMeasureButton(isMeasureOn());
    const next = !isMeasureOn();
    setMeasureOn(next);          // update global-ish state
    renderMeasureButton(next);   // reflect in UI

    if (next) {
        // turn ON measuring
        measureCanvas.style.pointerEvents = 'auto';
        // infoEl.textContent = 'Click two points to measure.';
    } else {
        // turn OFF measuring
        handleClearClick();
    }
}
export function renderMeasureButton(on) {
    BtnMeasure.classList.toggle('is-on', on);
    BtnMeasure.setAttribute('aria-pressed', String(on));
    BtnMeasure.dataset.mode = on ? 'on' : 'off';
    BtnMeasure.textContent = on ? '✅ Measuring (click to stop)' : '📏 Measure Distance';
}


export function handleInputCalibrationNumber() {
    let InputCalibrationNumber = document.getElementById('calibration-number').value;
    console.log('InputCalibrationNumber: ', InputCalibrationNumber);

    setPxPerMeter(InputCalibrationNumber);
    setBasePxPerMeter(InputCalibrationNumber);

    //Default: 1px ≈ 0.02652 meters  [1/0.02660 = 37.6]
    document.getElementById('info').innerText =
        `✅ Calibrated: 1px ≈ ${(1 / InputCalibrationNumber).toFixed(5)} m`;
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

