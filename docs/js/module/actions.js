/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ actions.js;
 */

import {debugLogLevelA} from './debug.js';
import * as ui from "./ui.js";
import * as state from './state.js';
import {clearCanvasContainer, drawingCanvas, measureCanvas, pdfCanvas, renderAtCurrentTransform} from './canvas.js';
import {loadPdfByName} from './loader.js';
import { setMeasureActive } from './events.js';
import {setPdfPlanReversePath} from "./state.js";

export let isPanning = false;
export let panMode = false;
export let panStart = { x: 0, y: 0 }
export let measureOn = false;

export const TOOL = Object.freeze({
    NONE: 'NONE',
    PAN: 'PAN',
    MEASURE: 'MEASURE',
    DRAW: 'DRAW',
    DELETE: 'DELETE',
    COMMENT: 'COMMENT',
});

export let activeTool = TOOL.NONE;

function setCanvasInteractivity() {
    if(debugLogLevelA) console.log('actions.js > setCanvasInteractivity() is called');

    // pdfCanvas (Pan)
    pdfCanvas.style.pointerEvents = (activeTool === TOOL.PAN) ? 'auto' : 'none';
    pdfCanvas.style.cursor       = (activeTool === TOOL.PAN) ? 'grab' : 'default';

    // measureCanvas (Measure)
    measureCanvas.style.pointerEvents = (activeTool === TOOL.MEASURE) ? 'auto' : 'none';
    measureCanvas.style.cursor        = (activeTool === TOOL.MEASURE) ? 'crosshair' : 'default';

    // drawingCanvas (Draw/Delete/Comment)
    const useDrawing = [TOOL.DRAW, TOOL.DELETE, TOOL.COMMENT].includes(activeTool);
    drawingCanvas.style.pointerEvents = useDrawing ? 'auto' : 'none';
    drawingCanvas.style.cursor =
        activeTool === TOOL.DRAW ? 'crosshair' :
            activeTool === TOOL.DELETE ? 'not-allowed' :
                activeTool === TOOL.COMMENT ? 'text' : 'default';
}

function renderAllButtons() {
    if(debugLogLevelA) console.log('actions.js > renderAllButtons() is called');
    // OFF by default
    [ui.BtnMeasure, ui.BtnAddLine, ui.BtnDeleteLine, ui.BtnAddComment, ui.BtnPanToggle]
        .forEach(btn => btn && renderButton(btn, false));

    // turn ON only the active one
    if (activeTool === TOOL.PAN)       renderButton(ui.BtnPanToggle, true);
    if (activeTool === TOOL.MEASURE)   renderButton(ui.BtnMeasure, true);
    if (activeTool === TOOL.DRAW)      renderButton(ui.BtnAddLine, true);
    if (activeTool === TOOL.DELETE)    renderButton(ui.BtnDeleteLine, true);
    if (activeTool === TOOL.COMMENT)   renderButton(ui.BtnAddComment, true);
}

function setTool(next) {
    if(debugLogLevelA) console.log('actions.js > setTool('+ next +') is called');

    // toggle if same button pressed
    activeTool = (activeTool === next) ? TOOL.NONE : next;

    // keep old panMode variables in sync
    panMode = (activeTool === TOOL.PAN);
    renderAllButtons();
    setCanvasInteractivity();
}

export async function handleZoomIn() {
    if(debugLogLevelA) console.log('actions.js > handleZoomIn() is called');

    const next = Math.min(state.currentScale + state.ZOOM.step, state.ZOOM.max);
    if (next === state.currentScale) return;
    state.setCurrentScale(next);
    state.recomputePxPerMeter();
    await renderAtCurrentTransform();
}

export async function handleZoomOut() {
    if(debugLogLevelA) console.log('actions.js > handleZoomOut() is called');

    const next = Math.max(state.currentScale - state.ZOOM.step, state.ZOOM.min);
    if (next === state.currentScale) return;
    state.setCurrentScale(next);
    state.recomputePxPerMeter();
    await renderAtCurrentTransform();
}

export function startPan(event) {
    if(debugLogLevelA) console.log('actions.js > startPan(event) is called');

    isPanning = true;
    panStart = { x: event.clientX - state.panOffset.x, y: event.clientY - state.panOffset.y };
}

export function movePan(event) {
    if(debugLogLevelA) console.log('actions.js > movePan(event) is called');

    if (!isPanning) return;
    const x = event.clientX - panStart.x;
    const y = event.clientY - panStart.y;
    state.setPanOffset(x, y);

    // Pan is CSS translate on overlays; update transform only
    const all = document.querySelectorAll(
        '#pdf-canvas, #measure-canvas, #preview-canvas, #drawing-canvas'
    );
    all.forEach(c => {
        c.style.transform = `translate(${x}px, ${y}px)`;
        c.style.transformOrigin = 'top left';
    });
}

