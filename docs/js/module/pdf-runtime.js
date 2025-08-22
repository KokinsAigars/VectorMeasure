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

    // Skip entirely when testing with Vitest
    if (import.meta?.vitest) return null;

    if (!pdfjsLib) {
        pdfjsLib = await import('../libs/pdfjs/pdf.mjs');
    }
    return pdfjsLib;
}
