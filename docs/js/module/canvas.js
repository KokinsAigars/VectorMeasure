/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * module/ canvas.js
 */

import * as state from './state.js';
import { getSegments } from './measure_model.js';
import { pageToOverlayXY } from './coord.js';

export let pdfDoc = null;
export let pdfPage = null;
export let PDFlink;
export let viewport = null;
export let unscaledViewport = null;
export let originalCanvasWidth;
export let currentScale = 1.5;
export let canvas;
export let ctx;
export let measureCanvas;
export let previewCanvas;
export let drawingCanvas;
export let previewCtx;
export let originalPdfImage;
export let DivPdfContainer;
export let DrawingScale = null;
let renderToken = 0;


export async function initCanvasRenderPDF(options = {}) {
    clearCanvasContainer();

    // Function Options
    PDFlink = options.PDFlink; //console.log('PDFlink: ', PDFlink);
    DivPdfContainer = options.DivPdfContainer;
    const metersPerPx = 1 / options.pxPerMeter;
    if (options.workerSrc) pdfjsLib.GlobalWorkerOptions.workerSrc = options.workerSrc;

    document.getElementById('info').innerText =
        `📐 Default calibration: 1px ≈ ${metersPerPx.toFixed(5)} meters`;


    const ok = await createPDFCanvas();
    if (!ok) {
        alert('hmm, no pdf loaded')
        return;
    }
    await createMeasureCanvas();
    await createPreviewCanvas();
    await createDrawingCanvas();
    await new Promise(requestAnimationFrame);
    requestAnimationFrame(() => {
        console.log('Reset scale:', currentScale);
        console.log('Canvas size:', canvas.width, canvas.height);
        console.log('Transform:', canvas.style.transform);
    });
}

async function loadPDF() {

    pdfDoc = await pdfjsLib.getDocument(PDFlink).promise;
    pdfPage = await pdfDoc.getPage(1);

}

async function createPDFCanvas() {
    await loadPDF();
    if (!pdfPage) {
        console.error('No PDF page loaded!');
        return false;
    }

    //pdfPage.getViewport() returns information about the PDF page size at a given zoom level.
    unscaledViewport = pdfPage.getViewport({ scale: 1 });

    //fit PDF into container
    const desiredWidth = DivPdfContainer.clientWidth;
    const scale = desiredWidth / unscaledViewport.width;
    viewport = pdfPage.getViewport({ scale: scale });

    //Store scale & dimensions in local and global stat
    currentScale = scale;
    originalCanvasWidth = desiredWidth;
    state.setCurrentScale(scale);
    state.setOriginalCanvasWidth(desiredWidth);
    state.setUnscaledViewport(unscaledViewport);

    //Create the <canvas> element
    canvas = document.createElement('canvas');
    canvas.id = 'pdf-canvas';
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';

    //Prepare the drawing context and size container
    ctx = canvas.getContext('2d');
    DivPdfContainer.style.height = `${viewport.height}px`;
    DivPdfContainer.appendChild(canvas);

    //Render the PDF page into the canvas
    await pdfPage.render({ canvasContext: ctx, viewport }).promise;

    //Save a PNG copy of the PDF page
    originalPdfImage = new Image();
    originalPdfImage.src = canvas.toDataURL('image/png');

    return true;
}

export async function renderAtCurrentTransform() {
    if (!pdfPage || !canvas) return false;

    viewport = pdfPage.getViewport({ scale: state.currentScale });

    const needResize = canvas.width !== viewport.width || canvas.height !== viewport.height;
    if (needResize) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        // keep container height synced with zoom
        DivPdfContainer.style.height = `${viewport.height}px`;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    await pdfPage.render({ canvasContext: ctx, viewport }).promise;

    // sync overlays
    const t = `translate(${state.panOffset.x}px, ${state.panOffset.y}px)`;
    [measureCanvas, previewCanvas, drawingCanvas].forEach(c => {
        if (!c) return;
        if (needResize) {
            c.width  = canvas.width;
            c.height = canvas.height;
        }
        c.style.transform = t;
        c.style.transformOrigin = 'top left';
    });

    // redraw stored lines if size changed (or always, cheap enough)
    redrawMeasurements();

    return true;
}

async function createMeasureCanvas() {
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
    previewCanvas = document.createElement('canvas');
    previewCanvas.id = 'preview-canvas';
    previewCanvas.width = viewport.width;
    previewCanvas.height = viewport.height;
    previewCanvas.style.position = 'absolute';
    previewCanvas.style.top = '0';
    previewCanvas.style.left = '0';
    previewCanvas.style.pointerEvents = 'none';
    previewCtx = previewCanvas.getContext('2d');
    DivPdfContainer.appendChild(previewCanvas);
}

export function createDrawingCanvas() {
    console.log('createDrawingCanvas() function called')

    drawingCanvas = document.createElement('canvas');
    drawingCanvas.id = 'drawing-canvas';
    drawingCanvas.width = viewport.width;
    drawingCanvas.height = viewport.height;
    drawingCanvas.style.position = 'absolute';
    drawingCanvas.style.top = '0';
    drawingCanvas.style.left = '0';
    drawingCanvas.style.pointerEvents = 'none';
    previewCtx = previewCanvas.getContext('2d');
    DivPdfContainer.appendChild(drawingCanvas);
}

export function clearCanvasContainer() {
    console.log('clearCanvasContainer() function called')

    if (state.DivPdfContainer) {
        state.DivPdfContainer.innerHTML = '';
    }

    [canvas, measureCanvas, previewCanvas, drawingCanvas].forEach(c => {
        if (c && c.parentNode) c.parentNode.removeChild(c);
    });

}

export function redrawMeasurements() {
    if (!measureCanvas) return;
    const ctx = measureCanvas.getContext('2d');
    ctx.clearRect(0, 0, measureCanvas.width, measureCanvas.height);

    const segs = getSegments();
    ctx.strokeStyle = 'rgba(255,0,0,1)';
    ctx.lineWidth = 4;

    segs.forEach(({a,b}) => {
        const A = pageToOverlayXY(a);
        const B = pageToOverlayXY(b);
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
    });
}



