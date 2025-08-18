

import {
    canvas,
    measureCanvas,
    previewCanvas,
    drawingCanvas,
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
    setMeasureOn,
    isAddLineOn,
    setAddLineOn
} from './state.js';
import { clearMeasurementState } from './measure.js';
import { BtnMeasure, BtnAddLine } from './ui.js';

export function  handleClrBuffer() {
    console.log('handleClrBuffer() function called')

    clearCanvasContainer();
}
export function handleMeasureBtn() {
    console.log('actions.js > handleMeasureBtn()')

    renderButton(BtnMeasure, isMeasureOn());
    const next = !isMeasureOn();
    setMeasureOn(next);          // update global state
    renderButton(BtnMeasure, next);   // reflect in UI

    if (next) {
        // turn ON measuring
        measureCanvas.style.pointerEvents = 'auto';
    } else {
        // turn OFF measuring
        handleClearClick();
    }
}
export function renderButton(button, on) {
    button.classList.toggle('is-on', on);
    button.setAttribute('aria-pressed', String(on));
    button.dataset.mode = on ? 'on' : 'off';
    if (button === BtnMeasure) button.textContent = on ? '✅ Measuring (click to stop)' : '📏 Measure Distance';
    if (button === BtnAddLine) button.textContent = on ? '✅ Add Line' : 'Line';
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
export function handleInputCalibrationNumber() {
    let InputCalibrationNumber = document.getElementById('calibration-number').value;
    console.log('InputCalibrationNumber: ', InputCalibrationNumber);

    setPxPerMeter(InputCalibrationNumber);
    setBasePxPerMeter(InputCalibrationNumber);

    //Default: 1px ≈ 0.02652 meters  [1/0.02660 = 37.6]
    document.getElementById('info').innerText =
        `✅ Calibrated: 1px ≈ ${(1 / InputCalibrationNumber).toFixed(5)} m`;
}
export function handleAddLine() {
    console.log('AddLine() function called')

    renderButton(BtnAddLine, isAddLineOn());
    const next = !isAddLineOn();
    setAddLineOn(next);
    renderButton(BtnAddLine, next);
    if (next) {
        // turn ON drawing
        drawingCanvas.style.pointerEvents = 'auto';
    }
}
export function handleDeleteLine() {
    console.log('DeleteLine() function called');
}
export function handleAddComment() {
    console.log('AddComment() function called');
}
