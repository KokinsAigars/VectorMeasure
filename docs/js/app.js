/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * app.js
 */

import { selector } from './module/ui.js';
import { loadPdfByName } from './module/loader.js';

// call MAIN() function
document.addEventListener('DOMContentLoaded', () => {
    const pdfPlan = selector.value;

    loadPdfByName(pdfPlan).then(success => {if (success) console.log('Loaded!');});

});