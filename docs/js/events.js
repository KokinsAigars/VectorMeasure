/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * events.js
 */

import * as ui from './ui.js';
import * as actions from './actions.js';
import { handleCalibrateClick } from './calibration.js'
import { loadPdfByName } from './loader.js';
import { measureCanvas } from './canvas.js';
import { onMeasureClick, onMeasureMove, cancelMeasurement } from './measure.js';

// EventListeners
export function setupEventListeners() {

    ui.selector.addEventListener('change', async (event) => {
        const plan = event.target.value;
        await loadPdfByName(plan);
    });
    ui.BtnClrBuffer.addEventListener('click', actions.handleClrBuffer);
    ui.BtnCalibrate.addEventListener('click', handleCalibrateClick);
    ui.BtnSave.addEventListener('click', actions.handleSaveClick);
    ui.BtnMeasure.addEventListener('click', actions.handleMeasureMode);
    ui.BtnClear.addEventListener('click',  actions.handleClearClick);
    ui.BtnResetPdf.addEventListener('click', actions.resetPdfView);
    ui.BtnFlipPdfHorizontal.addEventListener('click', actions.flipPdfHorizontal);
    ui.BtnFlipPdfVertical.addEventListener('click', actions.flipPdfVertical);

    // Measurement canvas events
    measureCanvas.addEventListener('click', onMeasureClick);
    measureCanvas.addEventListener('mousemove', onMeasureMove);
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            cancelMeasurement();
        }
    });
}

