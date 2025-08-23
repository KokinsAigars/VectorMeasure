/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * app is initialized on 'DOMContentLoaded'
 * app.js;
 */

import {debugLogLevelLoading, debugLogLevelSuccess} from './debug.js';
import { setupInit } from "./setupInit.js";
import { loadPdfByName } from './module/loader.js';
import { PdfPlanPath, pxPerMeter } from "./module/state.js";

// call MAIN() function
document.addEventListener('DOMContentLoaded', () => {
    if(debugLogLevelLoading) console.log('DOMContentLoaded');

    if (sessionStorage.getItem("vm:comments")) sessionStorage.removeItem('vm:comments');

    setupInit();

    loadPdfByName(PdfPlanPath, pxPerMeter).then(success => {
        if (success) {
            if(debugLogLevelLoading || debugLogLevelSuccess) console.log('Loaded! ', PdfPlanPath);
        }
    });
});
