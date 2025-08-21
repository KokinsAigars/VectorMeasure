/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ pdf-runtime.js;
 */

let pdfjsLib = null;

export async function getPdfjs() {
    // Skip entirely when running under Vitest
    if (import.meta?.vitest) return null;

    if (!pdfjsLib) {
        pdfjsLib = await import('../pdfjs/pdf.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '../pdfjs/pdf.worker.mjs';
    }
    return pdfjsLib;
}
