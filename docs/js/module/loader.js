/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ loader.js;
 */

import { debugLogLevelA } from './debug.js';
import { setupEventListeners } from './events.js';
import { initCanvasRenderPDF } from './canvas.js';

let isLoadingPdf = false;
let currentLoadId = 0;

export async function loadPdfByName(_PdfPlanPath, _PxPerMeter) {
    if(debugLogLevelA) console.log('loader.js > loadPdfByName() is called')

    if (isLoadingPdf) {
        console.log('PDF load in progress — skipping duplicate call');
        return false;
    }
    isLoadingPdf = true;
    const thisLoadId = ++currentLoadId;

    try {
        await initCanvasRenderPDF({
            PDFlink: _PdfPlanPath,
            pxPerMeter: _PxPerMeter,
            workerSrc: 'js/pdfjs/pdf.worker.mjs'
        });

        // Make sure no newer call was made while we were loading
        if (thisLoadId !== currentLoadId) {
            console.log('A newer PDF load was triggered — this one will be ignored');
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

