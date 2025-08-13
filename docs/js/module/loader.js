/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * module/ loader.js
 */

import { setupEventListeners } from './events.js';
import { initCanvasRenderPDF } from './canvas.js';
import { DivPdfContainer } from './ui.js';

let isLoadingPdf = false;
let currentLoadId = 0;

export async function loadPdfByName(planName) {
    if (isLoadingPdf) {
        console.warn('PDF load in progress — skipping duplicate call');
        return false;
    }
    isLoadingPdf = true;
    const thisLoadId = ++currentLoadId;

    const PDFlink = `pdf/${planName}.pdf`;

    try {
        await initCanvasRenderPDF({
            PDFlink,
            DivPdfContainer,
            pxPerMeter: 44.5,
            workerSrc: 'js/pdfjs/pdf.worker.mjs'
        });

        // Make sure no newer call was made while we were loading
        if (thisLoadId !== currentLoadId) {
            console.warn('A newer PDF load was triggered — this one will be ignored');
            return false;
        }

        setupEventListeners();
        return true;

    } catch (err) {
        console.error('PDF load error:', err);
        return false;

    } finally {
        isLoadingPdf = false;
    }

}
