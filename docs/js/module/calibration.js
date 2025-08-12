/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * module/ calibration.js
 */

import { getMeasurementPoints, clearMeasurementState } from './measure.js';
import { setPxPerMeter, currentScale, setBasePxPerMeter, recomputePxPerMeter, pxPerMeter } from './state.js';

export function handleCalibrateClick() {
    const realWorldMeters = parseFloat(document.getElementById('real-length').value);
    const { lastMeasuredStart, lastMeasuredEnd } = getMeasurementPoints();
    if (!lastMeasuredStart || !lastMeasuredEnd || isNaN(realWorldMeters) || realWorldMeters <= 0) return;

    // distance measured in OVERLAY pixels (at current zoom)
    const dx = lastMeasuredEnd.x - lastMeasuredStart.x;
    const dy = lastMeasuredEnd.y - lastMeasuredStart.y;
    const overlayPixelDistance = Math.sqrt(dx*dx + dy*dy);

    // convert to PAGE pixels (scale=1)
    const pagePixelDistance = overlayPixelDistance / currentScale;

    // base calibration: pixels-per-meter in page space
    const newBase = pagePixelDistance / realWorldMeters;
    setBasePxPerMeter(newBase);
    recomputePxPerMeter(); // updates live pxPerMeter for current zoom

    document.getElementById('info').innerText =
        `✅ Calibrated: 1px@zoom = ${(1 / pxPerMeter).toFixed(5)} m  |  base: 1px(page) = ${(1 / newBase).toFixed(5)} m`;

    clearMeasurementState();
}