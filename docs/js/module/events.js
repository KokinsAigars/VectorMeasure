/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * module/ events.js
 */

import * as ui from './ui.js';
import * as actions from './actions.js';
import { handleCalibrateClick } from './calibration.js'
import { loadPdfByName } from './loader.js';
import * as canvas from './canvas.js';
import { onMeasureClick, onMeasureMove, cancelMeasurement } from './measure.js';
import {BtnPanToggle, EnterCalibrationNumber, InputCalibrationNumber} from "./ui.js";

// EventListeners
export function setupEventListeners() {

    if(ui.selector){
        ui.selector.addEventListener('change', async (event) => {
            const plan = event.target.value;
            await loadPdfByName(plan);
        });
    }
    if(ui.BtnClrBuffer) ui.BtnClrBuffer.addEventListener('click', actions.handleClrBuffer);

    if(ui.BtnSave) ui.BtnSave.addEventListener('click', actions.handleSaveClick);
    if(ui.BtnMeasure) ui.BtnMeasure.addEventListener('click', actions.onMeasureClick);

    // Calibrate
    if(ui.BtnCalibrate) ui.BtnCalibrate.addEventListener('click', handleCalibrateClick);

    // Zoom In/Out/Reset
    if(ui.BtnZoomIn) ui.BtnZoomIn.addEventListener('click', actions.handleZoomIn);
    if(ui.BtnZoomOut) ui.BtnZoomOut.addEventListener('click', actions.handleZoomOut);
    if(ui.BtnResetPdf) ui.BtnResetPdf.addEventListener('click', actions.handleZoomReset);

    // Measurement canvas events
    if(canvas.measureCanvas) {
        canvas.measureCanvas.addEventListener('click', onMeasureClick);
        canvas.measureCanvas.addEventListener('mousemove', onMeasureMove);
    }

    // 'Escape'
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            cancelMeasurement();
        }
    });

    // --- Pan via Space + drag
    let spaceDown = false;
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            spaceDown = true;
            canvas.previewCanvas.style.pointerEvents = 'auto';
            canvas.previewCanvas.style.cursor = 'grab';
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            spaceDown = false;
            canvas.previewCanvas.style.pointerEvents = 'none';
            canvas.previewCanvas.style.cursor = 'default';
            actions.endPan();
        }
    });

    canvas.previewCanvas.addEventListener('mousedown', (e) => {
        if (!spaceDown) return;
        canvas.previewCanvas.style.cursor = 'grabbing';
        actions.startPan(e);
    });

    document.addEventListener('mousemove', (e) => {
        if (!spaceDown) return;
        actions.movePan(e);
    });

    document.addEventListener('mouseup', () => {
        if (!spaceDown) return;
        canvas.previewCanvas.style.cursor = 'grab';
        actions.endPan();
    });

    // wheel zoom centered on cursor (non-touchpad friendly)
    canvas.previewCanvas.addEventListener('wheel', async (e) => {
        e.preventDefault();
        if (e.deltaY < 0) await actions.handleZoomIn();
        else await actions.handleZoomOut();
    }, { passive: false });

    if(ui.BtnPanToggle) BtnPanToggle.addEventListener('click', actions.startPan);

    if(InputCalibrationNumber) InputCalibrationNumber.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            actions.handleInputCalibrationNumber();
        }
    });
    if(EnterCalibrationNumber) EnterCalibrationNumber.addEventListener('click', actions.handleInputCalibrationNumber);




    // if(ui.BtnFlipPdfHorizontal) ui.BtnFlipPdfHorizontal.addEventListener('click', actions.flipPdfHorizontal);
    // if(ui.BtnFlipPdfVertical) ui.BtnFlipPdfVertical.addEventListener('click', actions.flipPdfVertical);
    //


}

