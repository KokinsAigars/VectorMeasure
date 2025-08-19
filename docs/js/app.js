/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * app_initialized() on 'DOMContentLoaded'
 * app.js;
 */

import {debugLogLevelLoading, debugLogLevelSuccess} from './module/debug.js';
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
    if(debugLogLevelLoading) console.log('DOMContentLoaded')

    setPxPerMeter( 44.5);
    setBasePxPerMeter(44.5);
    setPdfPlanPath('pdf/PLANS_Tukums.pdf');
    setPdfPlanReversePath('pdf/PLANS_Tukums_reverse.pdf');
    setPdfPlanVerticalPath('pdf/PLANS_Tukums_vertical.pdf');

    loadPdfByName(PdfPlanPath, pxPerMeter).then(success => {
        if (success) {
            if(debugLogLevelLoading || debugLogLevelSuccess) console.log('Loaded! ', PdfPlanPath);
        }
    });
});
