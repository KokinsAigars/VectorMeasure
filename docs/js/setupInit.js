/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * setupInit.js;
 */

import {debugLogLevelLoading} from './debug.js';
import {
    setPxPerMeter,
    setBasePxPerMeter,
    setPdfPlanPath,
    setPdfPlanReversePath,
    setPdfPlanVerticalPath,
    setPdfPlanPath_calibrate,
} from './module/state.js';

export function setupInit() {
    if(debugLogLevelLoading) console.log('setupInit.js > setupInit() is called');

    setPxPerMeter( 44.5);
    setBasePxPerMeter(44.5);
    setPdfPlanPath('pdf/AK-I_1st.pdf');
    setPdfPlanPath_calibrate('pdf/AK-I_1st_calibrate2.pdf');
    setPdfPlanReversePath('pdf/AK-I_1st_reverse.pdf');
    setPdfPlanVerticalPath('pdf/AK-I_1st_flipVertical.pdf');
}
