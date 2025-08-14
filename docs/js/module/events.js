/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ events.js;
 */

import * as ui from './ui.js';
import * as actions from './actions.js';
import * as measure from './measure.js';
import * as canvas from './canvas.js';
import { handleCalibrateClick } from './calibration.js'
import { loadPdfByName } from './loader.js';
import {handleMeasureBtn} from "./actions.js";

// EventListeners
export function setupEventListeners() {

    if(ui.SelectPDF){
        ui.SelectPDF.addEventListener('change', async (event) => {
            actions.handleMeasureBtn();
            const plan = event.target.value;
            await loadPdfByName(plan);
        });
    }

    if(ui.BtnClrBuffer) ui.BtnClrBuffer.addEventListener('click', actions.handleClrBuffer);

    if(ui.BtnSave) ui.BtnSave.addEventListener('click', actions.handleSaveClick);

    if(ui.BtnMeasure) ui.BtnMeasure.addEventListener('click', actions.handleMeasureBtn);

    // Calibrate
    if(ui.BtnCalibrate) ui.BtnCalibrate.addEventListener('click', handleCalibrateClick);

    // Zoom In/Out/Reset
    if(ui.BtnZoomIn) ui.BtnZoomIn.addEventListener('click', actions.handleZoomIn);
    if(ui.BtnZoomOut) ui.BtnZoomOut.addEventListener('click', actions.handleZoomOut);
    if(ui.BtnResetPdf) ui.BtnResetPdf.addEventListener('click', actions.handleZoomReset);

    if(ui.BtnPanToggle) ui.BtnPanToggle.addEventListener('click', actions.startPan);

    if(ui.InputCalibrationNumber) ui.InputCalibrationNumber.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            actions.handleInputCalibrationNumber();
        }
    });

    if(ui.BtnFlipPdfHorizontal) ui.BtnFlipPdfHorizontal.addEventListener('click', actions.flipPdfHorizontal);
    if(ui.BtnFlipPdfVertical) ui.BtnFlipPdfVertical.addEventListener('click', actions.flipPdfVertical);

    if(ui.BtnAddLine) ui.BtnAddLine.addEventListener('click', actions.handleAddLine);
    if(ui.BtnDeleteLine) ui.BtnDeleteLine.addEventListener('click', actions.handleDeleteLine);
    if(ui.BtnAddComment) ui.BtnAddComment.addEventListener('click', actions.handleAddComment);

    // Measurement canvas events
    if(canvas.measureCanvas) {
        canvas.measureCanvas.addEventListener('click', measure.canvasOnMeasureClick);
        canvas.measureCanvas.addEventListener('mousemove', measure.onMeasureMove);
    }
    if(canvas.previewCanvas) canvas.previewCanvas.addEventListener('mousedown', (e) => {
        if (!spaceDown) return;
        canvas.previewCanvas.style.cursor = 'grabbing';
        actions.startPan(e);
    });

    // 'Escape'
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            measure.cancelMeasurement();
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
    document.addEventListener('mousemove', (e) => {
        if (!spaceDown) return;
        actions.movePan(e);
    });
    document.addEventListener('mouseup', () => {
        if (!spaceDown) return;
        if(canvas.previewCanvas) canvas.previewCanvas.style.cursor = 'grab';
        actions.endPan();
    });


}