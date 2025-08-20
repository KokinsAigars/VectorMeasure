/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * setupInit.js;
 */

import {debugLogLevelLoading} from './module/debug.js';
import {
    setPxPerMeter,
    setBasePxPerMeter,
    setPdfPlanPath,
    setPdfPlanReversePath,
    setPdfPlanVerticalPath,
} from './module/state.js';

export function setupInit() {
    if(debugLogLevelLoading) console.log('setupInit.js > setupInit() is called');

    setPxPerMeter( 44.5);
    setBasePxPerMeter(44.5);
    setPdfPlanPath('pdf/PLANS_Tukums.pdf');
    setPdfPlanReversePath('pdf/PLANS_Tukums_reverse.pdf');
    setPdfPlanVerticalPath('pdf/PLANS_Tukums_vertical.pdf');
}
