/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * module/ state.js
 */

// Calibration and zoom state
export let pxPerMeter = 37.6;       // Default: 1px ≈ 0.02652 meters  [1/0.02660 = 37.6]
export let basePxPerMeter = 37.6;   // For reset/view recalibration [Store calibration relative to scale 1.0]
export let currentScale = 1;
let metersPerPixel = null;       // <-- calibration in UN-SCALED canvas pixels
let lastCalibPxLen = null;       // remember the picked segment px length (unscaled)

export let originalCanvasWidth = null;
export let unscaledViewport = null;
export let DivPdfContainer = null;

export let panOffset = { x: 0, y: 0 };
export const ZOOM = { min: 0.25, max: 4.0, step: 0.1 };

let _measureOn = false;
export const isMeasureOn = () => _measureOn;
export const setMeasureOn = (v) => {
    _measureOn = v;
    // broadcast to anyone who cares
    window.dispatchEvent(new CustomEvent('measure:change', { detail: { on: v } }));
};

// Mutator functions for external modules
export function setPxPerMeter(value) {
    pxPerMeter = value;
}

export function setBasePxPerMeter(value) {
    basePxPerMeter = value;
}

export function recomputePxPerMeter() {
    pxPerMeter = basePxPerMeter * currentScale;
}

export function setCurrentScale(value) {
    currentScale = value;
}

export function setPanOffset(x, y) {
    panOffset = { x, y };
}

export function setOriginalCanvasWidth(value) {
    originalCanvasWidth = value;
}

export function setUnscaledViewport(viewport) {
    unscaledViewport = viewport;
}

// Optional reset helper
export function resetState() {
    pxPerMeter = basePxPerMeter;
    currentScale = 1.0;
    panOffset = { x: 0, y: 0 };
}

// Bundle export (if needed elsewhere)
export const getState = () => ({
    pxPerMeter,
    basePxPerMeter,
    currentScale,
    panOffset,
    originalCanvasWidth,
    unscaledViewport
});