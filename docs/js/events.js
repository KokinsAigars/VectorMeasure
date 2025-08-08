/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * events.js
 */

import { measureCanvas } from './canvas.js';
import { onMeasureClick, onMeasureMove, cancelMeasurement } from './measure.js';

// EventListeners
export function setupEventListeners(ui, handlers) {


    ui.BtnCalibrate.addEventListener('click', handlers.handleCalibrateClick);
    ui.BtnSave.addEventListener('click', handlers.handleSaveClick);
    ui.BtnMeasure.addEventListener('click', handlers.handleMeasureMode);
    ui.BtnClear.addEventListener('click',  handlers.handleClearClick);
    ui.BtnResetPdf.addEventListener('click', handlers.resetPdfView);
    ui.BtnFlipPdfHorizontal.addEventListener('click', handlers.flipPdfHorizontal);
    ui.BtnFlipPdfVertical.addEventListener('click', handlers.flipPdfVertical);

    // Measurement canvas events
    measureCanvas.addEventListener('click', onMeasureClick);
    measureCanvas.addEventListener('mousemove', onMeasureMove);
    document.addEventListener('keydown', function (event) {

        if (event.key === 'Escape') {
            cancelMeasurement();
        }
    });
}
