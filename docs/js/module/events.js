/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ events.js;
 */

import {debugLogLevelLoading} from '../debug.js';
import * as ui from './ui.js';
import * as actions from './actions.js';
import {commentCanvas, drawingCanvas, measureCanvas, pdfCanvas, previewCanvas} from './canvas.js';
import {handleCalibrateClick} from './calibration.js';
import {
    onDrawMouseDown,
    onDrawMouseMove,
    onDrawMouseUp,
    onDeleteHover,
    onDeleteClick,
    clearDeleteHover,
} from './draw.js';

// EventListeners
export function setupEventListeners() {
    if (debugLogLevelLoading) console.log('events.js > setupEventListeners() function called');

    if (ui.BtnZoomIn) ui.BtnZoomIn.addEventListener('click', actions.handleZoomIn);
    if (ui.BtnZoomOut) ui.BtnZoomOut.addEventListener('click', actions.handleZoomOut);
    if (ui.BtnZoomAll) ui.BtnZoomAll.addEventListener('click', actions.handleZoomAll)
    if (ui.BtnPanToggle) ui.BtnPanToggle.addEventListener('click', actions.handlePanBtn);
    if (ui.BtnResetPdf) ui.BtnResetPdf.addEventListener('click', actions.handleResetView);
    if (ui.BtnFlipPdfHorizontal) ui.BtnFlipPdfHorizontal.addEventListener('click', actions.flipPdfHorizontal);
    if (ui.BtnFlipPdfVertical) ui.BtnFlipPdfVertical.addEventListener('click', actions.flipPdfVertical);
    if (ui.BtnPngSave) ui.BtnPngSave.addEventListener('click', actions.handlePngSaveClick);
    if (ui.BtnJsonSave) ui.BtnJsonSave.addEventListener('click', actions.handleExportComments);
    if (ui.BtnMeasure) ui.BtnMeasure.addEventListener('click', actions.handleMeasureBtn);
    if (ui.BtnAddLine) ui.BtnAddLine.addEventListener('click', actions.handleAddLineBtn);
    if (ui.BtnDeleteLine) ui.BtnDeleteLine.addEventListener('click', actions.handleDeleteLineBtn);
    if (ui.BtnComment) ui.BtnComment.addEventListener('click', actions.handleAddCommentBtn);
    if (ui.BtnCalibrate) ui.BtnCalibrate.addEventListener('click', handleCalibrateClick);


    // --- Pan via Space + drag
    let spaceDown = false;
    function disableOverlaysPointerEvents() {
        [measureCanvas, previewCanvas, drawingCanvas, commentCanvas]
            .forEach(c => c && (c.style.pointerEvents = 'none'));
    }
    function restoreOverlaysPointerEventsForActiveTool() {
        // pdfCanvas based on explicit pan mode (tool PAN)
        pdfCanvas.style.pointerEvents = actions.panMode ? 'auto' : 'none';
        pdfCanvas.style.cursor = actions.panMode ? 'grab' : 'default';

        // measure layer active only in MEASURE
        if (measureCanvas) {
            measureCanvas.style.pointerEvents =
                (actions.activeTool === actions.TOOL.MEASURE) ? 'auto' : 'none';
            measureCanvas.style.cursor =
                (actions.activeTool === actions.TOOL.MEASURE) ? 'crosshair' : 'default';
        }

        // drawing layer active only in DRAW/DELETE
        if (drawingCanvas) {
            const useDrawing = [actions.TOOL.DRAW, actions.TOOL.DELETE].includes(actions.activeTool);
            drawingCanvas.style.pointerEvents = useDrawing ? 'auto' : 'none';
            drawingCanvas.style.cursor =
                actions.activeTool === actions.TOOL.DRAW   ? 'crosshair' :
                    actions.activeTool === actions.TOOL.DELETE ? 'not-allowed' : 'default';
        }

        // comment layer active only in COMMENT
        if (commentCanvas) {
            commentCanvas.style.pointerEvents =
                (actions.activeTool === actions.TOOL.COMMENT) ? 'auto' : 'none';
            commentCanvas.style.cursor =
                (actions.activeTool === actions.TOOL.COMMENT) ? 'crosshair' : 'default';
        }

        // preview is purely visual
        if (previewCanvas) previewCanvas.style.pointerEvents = 'none';
    }
    if (pdfCanvas) pdfCanvas.addEventListener('mousedown', (e) => {
        if (!spaceDown && !actions.panMode) return;
        pdfCanvas.style.cursor = 'grabbing';
        actions.startPan(e);
    });

    document.addEventListener('keydown', (e) => {
        if (e.code !== 'Space') return;

        // guard: don’t hijack when typing
        const t = e.target;
        if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.isContentEditable)) return;

        e.preventDefault();
        spaceDown = true;

        // Make sure mousedown goes to the PDF canvas
        disableOverlaysPointerEvents();
        pdfCanvas.style.pointerEvents = 'auto';
        pdfCanvas.style.cursor = 'grab';
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            // Same guard
            const t = e.target;
            if (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.isContentEditable) return;

            spaceDown = false;

            // stop the temporary pan (if dragging)
            actions.endPan();

            // restore per-tool interactivity
            restoreOverlaysPointerEventsForActiveTool();
        }
    });
    document.addEventListener('mousemove', (e) => {
        // move only while dragging (isPanning is true during mouse drag)
        if (!spaceDown && !actions.isPanning) return;
        actions.movePan(e);
    });
    document.addEventListener('mouseup', () => {
        if (!actions.isPanning) return;
        pdfCanvas.style.cursor = (spaceDown || actions.panMode) ? 'grab' : 'default';
        actions.endPan();
    });

    // DRAW — click-drag to draw a single segment
    if (drawingCanvas) {
        drawingCanvas.addEventListener('mousedown', (e) => {
            if (actions.activeTool !== actions.TOOL.DRAW) return;
            onDrawMouseDown(e);
        });
    }
    document.addEventListener('mousemove', (e) => {
        if (actions.activeTool !== actions.TOOL.DRAW) return;
        onDrawMouseMove(e);
    });
    document.addEventListener('mouseup', (e) => {
        if (actions.activeTool !== actions.TOOL.DRAW) return;
        onDrawMouseUp(e);
    });

    // DELETE LINE — hover to highlight, click to delete
    if (drawingCanvas) {
        drawingCanvas.addEventListener('mousemove', (e) => {
            if (actions.activeTool !== actions.TOOL.DELETE) return;
            onDeleteHover(e);
        });

        drawingCanvas.addEventListener('mouseleave', () => {
            if (actions.activeTool !== actions.TOOL.DELETE) return;
            clearDeleteHover();
        });

        drawingCanvas.addEventListener('click', (e) => {
            if (actions.activeTool !== actions.TOOL.DELETE) return;
            onDeleteClick(e);
        });
    }

}

