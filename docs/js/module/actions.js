/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ actions.js;
 */

import { debugLogLevelA, debugLogVerbose } from '../debug.js';
import * as ui from "./ui.js";
import * as state from './state.js';
import {clearCanvasContainer, commentCanvas, drawingCanvas, measureCanvas, pdfCanvas, renderAtCurrentTransform} from './canvas.js';
import {loadPdfByName} from './loader.js';
import {setMeasureActive, cancelCurrentMeasure} from './measure.js';
import {cancelDrawing, clearAllLines} from './draw.js';
import { clearAllComments, exportCommentsJSON } from './comments.js';
import {setCurrentScale} from "./state.js";

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

function setCanvasCursor() {
    if(debugLogLevelA && !debugLogVerbose) console.log('actions.js > setCanvasCursor() is called');
    if (debugLogVerbose) {
        console.groupCollapsed('function setCanvasCursor()');
            console.log('prepare Canvas according to activeTool. Set mouse pointer (cursor) && .style.pointerEvents');
            console.log('if activeTool is TOOL.PAN > cursor is /grab/, etc.');
        console.groupEnd();
    }

    // pdfCanvas (Pan)
    pdfCanvas.style.pointerEvents = (activeTool === TOOL.PAN) ? 'auto' : 'none';
    pdfCanvas.style.cursor       = (activeTool === TOOL.PAN) ? 'grab' : 'default';

    // measureCanvas (Measure)
    measureCanvas.style.pointerEvents = (activeTool === TOOL.MEASURE) ? 'auto' : 'none';
    measureCanvas.style.cursor        = (activeTool === TOOL.MEASURE) ? 'crosshair' : 'default';

    // drawingCanvas (Draw/Delete/Comment)
    const useDrawing = [TOOL.DRAW, TOOL.DELETE].includes(activeTool);
    drawingCanvas.style.pointerEvents = useDrawing ? 'auto' : 'none';
    drawingCanvas.style.cursor =
        activeTool === TOOL.DRAW ? 'crosshair' :
            activeTool === TOOL.DELETE ? 'not-allowed' : 'default';

    // commentCanvas accepts clicks only in COMMENT mode
    const cc = document.getElementById('comment-canvas');
    if (cc) {
        cc.style.pointerEvents = (activeTool === TOOL.COMMENT) ? 'auto' : 'none';
        cc.style.cursor = (activeTool === TOOL.COMMENT) ? 'crosshair' : 'default';
    }
}

export function renderButton(button, on) {
    if(debugLogLevelA && !debugLogVerbose) console.log('actions.js > renderButton('+ button +', '+ on +') is called');
    if (debugLogVerbose) {
        console.groupCollapsed('function renderButton('+ button.innerText +', '+ on +')');
            console.log('switching html class as well as aria-pressed="false" data-mode="off" . on or off');
            console.log('also changing text on buttons according if button is on or off');
            console.log('also changing text in ui.DivInfo.innerText, some interface info display');
        console.groupEnd();
    }

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
    } else if (button === ui.BtnComment) {
        button.textContent = on ? '✅ Comment' : 'Comment';
    }
}

function renderAllButtons() {
    if(debugLogLevelA && !debugLogVerbose) console.log('actions.js > renderAllButtons() is called');
    if (debugLogVerbose) {
        console.groupCollapsed('function renderAllButtons()');
            console.log('"all" the buttons are rendered off except active one, what is determined by activeTool');
            console.log('ui.BtnMeasure, ui.BtnAddLine, ui.BtnDeleteLine, ui.BtnComment, ui.BtnPanToggle');
            console.log('looping through array calling function renderButton(btn, false) to switch off all the buttons');
            console.log('calling function renderButton(true) on button that matches if (activeTool === TOOL.XXX) to turn it back on');
        console.groupEnd();
    }

    // OFF by default
    [ui.BtnMeasure, ui.BtnAddLine, ui.BtnDeleteLine, ui.BtnComment, ui.BtnPanToggle]
        .forEach(btn => btn && renderButton(btn, false));

    // turn ON only the active one
    if (activeTool === TOOL.PAN)       renderButton(ui.BtnPanToggle, true);
    if (activeTool === TOOL.MEASURE)   renderButton(ui.BtnMeasure, true);
    if (activeTool === TOOL.DRAW)      renderButton(ui.BtnAddLine, true);
    if (activeTool === TOOL.DELETE)    renderButton(ui.BtnDeleteLine, true);
    if (activeTool === TOOL.COMMENT)   renderButton(ui.BtnComment, true);
}

