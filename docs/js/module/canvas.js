/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ canvas.js;
 */

import {debugLogLevelA, debugLogLevelLoading} from '../debug.js';
import { DivInfo, DivPdfContainer } from "./ui.js";
import * as state from './state.js';
import { redrawAllLines } from './draw.js';
import {initComments, redrawComments} from './comments.js';
import { getPdfjs } from './pdf-runtime.js';

export let pdfDoc = null;
export let pdfPage = null;
export let PDFlink= null;
export let viewport = null;
export let currentScale  = null;
export let pdfCanvas= null;
export let pdfCanvasCtx= null;
export let measureCanvas= null;
export let previewCanvas= null;
export let previewCanvasCtx = null;
export let drawingCanvas= null;
export let commentCanvas = null;
let unscaledViewport = null;
let originalCanvasWidth = null;
let currentRenderTask = null;

export async function initCanvasRenderPDF(options = {}) {
    if(debugLogLevelLoading) console.log('canvas.js > initCanvasRenderPDF() is called');

    // Function Options
    PDFlink = options.PDFlink;
    const metersPerPx = 1 / options.pxPerMeter;
    if (options.workerSrc) pdfjsLib.GlobalWorkerOptions.workerSrc = options.workerSrc;

    DivInfo.innerText =`📐 Default calibration: 1px ≈ ${metersPerPx.toFixed(5)} meters`;

    const ok = await createPDFCanvas();
    if (!ok) return;

    await createMeasureCanvas();
    await createPreviewCanvas();
    await createDrawingCanvas();
    await createCommentCanvas();

    initComments();
}

async function loadPDF() {
    if(debugLogLevelLoading) console.log('canvas.js > loadPDF() is called');

    const lib = await getPdfjs();
    if (!lib) {
        if (debugLogLevelLoading) console.warn('PDF.js disabled in tests (import.meta.vitest).');
        return false;
    }

    pdfDoc = await pdfjsLib.getDocument(PDFlink).promise;
    pdfPage = await pdfDoc.getPage(1);

    return true;
}

async function createPDFCanvas() {
    if(debugLogLevelLoading) console.log('canvas.js > createPDFCanvas() is called');

    await loadPDF();
    if (!pdfPage) {
        console.error('No PDF page loaded!');
        return false;
    }

    //pdfPage.getViewport() returns information about the PDF page size at a given zoom level.
    unscaledViewport = pdfPage.getViewport({ scale: 1 });

    //fit PDF into a container
    const desiredWidth = DivPdfContainer.clientWidth;
    const scale = desiredWidth / unscaledViewport.width;
    viewport = pdfPage.getViewport({ scale: scale });

    //Store scale & dimensions in local and global stat
    currentScale = scale;
    originalCanvasWidth = desiredWidth;

    state.setCurrentScale(scale);
    state.setOriginalCanvasWidth(desiredWidth);
    state.setUnscaledViewport(unscaledViewport);

    await createPdfElementCanvas();

    //Render the PDF page into the canvas
    await pdfPage.render({ canvasContext: pdfCanvasCtx, viewport }).promise;

    return true;
}

async function createPdfElementCanvas() {
    if(debugLogLevelLoading) console.log('canvas.js > createPdfElementCanvas() is called');

    pdfCanvas = document.createElement('canvas');
    pdfCanvas.id = 'pdf-canvas';
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;
    pdfCanvas.style.position = 'absolute';
    pdfCanvas.style.top = '0';
    pdfCanvas.style.left = '0';
    pdfCanvasCtx = pdfCanvas.getContext('2d');
    DivPdfContainer.style.height = `${viewport.height}px`;
    DivPdfContainer.appendChild(pdfCanvas);
}

async function createMeasureCanvas() {
    if(debugLogLevelLoading) console.log('canvas.js > createMeasureCanvas() is called');

    measureCanvas = document.createElement('canvas');
    measureCanvas.id = 'measure-canvas';
    measureCanvas.width = viewport.width;
    measureCanvas.height = viewport.height;
    measureCanvas.style.position = 'absolute';
    measureCanvas.style.top = '0';
    measureCanvas.style.left = '0';
    measureCanvas.style.pointerEvents = 'none';
    DivPdfContainer.appendChild(measureCanvas);
}

