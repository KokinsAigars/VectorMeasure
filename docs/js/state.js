/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * state.js [states]
 */

// Calibration and zoom state
export let pxPerMeter = 44.5;        // Default: 1px ≈ 0.02247 meters
export let basePxPerMeter = 44.5;    // For reset/view recalibration
export let currentScale = 1.5;
export let panOffset = { x: 0, y: 0 };
export let originalCanvasWidth = null;
export let unscaledViewport = null;

// Mutator functions for external modules
export function setPxPerMeter(value) {
    pxPerMeter = value;
}

export function setBasePxPerMeter(value) {
    basePxPerMeter = value;
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