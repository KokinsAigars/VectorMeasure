/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * app.js;
 */

import { SelectPDF } from './module/ui.js';
import { loadPdfByName } from './module/loader.js';

// call MAIN() function
document.addEventListener('DOMContentLoaded', () => {
    // selects pdf path to view
    const pdfPlan = SelectPDF.value;

    loadPdfByName(pdfPlan).then(success => {if (success) console.log('Loaded!');});

});