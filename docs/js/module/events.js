/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * module/ events.js
 */

import * as ui from './ui.js';
import * as actions from './actions.js';
import * as measure from './measure.js';
import * as canvas from './canvas.js';
import { handleCalibrateClick } from './calibration.js'
import { loadPdfByName } from './loader.js';

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

    // Measurement canvas events
    if(canvas.measureCanvas) {
        canvas.measureCanvas.addEventListener('click', measure.canvasOnMeasureClick);
        canvas.measureCanvas.addEventListener('mousemove', measure.onMeasureMove);
    }
    canvas.previewCanvas.addEventListener('mousedown', (e) => {
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
        canvas.previewCanvas.style.cursor = 'grab';
        actions.endPan();
    });


    if(ui.BtnPanToggle) ui.BtnPanToggle.addEventListener('click', actions.startPan);

    if(ui.InputCalibrationNumber) ui.InputCalibrationNumber.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            actions.handleInputCalibrationNumber();
        }
    });

    if(ui.BtnFlipPdfHorizontal) ui.BtnFlipPdfHorizontal.addEventListener('click', actions.flipPdfHorizontal);
    if(ui.BtnFlipPdfVertical) ui.BtnFlipPdfVertical.addEventListener('click', actions.flipPdfVertical);



    // wheel zoom centered on cursor (non-touchpad friendly)
    // let pendingDelta = 0;
    // let wheelRAF = null;
    // ui.DivPdfContainer.addEventListener('wheel', (e) => {
    //         e.preventDefault();
    //         pendingDelta += e.deltaY;
    //
    //         if (wheelRAF) return;
    //
    //         wheelRAF = requestAnimationFrame(async () => {
    //             const dy = pendingDelta;
    //             pendingDelta = 0;
    //             wheelRAF = null;
    //
    //             if (dy < 0) await actions.handleZoomIn();
    //             else await actions.handleZoomOut();
    //         });
    //     }, { passive: false } // Options: to call preventDefault() / please wait for me before doing the default scrolling/zooming
    // );
    const container = ui.DivPdfContainer;

    let pendingDelta = 0;
    let lastPos = { x: 0, y: 0 };
    let wheelRAF = null;

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        pendingDelta += e.deltaY;
        lastPos.x = e.clientX;
        lastPos.y = e.clientY;

        if (wheelRAF) return;
        wheelRAF = requestAnimationFrame(async () => {
            const dy = pendingDelta;
            const { x, y } = lastPos;
            pendingDelta = 0;
            wheelRAF = null;

            // single call that does cursor-centered zoom
            await actions.zoomAt(x, y, dy);
        });
    }, { passive: false });
}
