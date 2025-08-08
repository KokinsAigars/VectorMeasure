/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * calibration.js
 */

import { getMeasurementPoints, clearMeasurementState } from './measure.js';
import { setPxPerMeter } from './state.js';

export function handleCalibrateClick() {
    const realWorldMeters = parseFloat(document.getElementById('real-length').value);
    const { lastMeasuredStart, lastMeasuredEnd } = getMeasurementPoints();

    if (!lastMeasuredStart || !lastMeasuredEnd || isNaN(realWorldMeters) || realWorldMeters <= 0) {
        alert('❌ Measure a distance first, then enter a valid real-world value.');
        return;
    }

    const dx = lastMeasuredEnd.x - lastMeasuredStart.x;
    const dy = lastMeasuredEnd.y - lastMeasuredStart.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);

    const newPxPerMeter = pixelDistance / realWorldMeters;
    setPxPerMeter(newPxPerMeter);

    document.getElementById('info').innerText =
        `✅ Calibrated: 1px = ${(1 / newPxPerMeter).toFixed(5)} m`;

    clearMeasurementState();

    console.log(`ℹ️ pixelDistance = ${pixelDistance}, meters = ${realWorldMeters}`);
}