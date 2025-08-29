/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ calibration.js;
 */

import * as state from './state.js';
import {debugLogLevelA} from "../debug.js";
import { getMeasurementPoints, clearMeasurementState } from './measure.js';

let calP1 = null;
let calP2 = null;

export function handleCalibrateClick() {
    if(debugLogLevelA) console.log('calibration.js > handleCalibrateClick() is called');

    const realWorldMeters = parseFloat(document.getElementById('real-length').value);
    const { lastMeasuredStart, lastMeasuredEnd } = getMeasurementPoints();
    if (!lastMeasuredStart || !lastMeasuredEnd || isNaN(realWorldMeters) || realWorldMeters <= 0) return;

    // distance measured in OVERLAY pixels (at current zoom)
    const dx = lastMeasuredEnd.x - lastMeasuredStart.x;
    const dy = lastMeasuredEnd.y - lastMeasuredStart.y;
    const overlayPixelDistance = Math.sqrt(dx*dx + dy*dy);

    // convert to PAGE pixels (scale=1)
    const pagePixelDistance = overlayPixelDistance / state.currentScale;

    // base calibration: pixels-per-meter in page space
    const newBase = pagePixelDistance / realWorldMeters;
    state.setBasePxPerMeter(newBase);
    state.recomputePxPerMeter(); // updates live pxPerMeter for current zoom

    document.getElementById('info').innerText =
        `✅ Calibrated: 1px@zoom = ${(1 / state.pxPerMeter).toFixed(5)} m  |  base: 1px(page) = ${(1 / newBase).toFixed(5)} m`;

    clearMeasurementState();
}

export function attachCalibrationHandlers(canvasEl, knownMeters = 10) {
    // User clicks two points on the PDF
    canvasEl.addEventListener('click', (e) => {
        const dev = eventToCanvasDevicePx(e, canvasEl);
        const pPdf = canvasToPdfPx(dev);

        if (!calP1) {
            calP1 = pPdf;
        } else {
            calP2 = pPdf;

            const measuredPdfPx = pdfDist(calP1, calP2);
            const pxPerMeterPDF = measuredPdfPx / knownMeters; // <-- UN-SCALED
            state.setCalibration(pxPerMeterPDF);

            // reset for next time
            calP1 = calP2 = null;
            console.log('[Calibration] measuredPdfPx=', measuredPdfPx,
                'knownMeters=', knownMeters,
                'pxPerMeterPDF=', pxPerMeterPDF);
        }
    }, { passive: true });
}

// state.pxPerMeterPDF is in PDF px per meter (scale=1)
function calibrateTwoClicks(canvas, knownMeters = 10, state) {
    let p1 = null;

    canvas.addEventListener('click', (e) => {
        const css = eventToCanvasCssPx(e, canvas);
        const pdf = cssToPdfPx(css, state);

        if (!p1) {
            p1 = pdf;
            return;
        }

        const p2 = pdf;
        const dPdf = pdfDist(p1, p2);
        state.pxPerMeterPDF = dPdf / knownMeters;

        // persist
        sessionStorage.setItem('vm.basePxPerMeter', String(state.pxPerMeterPDF));

        console.log('[Calib] dPdf=', dPdf, 'known=', knownMeters,
            'pxPerMeterPDF=', state.pxPerMeterPDF);

        p1 = null;
    }, { passive: true });
}

function measureTwoClicks(canvas, state, onDone) {
    let p1 = null;
    canvas.addEventListener('click', (e) => {
        if (!state.pxPerMeterPDF) { console.warn('No calibration'); return; }

        const css = eventToCanvasCssPx(e, canvas);
        const pdf = cssToPdfPx(css, state);

        if (!p1) { p1 = pdf; return; }

        const p2 = pdf;
        const dPdf = pdfDist(p1, p2);
        const meters = dPdf / state.pxPerMeterPDF;
        console.log('[Measure] dPdf=', dPdf, 'm=', meters);

        onDone?.({ p1, p2, meters });
        p1 = null;
    }, { passive: true });
}