/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * loader.js
 */

import { clearCanvasContainer } from './canvas.js';
import { setupEventListeners } from './events.js';
import { initCanvasRenderPDF } from './canvas.js';
import { DivPdfContainer } from './ui.js';

export async function loadPdfByName(planName) {
    const PDFlink = `pdf/${planName}.pdf`;

    clearCanvasContainer();


    await initCanvasRenderPDF({
        PDFlink,
        DivPdfContainer,
        pxPerMeter: 44.5,
        workerSrc: 'js/pdfjs/pdf.worker.mjs'
    });

    setupEventListeners();

    return true;
}