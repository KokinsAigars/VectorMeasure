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
import {redrawMeasurement} from './measure.js';

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
let pdfjs = null;

export async function initCanvasRenderPDF(options = {}) {
    if(debugLogLevelLoading) console.log('canvas.js > initCanvasRenderPDF() is called');

    // Add validation
    if (!DivPdfContainer) {
        console.error('PDF container not found. Make sure the DOM is fully loaded.');
        return false;
    }

    // Function Options
    PDFlink = options.PDFlink;

    let metersPerPx = 1;
    if (options.pxPerMeter !== null){
        metersPerPx = 1 / options.pxPerMeter;
    }

    // Load pdf.js module and configure worker if provided
    pdfjs = await getPdfjs();
    if (options.workerSrc && pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc = options.workerSrc;
    }

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

    // In tests, getPdfjs() returns null via vitest alias — skip
    if (!pdfjs) {
        if (debugLogLevelLoading) console.warn('PDF.js disabled in tests (import.meta.vitest).');
        return false;
    }

    pdfDoc = await pdfjs.getDocument(PDFlink).promise;
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

    // Get viewport and calculate scale
    unscaledViewport = pdfPage.getViewport({ scale: 1 });
    
    // Fit PDF into container
    const desiredWidth = DivPdfContainer.clientWidth;
    const scale = desiredWidth / unscaledViewport.width;
    viewport = pdfPage.getViewport({ scale: scale });
    
    // Create the canvas element first
    await createPdfElementCanvas();
    
    // Now set up the canvas with high DPI
    const pdfCtx = setupCanvasHiDPI(pdfCanvas, viewport.width, viewport.height, window.devicePixelRatio || 1);
    if (!pdfCtx) {
        console.error('Failed to set up PDF canvas context');
        return false;
    }
    
    // Store scale & dimensions in local and global state
    currentScale = scale;
    originalCanvasWidth = desiredWidth;
    
    state.setCurrentScale(scale);
    state.setOriginalCanvasWidth(desiredWidth);
    state.setUnscaledViewport(unscaledViewport);

    //Render the PDF page into the canvas
    await pdfPage.render({ canvasContext: pdfCanvasCtx, viewport }).promise;

    if (!state.basePageW || !state.basePageH) {
        state.setBasePageSize(pdfCanvas.width, pdfCanvas.height);
    }

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
    const pdfCtx = setupCanvasHiDPI(pdfCanvas, viewport.width, viewport.height, window.devicePixelRatio || 1);

    const needResize = pdfCanvas.width !== viewport.width || pdfCanvas.height !== viewport.height;
    if (needResize) {
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        DivPdfContainer.style.height = `${viewport.height}px`;
            // keep overlays in lockstep with the PDF size
            for (const c of [measureCanvas, previewCanvas, drawingCanvas, commentCanvas].filter(Boolean)) {
            c.width = viewport.width;
            c.height = viewport.height;
        }
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

    // const t = `translate(${state.panX}px, ${state.panY}px)`;
    // for (const c of [pdfCanvas, measureCanvas, previewCanvas, drawingCanvas, commentCanvas].filter(Boolean)) {
    //     c.style.transformOrigin = '0 0';
    //     c.style.transform = t;
    // }

    const t = `translate(${state.panOffset.x}px, ${state.panOffset.y}px)`;
    for (const c of [pdfCanvas, measureCanvas, previewCanvas, drawingCanvas, commentCanvas].filter(Boolean)) {
        c.style.transformOrigin = '0 0';
        c.style.transform = t;
    }

    redrawAllLines();

    redrawComments();

    // also keep the last measured segment locked to the page
    try {
        redrawMeasurement();
    } catch {}

    return true;
}

// mouse/touch → canvas CSS pixels
function eventToCanvasCssPx(e, canvasEl) {
    const r = canvasEl.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    return [x, y]; // CSS px
}

// CSS px → PDF-space px (scale=1), panning in CSS px
function cssToPdfPx([cx, cy], { panX, panY, currentScale }) {
    const xPdf = (cx - panX) / currentScale;
    const yPdf = (cy - panY) / currentScale;
    return [xPdf, yPdf];
}

function pdfDist(p1, p2) {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return Math.hypot(dx, dy);
}

/**
 * Sets up a canvas for high-DPI display
 * @param {string|HTMLCanvasElement} canvasOrId - Either a canvas element or its ID
 * @param {number} cssW - Width in CSS pixels
 * @param {number} cssH - Height in CSS pixels
 * @param {number} [dpr=window.devicePixelRatio] - Device pixel ratio
 * @returns {CanvasRenderingContext2D|null} The 2D rendering context, or null if setup failed
 */
export function setupCanvasHiDPI(canvasOrId, cssW, cssH, dpr = window.devicePixelRatio || 1) {
    if (!cssW || !cssH) {
        console.error('Invalid canvas dimensions:', { cssW, cssH });
        return null;
    }

    let canvas;
    if (typeof canvasOrId === 'string') {
        canvas = document.getElementById(canvasOrId);
        if (!canvas) {
            console.error(`Canvas element with ID "${canvasOrId}" not found in the DOM`);
            return null;
        }
    } else if (canvasOrId instanceof HTMLCanvasElement) {
        canvas = canvasOrId;
    } else {
        console.error('Invalid canvas parameter. Expected ID string or HTMLCanvasElement, got:', canvasOrId);
        return null;
    }
    if (cssW == null || cssH == null) {
        throw new Error('setupCanvasHiDPI: cssW/cssH must be numbers');
    }

    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width  = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2D context for canvas');
        return null;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
}
export function ensureCanvas(container, id) {
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement('canvas');
        el.id = id;
        el.className = 'vm-layer'; // optional class
        container.appendChild(el);
    }
    return el;
}
