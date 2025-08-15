/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ events.js;
 */

import { debugLog } from './debug.js';
import * as ui from './ui.js';
import * as actions from './actions.js';
import { pdfCanvas } from './canvas.js';

// EventListeners
export function setupEventListeners() {
    if (debugLog) console.log('events.js > setupEventListeners() function called');

    if (ui.BtnZoomIn) ui.BtnZoomIn.addEventListener('click', actions.handleZoomIn);
    if (ui.BtnZoomOut) ui.BtnZoomOut.addEventListener('click', actions.handleZoomOut);
    if (ui.BtnPanToggle) ui.BtnPanToggle.addEventListener('click', actions.startPan);
    if (ui.BtnResetPdf) ui.BtnResetPdf.addEventListener('click', actions.handleResetView);
    if (ui.BtnFlipPdfHorizontal) ui.BtnFlipPdfHorizontal.addEventListener('click', actions.flipPdfHorizontal);
    if (ui.BtnFlipPdfVertical) ui.BtnFlipPdfVertical.addEventListener('click', actions.flipPdfVertical);
    if (ui.BtnSave) ui.BtnSave.addEventListener('click', actions.handleSaveClick);

    // --- Pan via Space + drag
    let spaceDown = false;
    if (pdfCanvas) pdfCanvas.addEventListener('mousedown', (e) => {
        if (!spaceDown) return;
        pdfCanvas.style.cursor = 'grabbing';
        actions.startPan(e);
    });
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            spaceDown = true;
            pdfCanvas.style.pointerEvents = 'auto';
            pdfCanvas.style.cursor = 'grab';
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            spaceDown = false;
            pdfCanvas.style.pointerEvents = 'none';
            pdfCanvas.style.cursor = 'default';
            actions.endPan();
        }
    });
    document.addEventListener('mousemove', (e) => {
        if (!spaceDown) return;
        actions.movePan(e);
    });
    document.addEventListener('mouseup', () => {
        if (!spaceDown) return;
        if (pdfCanvas) pdfCanvas.style.cursor = 'grab';
        actions.endPan();
    });

}

