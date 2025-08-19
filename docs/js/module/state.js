/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ state.js;
 */

import {debugLogLevelA, debugLogLevelLoading} from './debug.js';

// Calibration and zoom state
export let pxPerMeter = 37.6;       // Default: 1px ≈ 0.02652 meters  [1/0.02660 = 37.6]
export let basePxPerMeter = 37.6;   // For reset/view recalibration [Store calibration relative to scale 1.0]
export let PdfPlanPath = null;
export let PdfPlanReversePath = null;
export let PdfPlanVerticalPath = null;
export let currentScale = 1;
export let originalCanvasWidth = null;
export let unscaledViewport = null;

export let panOffset = { x: 0, y: 0 };
export const ZOOM = { min: 0.25, max: 4.0, step: 0.1 };

export let scale = 1;

export function setPxPerMeter(value) {
    if(debugLogLevelLoading) console.log('state.js > setPxPerMeter(value) is called');

    pxPerMeter = value;
}
export function setBasePxPerMeter(value) {
    if(debugLogLevelLoading) console.log('state.js > setBasePxPerMeter(value) is called');

    basePxPerMeter = value;
}
export function setPdfPlanPath(value) {
    if(debugLogLevelLoading) console.log('state.js > setPdfPlanPath('+ value +') is called');

    PdfPlanPath = value;
}
export function setPdfPlanReversePath(value) {
    if(debugLogLevelLoading) console.log('state.js > setPdfPlanReversePath('+ value +') is called');

    PdfPlanReversePath = value;
}
export function setPdfPlanVerticalPath(value) {
    if(debugLogLevelLoading) console.log('state.js > setPdfPlanVerticalPath('+ value +') is called');

    PdfPlanVerticalPath = value;
}
export function setCurrentScale(value) {
    if(debugLogLevelLoading) console.log('state.js > setCurrentScale(value) is called');

    currentScale = value;
}
export function setOriginalCanvasWidth(value) {
    if(debugLogLevelLoading) console.log('state.js > setOriginalCanvasWidth(value) is called');

    originalCanvasWidth = value;
}
export function setUnscaledViewport(viewport) {
    if(debugLogLevelLoading) console.log('state.js > setUnscaledViewport(viewport) is called');

    unscaledViewport = viewport;
}


export function recomputePxPerMeter() {
    if(debugLogLevelA) console.log('state.js > recomputePxPerMeter() is called');

    pxPerMeter = basePxPerMeter * currentScale;
}
export function setPanOffset(x, y) {
    if(debugLogLevelA) console.log('state.js > setPanOffset(x, y) is called');

    panOffset = { x, y };
}