function setTool(next) {
    if (debugLogLevelA && !debugLogVerbose) console.log('actions.js > setTool('+ next +') is called');
    if (debugLogVerbose) {
        console.groupCollapsed('function setTool(next)');
            console.log('actions.js > setTool('+ next +') is called');
            console.log('argument comes form buttons handles function, e.g. setTool('+ next +');')
            console.log('changing export let activeTool');
            console.log('panMode is on if activeTool is TOOL.PAN');
            console.log('function is called > renderAllButtons()');
            console.log('function is called > setCanvasCursor()');
            console.log('disable draw capability if active tools is not Draw, by calling function > cancelDrawing();');
            console.log('disable measure if active tools is not MEASURE, by calling function > cancelCurrentMeasure();');
        console.groupEnd();
    }

    // toggle if same button pressed
    activeTool = (activeTool === next) ? TOOL.NONE : next;

    // reflect pan state for space-less panning
    panMode = (activeTool === TOOL.PAN);

    renderAllButtons();
    setCanvasCursor();

    if (activeTool !== TOOL.DRAW) {
        try { cancelDrawing(); } catch {}
    }
    if (activeTool !== TOOL.MEASURE) {
        try { cancelCurrentMeasure(); } catch {}
    }
}

export function offBtn() {
    if (debugLogLevelA) console.log('actions.js > offBtn() is called');

    isPanning = false;
    panMode = false;
    panStart = { x: 0, y: 0 }
    measureOn = false;
    activeTool = TOOL.NONE;
    setTool(TOOL.NONE);
    cancelCurrentMeasure();

    [ui.BtnPanToggle, ui.BtnMeasure, ui.BtnAddLine, ui.BtnDeleteLine, ui.BtnComment]
        .forEach(btn => btn && renderButton(btn, false));
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
        '#pdf-canvas, #measure-canvas, #preview-canvas, #drawing-canvas, #comment-canvas'
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

export async function handleZoomAll() {
    if(debugLogLevelA) console.log('actions.js > handleZoomAll() is called');

    state.setCurrentScale(1);
    state.recomputePxPerMeter();
    await renderAtCurrentTransform();
}

export function handlePanBtn() {
    if(debugLogLevelA) console.log('actions.js > handlePanBtn() is called');

    if( activeTool !== TOOL.PAN) {
        setTool(TOOL.PAN);
    } else {
        setTool(TOOL.NONE);
    }
}

export async function handleResetView() {
    if(debugLogLevelA) console.log('actions.js > handleResetView() is called');

    reset()

    loadPdfByName(state.PdfPlanPath, state.pxPerMeter).then(success => {
        if (success) {
            if(debugLogLevelA) console.log('Loaded! ', state.PdfPlanPath);
        }
    });
}

export function flipPdfHorizontal() {
    if(debugLogLevelA) console.log('actions.js > flipPdfHorizontal() is called');

    reset()

    loadPdfByName(state.PdfPlanReversePath, state.pxPerMeter).then(success => {
        if (success) {
            if(debugLogLevelA) console.log('Loaded! ', state.PdfPlanReversePath);
        }
    });
}

export function flipPdfVertical() {
    if(debugLogLevelA) console.log('actions.js > flipPdfVertical() is called');

    reset()

    loadPdfByName(state.PdfPlanVerticalPath, state.pxPerMeter).then(success => {
        if (success) {
            if(debugLogLevelA) console.log('Loaded! ', state.PdfPlanVerticalPath);
        }
    });
}

export function reset() {
    if(debugLogLevelA) console.log('actions.js > reset() is called');

    clearAllLines();
    clearAllComments(); //wipe comment bubbles && sessionStorage for this doc
    offBtn();
    clearCanvasContainer();
    setMeasureActive(false);
}

export function handleMeasureBtn() {
    if (debugLogLevelA && !debugLogVerbose) console.log('USER: actions.js > handleMeasureBtn() is called');
    if (debugLogVerbose) {
        console.groupCollapsed('USER: Measure button clicked');
            console.log('index.html button Measure > ui.js selected / events.js added EventListeners and functions');
            console.log('actions.js > handleMeasureBtn() is called');
            console.log('checking if button is active, if data-mode="off" or "on"');
            console.log('if(off) > switch it on, and vice versa');
            console.log('calling function > setTool(TOOL.MEASURE); // or setTool(TOOL.NONE);');
            console.log('calling function >  setMeasureActive(true);; // or cancelCurrentMeasure();');
            console.log('switching measureOn = true // or false');
        console.groupEnd();
    }

    let isOn = ui.BtnMeasure.dataset;
    // console.log('isOn: ', isOn.mode);
    if(isOn.mode === 'off') {
        // console.log('measureOn');
        measureOn = true;
        setTool(TOOL.MEASURE);
        setMeasureActive(true);
    }
    else {
        // console.log('measureOff');
        setTool(TOOL.NONE);
        cancelCurrentMeasure()
    }

    measureOn = !measureOn;
}

export function handleAddLineBtn() {
    if (debugLogLevelA && !debugLogVerbose) console.log('USER: actions.js > handleAddLineBtn() is called');
    if (debugLogVerbose) {
        console.groupCollapsed('USER: Add Line button clicked');
            console.log('index.html button Add Line > ui.js selected / events.js added EventListeners and functions');
            console.log('actions.js > handleAddLineBtn() is called');
            console.log('calling function > setTool(TOOL.DRAW)');
        console.groupEnd();
    }

    setTool(TOOL.DRAW);
}

export function handleDeleteLineBtn() {
        if (debugLogLevelA && !debugLogVerbose) console.log('USER: actions.js > handleDeleteLineBtn() is called');
        if (debugLogVerbose) {
            console.groupCollapsed('USER: Delete Line button clicked');
                console.log('index.html button Delete Line > ui.js selected / events.js added EventListeners and functions');
                console.log('actions.js > handleDeleteLineBtn() is called');
                console.log('calling function > setTool(TOOL.DELETE)');
            console.groupEnd();
        }

        setTool(TOOL.DELETE);

}

export function handleAddCommentBtn() {
    if (debugLogLevelA && !debugLogVerbose) console.log('USER: actions.js > handleAddCommentBtn() is called');
    if (debugLogVerbose) {
        console.groupCollapsed('USER: Comment button clicked');
            console.log('index.html button Comments > ui.js selected / events.js added EventListeners and functions');
            console.log('actions.js > handleAddCommentBtn() is called');
            console.log('checking if button is active, if data-mode="off" or "on"');
            console.log('calling function > setTool(TOOL.COMMENT) //or setTool(TOOL.NONE)');
        console.groupEnd();
        }

    let isOn = ui.BtnComment.dataset;

    if(isOn.mode === 'off') {
        setTool(TOOL.COMMENT);
    } else {
        setTool(TOOL.NONE);
    }

}

export function handlePngSaveClick() {
    if(debugLogLevelA) console.log('actions.js > handlePngSaveClick() is called');

    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = pdfCanvas.width;
    mergedCanvas.height = pdfCanvas.height;

    const mergedCtx = mergedCanvas.getContext('2d');
    mergedCtx.drawImage(pdfCanvas, 0, 0);        // base PDF
    mergedCtx.drawImage(drawingCanvas, 0, 0);    // lines
    mergedCtx.drawImage(commentCanvas, 0, 0);    // bubbles + numbers on top

    const imageData = mergedCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'VectorMeasure.png';
    link.click();
}

export function handleExportComments() {
    if(debugLogLevelA) console.log('actions.js > handleExportComments() is called');

    const data = exportCommentsJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'comments.json';
    a.click();

    URL.revokeObjectURL(url);
}

