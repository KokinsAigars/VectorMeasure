/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ events.js;
 */

import { debugLogLevelA } from './debug.js';
import * as ui from './ui.js';
import * as actions from './actions.js';
import * as measure from './measure.js';
import { pdfCanvas, measureCanvas, previewCanvas, drawingCanvas } from './canvas.js';
import {handleCalibrateClick} from "./calibration.js";
import {DivInfo} from "./ui.js";


// EventListeners
export function setupEventListeners() {
    if (debugLogLevelA) console.log('events.js > setupEventListeners() function called');

    if (ui.BtnZoomIn) ui.BtnZoomIn.addEventListener('click', actions.handleZoomIn);
    if (ui.BtnZoomOut) ui.BtnZoomOut.addEventListener('click', actions.handleZoomOut);
    if (ui.BtnPanToggle) ui.BtnPanToggle.addEventListener('click', actions.handlePanBtn);
    if (ui.BtnResetPdf) ui.BtnResetPdf.addEventListener('click', actions.handleResetView);
    if (ui.BtnFlipPdfHorizontal) ui.BtnFlipPdfHorizontal.addEventListener('click', actions.flipPdfHorizontal);
    if (ui.BtnFlipPdfVertical) ui.BtnFlipPdfVertical.addEventListener('click', actions.flipPdfVertical);
    if (ui.BtnSave) ui.BtnSave.addEventListener('click', actions.handleSaveClick);
    if (ui.BtnMeasure) ui.BtnMeasure.addEventListener('click', actions.handleMeasureBtn);
    if (ui.BtnAddLine) ui.BtnAddLine.addEventListener('click', actions.handleAddLineBtn);
    if (ui.BtnDeleteLine) ui.BtnDeleteLine.addEventListener('click', actions.handleDeleteLineBtn);
    if (ui.BtnAddComment) ui.BtnAddComment.addEventListener('click', actions.handleAddCommentBtn);

    // --- Pan via Space + drag
    let spaceDown = false;
    if (pdfCanvas) pdfCanvas.addEventListener('mousedown', (e) => {
        if (!spaceDown && !actions.panMode) return;
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
            // keep interactive if Pan button is ON
            if (!actions.panMode) {
                pdfCanvas.style.pointerEvents = 'none';
                pdfCanvas.style.cursor = 'default';
            }
            actions.endPan();
        }
    });
    document.addEventListener('mousemove', (e) => {
        // move only while dragging (isPanning is true during mouse drag)
        if (!spaceDown && !actions.isPanning) return;
        actions.movePan(e);
    });
    document.addEventListener('mouseup', () => {
        if (!actions.isPanning) return;
        if (pdfCanvas) pdfCanvas.style.cursor = (spaceDown || actions.panMode) ? 'grab' : 'default';
        actions.endPan();
    });

    // MEASURE — simple click stub
    // measureCanvas.addEventListener('click', (e) => {
    //     if (actions.activeTool !== actions.TOOL.MEASURE) return;
    //     // TODO: replace with your measurement logic
    //     console.log('[MEASURE] click at', e.offsetX, e.offsetY);
    // });

    // DRAW / DELETE / COMMENT — simple stubs
    let drawing = false, start = null;
    drawingCanvas.addEventListener('mousedown', (e) => {
        if (![actions.TOOL.DRAW, actions.TOOL.DELETE, actions.TOOL.COMMENT].includes(actions.activeTool)) return;
        drawing = true;
        start = { x: e.offsetX, y: e.offsetY };
        console.log(`[${actions.activeTool}] mousedown`, start);
    });
    document.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        if (![actions.TOOL.DRAW, actions.TOOL.DELETE, actions.TOOL.COMMENT].includes(actions.activeTool)) return;
        // TODO: preview line / hover-delete / comment cursor etc.
    });
    document.addEventListener('mouseup', (e) => {
        if (!drawing) return;
        drawing = false;
        if (![actions.TOOL.DRAW, actions.TOOL.DELETE, actions.TOOL.COMMENT].includes(actions.activeTool)) return;
        const end = { x: e.offsetX, y: e.offsetY };
        console.log(`[${actions.activeTool}] mouseup`, end);
        // TODO: finalize draw/delete/comment
    });

    // 'Escape'
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            measure.cancelMeasurement();
        }
    });

    if (ui.BtnMeasure) ui.BtnMeasure.addEventListener('click', actions.handleMeasureButtonClick);

    if (ui.BtnCalibrate) ui.BtnCalibrate.addEventListener('click', handleCalibrateClick);
}


let measuring = false;

// --- named handlers so we can remove them later ---
function handleMeasureClick(e)  { measure.canvasOnMeasureClick(e); }
function handleMeasureMove(e)   { measure.onMeasureMove(e); }
function handleKeydown(e)       { if (e.key === 'Escape') cancelCurrentMeasure(); }
function handleLeave()          { hideTipAndPreview(); }

function hideTipAndPreview() {
    const tip = ui.DivMeasurementTip;
    if (tip) tip.style.display = 'none';

    const p_ctx = previewCanvas.getContext('2d');
    p_ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
}

function cancelCurrentMeasure() {
    // reset transient state + visuals
    measure.clearMeasurementState();
    hideTipAndPreview();

    // also clear the permanent line if the user cancels midway
    const m_ctx = measureCanvas.getContext('2d');
    m_ctx.clearRect(0, 0, measureCanvas.width, measureCanvas.height);
}

/**
 * Turn measurement mode on/off.
 */
export function setMeasureActive(on) {
    if (on === measuring) return; // no-op
    measuring = on;

    if (on) {
        // Let this canvas receive clicks/mousemove
        measureCanvas.style.pointerEvents = 'auto';
        previewCanvas.style.pointerEvents = 'none'; // purely visual overlay

        measureCanvas.addEventListener('click',     handleMeasureClick);
        measureCanvas.addEventListener('mousemove', handleMeasureMove);
        measureCanvas.addEventListener('mouseleave', handleLeave);
        window.addEventListener('keydown', handleKeydown);

        if (ui.DivInfo) ui.DivInfo.innerText = 'Click two points to measure. (Esc to cancel)';

    } else {
        measureCanvas.removeEventListener('click',     handleMeasureClick);
        measureCanvas.removeEventListener('mousemove', handleMeasureMove);
        measureCanvas.removeEventListener('mouseleave', handleLeave);
        window.removeEventListener('keydown', handleKeydown);

        measureCanvas.style.pointerEvents = 'none';
        cancelCurrentMeasure();

        if (ui.DivInfo) ui.DivInfo.innerText = '';
    }
}

export function isMeasureActive() { return measuring; }



