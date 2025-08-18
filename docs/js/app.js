/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * app.js;
 */

import { debugLogLevelA, debugLogLevelB } from './module/debug.js';
import { loadPdfByName } from './module/loader.js';
import {
    setPxPerMeter,
    setBasePxPerMeter,
    setPdfPlanPath,
    setPdfPlanReversePath,
    setPdfPlanVerticalPath,
    pxPerMeter,
    PdfPlanPath
} from './module/state.js';

// call MAIN() function
document.addEventListener('DOMContentLoaded', () => {
    if(debugLogLevelA) console.log('DOMContentLoaded')

    setPxPerMeter( 44.5);
    setBasePxPerMeter(44.5);
    setPdfPlanPath('pdf/PLANS_Tukums.pdf');
    setPdfPlanReversePath('pdf/PLANS_CUBE.pdf');
    setPdfPlanVerticalPath('pdf/PLANS_CUBE.pdf');

    loadPdfByName(PdfPlanPath, pxPerMeter).then(success => {
        if (success) {
            if(debugLogLevelB) console.log('Loaded! ', PdfPlanPath);
        }
    });
});


