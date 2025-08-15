/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ measure.js;
 */

import { debugLogLevelA } from "./debug.js";
import { DivInfo, DivMeasurementTip } from "./ui.js";
import { measureCanvas, previewCanvas } from './canvas.js';
import { pxPerMeter } from './state.js';

let startPoint = null;
let isDrawing = false;
let lastMeasuredStart = null;
let lastMeasuredEnd = null;


export function cancelMeasurement() {
    if (debugLogLevelA) console.log('measure.js > cancelMeasurement() is called');

    const ctx = previewCanvas.getContext('2d');

    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    startPoint = null;
    isDrawing = false;

    DivInfo.innerText = 'Measuring mode stopped by ESC.';
    DivMeasurementTip.style.display = 'none';
}
