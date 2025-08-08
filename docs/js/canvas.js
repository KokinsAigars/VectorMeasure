/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * canvas.js
 */

import {
    setOriginalCanvasWidth,
    setUnscaledViewport,
    setCurrentScale
} from './state.js';

export let pdfDoc = null;
export let pdfPage = null;
export let viewport = null;
export let unscaledViewport = null;
export let originalCanvasWidth;
export let currentScale = 1.5;
export let canvas;
export let ctx;
export let measureCanvas;
export let previewCanvas;
export let previewCtx;
export let originalPdfImage;
export let panOffset = { x: 0, y: 0 };

export let DivPdfContainer;
export let PDFlink;

export async function initCanvasRenderPDF(options = {}) {
    PDFlink = options.PDFlink;
    DivPdfContainer = options.DivPdfContainer;

    if (options.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = options.workerSrc;
    }

    const metersPerPx = 1 / options.pxPerMeter;
    document.getElementById('info').innerText =
        `📐 Default calibration: 1px ≈ ${metersPerPx.toFixed(5)} meters`;

    await new Promise(requestAnimationFrame);
    await createPDFCanvas();
    await createMeasureCanvas();
    await createPreviewCanvas();

    requestAnimationFrame(() => {
        console.log('Reset scale:', currentScale);
        console.log('Canvas size:', canvas.width, canvas.height);
        console.log('Transform:', canvas.style.transform);
    });
}

async function loadPDF() {
    if (!pdfDoc) {
        pdfDoc = await pdfjsLib.getDocument(PDFlink).promise;
        pdfPage = await pdfDoc.getPage(1);
    }
}

async function createPDFCanvas() {
    await loadPDF();

    unscaledViewport = pdfPage.getViewport({ scale: 1 });
    const desiredWidth = DivPdfContainer.clientWidth;
    const scale = desiredWidth / unscaledViewport.width;
    viewport = pdfPage.getViewport({ scale });

    currentScale = scale;
    originalCanvasWidth = desiredWidth;

    // Update centralized state
    setCurrentScale(scale);
    setOriginalCanvasWidth(desiredWidth);
    setUnscaledViewport(unscaledViewport);

    canvas = document.createElement('canvas');
    canvas.id = 'pdf-canvas';
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';

    ctx = canvas.getContext('2d');
    DivPdfContainer.style.height = `${viewport.height}px`;
    DivPdfContainer.appendChild(canvas);

    await pdfPage.render({ canvasContext: ctx, viewport }).promise;

    originalPdfImage = new Image();
    originalPdfImage.src = canvas.toDataURL('image/png');
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
