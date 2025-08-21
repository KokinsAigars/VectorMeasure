/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ pdf-runtime.js;
 */

import {debugLogLevelLoading} from '../debug.js';

let pdfjsLib = null;

export async function getPdfjs() {
    if(debugLogLevelLoading) console.log('pdf-runtime.js > getPdfjs() is called');

    // Skip entirely when running under Vitest
    if (import.meta?.vitest) return null;

    if (!pdfjsLib) {
        pdfjsLib = await import('../pdfjs/pdf.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '../pdfjs/pdf.worker.mjs';
    }
    return pdfjsLib;
}
