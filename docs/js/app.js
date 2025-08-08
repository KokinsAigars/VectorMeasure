/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * app.js
 */

import { initCanvasRenderPDF } from './canvas.js';
import { setupEventListeners } from './events.js';
import * as calibration from './calibration.js';
import * as actions from './actions.js';

const ui = {
    BtnCalibrate: document.getElementById('calibrate-btn'),
    BtnSave: document.getElementById('save-btn'),
    BtnMeasure: document.getElementById('measure-btn'),
    BtnClear: document.getElementById('clear-btn'),
    BtnResetPdf: document.getElementById('reset-pdf-btn'),
    BtnFlipPdfHorizontal: document.getElementById('flip-pdf-horizontal-btn'),
    BtnFlipPdfVertical: document.getElementById('flip-pdf-vertical-btn')
};
const handlers = {
    handleCalibrateClick : calibration.handleCalibrateClick,
    handleSaveClick: actions.handleSaveClick,
    handleMeasureMode : actions.handleMeasureMode,
    handleClearClick : actions.handleClearClick,
    resetPdfView : actions.resetPdfView,
    flipPdfHorizontal : actions.flipPdfHorizontal,
    flipPdfVertical : actions.flipPdfVertical
};

// call MAIN() function
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initCanvasRenderPDF({
            PDFlink: 'pdf/PLANS_CUBE.pdf',
            DivPdfContainer: document.getElementById('pdf-container'),
            pxPerMeter: 44.5,
            workerSrc: 'js/pdfjs/pdf.worker.mjs'
        });

        setupEventListeners(ui, handlers);

        console.log("VectorMeasure initialized");

    } catch (err) {
        console.error('Error rendering PDF:', err);
    }
});