export function endPan() {
    if(debugLogLevelA) console.log('actions.js > endPan() is called');

    isPanning = false;
}

export async function handleResetView() {
    if(debugLogLevelA) console.log('actions.js > handleResetView() is called');

    clearCanvasContainer();

    isPanning = false;
    panMode = false;
    activeTool = TOOL.NONE;

    [ui.BtnPanToggle, ui.BtnMeasure, ui.BtnAddLine, ui.BtnDeleteLine, ui.BtnAddComment]
        .forEach(btn => btn && renderButton(btn, false));

    loadPdfByName(state.PdfPlanPath, state.pxPerMeter).then(success => {
        if (success) {
            if(debugLogLevelA) console.log('Loaded! ', state.PdfPlanPath);
        }
    });
}

export function flipPdfHorizontal() {
    if(debugLogLevelA) console.log('actions.js > flipPdfHorizontal() is called');

    clearCanvasContainer()

    loadPdfByName(state.PdfPlanReversePath, state.pxPerMeter).then(success => {
        if (success) {
            if(debugLogLevelA) console.log('Loaded! ', state.PdfPlanReversePath);
        }
    });
}

export function flipPdfVertical() {
    if(debugLogLevelA) console.log('actions.js > flipPdfVertical() is called');

    clearCanvasContainer()

    loadPdfByName(state.PdfPlanVerticalPath, state.pxPerMeter).then(success => {
        if (success) {
            if(debugLogLevelA) console.log('Loaded! ', state.PdfPlanVerticalPath);
        }
    });
}

export function renderButton(button, on) {
    if(debugLogLevelA) console.log('actions.js > renderButton('+ button +', '+ on +') is called');

    button.classList.toggle('is-on', on);
    button.setAttribute('aria-pressed', String(on));
    button.dataset.mode = on ? 'on' : 'off';

    if (button === ui.BtnPanToggle) {
        button.textContent = on ? '✅ Pan' : 'Pan';
    } else if (button === ui.BtnMeasure) {
        if (on) {
            button.textContent = '✅ Measuring';
            ui.DivInfo.innerText = 'Click two points to measure. (Esc to cancel)';
        } else {
            button.textContent = '📏 Measure Distance';
            ui.DivInfo.innerText = '';
        }
    } else if (button === ui.BtnAddLine) {
        button.textContent = on ? '✅ Line' : 'Line';
    } else if (button === ui.BtnDeleteLine) {
        button.textContent = on ? '✅ Delete' : 'Delete Line';
    } else if (button === ui.BtnAddComment) {
        button.textContent = on ? '✅ Comment' : 'Comment';
    }
}

export function handlePanBtn() {
    if(debugLogLevelA) console.log('actions.js > handlePanBtn() is called');

    setTool(TOOL.PAN);
}

export function handleMeasureBtn() {
    if(debugLogLevelA) console.log('actions.js > handleMeasureBtn() is called');

    setTool(TOOL.MEASURE);
}

export function handleAddLineBtn() {
    if(debugLogLevelA) console.log('actions.js > handleAddLineBtn() is called');

    setTool(TOOL.DRAW);
}

export function handleDeleteLineBtn() {
    if(debugLogLevelA) console.log('actions.js > handleDeleteLineBtn() is called');

    setTool(TOOL.DELETE);
}

export function handleAddCommentBtn() {
    if(debugLogLevelA) console.log('actions.js > handleAddCommentBtn() is called');

    setTool(TOOL.COMMENT);
}

export function handleSaveClick() {
    if(debugLogLevelA) console.log('actions.js > handleSaveClick() is called');

    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = pdfCanvas.width;
    mergedCanvas.height = pdfCanvas.height;

    const mergedCtx = mergedCanvas.getContext('2d');
    mergedCtx.drawImage(pdfCanvas, 0, 0);
    mergedCtx.drawImage(drawingCanvas, 0, 0);

    const imageData = mergedCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'VectorMeasure.png';
    link.click();
}

export function handleMeasureButtonClick() {
    measureOn = !measureOn;
    setMeasureActive(measureOn);
}

// If you have a central "activateTool" switcher, ensure it turns measure OFF:
// export function activateTool(tool) {
//     if (tool !== 'MEASURE' && measureOn) {
//         measureOn = false;
//         setMeasureActive(false);
//     }
// }