async function createPreviewCanvas() {
    if(debugLogLevelLoading) console.log('canvas.js > createPreviewCanvas() is called');

    previewCanvas = document.createElement('canvas');
    previewCanvas.id = 'preview-canvas';
    previewCanvas.width = viewport.width;
    previewCanvas.height = viewport.height;
    previewCanvas.style.position = 'absolute';
    previewCanvas.style.top = '0';
    previewCanvas.style.left = '0';
    previewCanvas.style.pointerEvents = 'none';
    previewCanvasCtx = previewCanvas.getContext('2d');
    DivPdfContainer.appendChild(previewCanvas);
}

async function createDrawingCanvas() {
    if(debugLogLevelLoading) console.log('canvas.js > createDrawingCanvas() is called');

    drawingCanvas = document.createElement('canvas');
    drawingCanvas.id = 'drawing-canvas';
    drawingCanvas.width = viewport.width;
    drawingCanvas.height = viewport.height;
    drawingCanvas.style.position = 'absolute';
    drawingCanvas.style.top = '0';
    drawingCanvas.style.left = '0';
    drawingCanvas.style.pointerEvents = 'none';
    DivPdfContainer.appendChild(drawingCanvas);
}

async function createCommentCanvas() {
    if(debugLogLevelLoading) console.log('canvas.js > createCommentCanvas() is called');

    commentCanvas = document.createElement('canvas');
    commentCanvas.id = 'comment-canvas';
    commentCanvas.width = viewport.width;
    commentCanvas.height = viewport.height;
    commentCanvas.style.position = 'absolute';
    commentCanvas.style.top = '0';
    commentCanvas.style.left = '0';
    commentCanvas.style.pointerEvents = 'none';
    DivPdfContainer.appendChild(commentCanvas);
}




export function clearCanvasContainer() {
    if(debugLogLevelA) console.log('canvas.js > clearCanvasContainer() is called');

    if (DivPdfContainer) {
        DivPdfContainer.innerHTML = '';
    }

    [pdfCanvas, measureCanvas, previewCanvas, drawingCanvas, commentCanvas].forEach(c => {
        if (c && c.parentNode) c.parentNode.removeChild(c);
    });
}

export async function renderAtCurrentTransform() {
    if(debugLogLevelA) console.log('canvas.js > renderAtCurrentTransform() is called');

    if (!pdfPage || !pdfCanvas) return false;

    // cancel previous render if still running
    if (currentRenderTask) {
        try { currentRenderTask.cancel(); } catch {}
        currentRenderTask = null;
    }

    viewport = pdfPage.getViewport({ scale: state.currentScale });

    const needResize = pdfCanvas.width !== viewport.width || pdfCanvas.height !== viewport.height;
    if (needResize) {
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        // keep container height synced with zoom
        DivPdfContainer.style.height = `${viewport.height}px`;
    }

    pdfCanvasCtx = pdfCanvas.getContext('2d');
    pdfCanvasCtx.setTransform(1,0,0,1,0,0);
    pdfCanvasCtx.clearRect(0,0, pdfCanvas.width, pdfCanvas.height);

    // start and await render
    currentRenderTask = pdfPage.render({ canvasContext: pdfCanvasCtx, viewport });
    try {
        await currentRenderTask.promise;

    } catch (err) {
        if (err && err.name !== 'RenderingCancelledException') throw err;
        // if canceled, just exit; a newer render will run
        return false;
    } finally {
        currentRenderTask = null;
    }

    // sync overlays
    const t = `translate(${state.panOffset.x}px, ${state.panOffset.y}px)`;
    [measureCanvas, previewCanvas, drawingCanvas, commentCanvas].forEach(c => {
        if (!c) return;
        if (needResize) {
            c.width  = pdfCanvas.width;
            c.height = pdfCanvas.height;
        }
        c.style.transform = t;
        c.style.transformOrigin = 'top left';
    });

    redrawAllLines();

    redrawComments();

    return true;
}


