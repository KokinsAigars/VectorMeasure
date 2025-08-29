// app2.js (stage controller) — aligned to current modules

import { setupInit, setupInit2 } from './setupInit.js';
import * as ui from './module/ui.js';
import * as actions from './module/actions.js';
import * as state from './module/state.js';
import { renderAtCurrentTransform, pdfDoc, ensureCanvas, setupCanvasHiDPI } from './module/canvas.js';
import { loadPdfByName } from './module/loader.js';
import { enableMeasureModeOnce, setMeasureActive } from './module/measure.js';
import {clearBanner, pickPlanPdf, setToolbarEnabled, showBanner, toast} from "./module/actions.js";

// --- App stages ---------------------------------------------------
export const STAGE = { CALIBRATE: 'CALIBRATE', PLAN: 'PLAN' };

// Persist keys
const LS_KEYS = {
    BASE_PX_PER_M: 'vm.basePxPerMeter',
    PLAN_PATH:     'vm.planPath',
};

const CAL_BASE_LEN_METERS = 10; // ← fixed baseline length

function initLayers(viewportW, viewportH) {
    const root = ui.DivPdfContainer; // document.getElementById('pdf-container')

    const pdfCanvas      = ensureCanvas(root, 'pdf-canvas');
    const drawingCanvas  = ensureCanvas(root, 'drawing-canvas');
    const measureCanvas  = ensureCanvas(root, 'measure-canvas');
    const commentCanvas  = ensureCanvas(root, 'comment-canvas');

    const pdfCtx     = setupCanvasHiDPI(pdfCanvas,     viewportW, viewportH);
    const drawCtx    = setupCanvasHiDPI(drawingCanvas, viewportW, viewportH);
    const measureCtx = setupCanvasHiDPI(measureCanvas, viewportW, viewportH);
    const commentCtx = setupCanvasHiDPI(commentCanvas, viewportW, viewportH);

    return { pdfCanvas, drawingCanvas, measureCanvas, commentCanvas, pdfCtx, drawCtx, measureCtx, commentCtx };
}


/// --- Boot ----------------------------------------------------------
export async function bootApp() {
    // defaults (paths, px/m) so PLAN can load even after refresh
    setupInit2();

    const storedBase = Number(sessionStorage.getItem(LS_KEYS.BASE_PX_PER_M));
    if (!Number.isFinite(storedBase) || storedBase <= 0) {
        await transitionTo(STAGE.CALIBRATE);
    } else {
        state.setBasePxPerMeter(storedBase);
        state.recomputePxPerMeter?.();
        await transitionTo(STAGE.PLAN);
    }
}
function boot() {
    state.loadCalibration();   // restores pxPerMeterPDF if present
    state.dpr = window.devicePixelRatio || 1;
    // then set up canvases, PDF page, handlers, etc.
}


// --- Stage transitions --------------------------------------------
let currentStage = null;
export async function transitionTo(next) {
    if (currentStage === next) return;
    currentStage = next;
    if (next === STAGE.CALIBRATE) await enterCalibrateStage();
    if (next === STAGE.PLAN) await enterPlanStage();
}

// --- Stage 1: Calibrate (fixed 10 m) -------------------------------
async function enterCalibrateStage() {
    setToolbarEnabled?.({
        measure: true, draw: false, comment: false,
        pan: true, zoomIn: true, zoomOut: true, zoomAll: true, reset: true,
    });
    showBanner?.('Calibration', 'Click two points exactly 10 meters apart.');

    // Ensure a page exists to measure on (use default plan or ask user)
    let planPath = state.PdfPlanPath || sessionStorage.getItem(LS_KEYS.PLAN_PATH);
    if (!planPath) {
        planPath = await pickPlanPdf?.();
        if (!planPath) return; // user cancelled
        sessionStorage.setItem(LS_KEYS.PLAN_PATH, planPath);
    }

    // If not already loaded, load it now
    if (!pdfDoc) {
        await loadPdfByName(planPath);
        await renderAtCurrentTransform();
    }

    // One-shot measure; enable listeners explicitly for safety
    setMeasureActive?.(true);
    const { pxLength } = await enableMeasureModeOnce();
    setMeasureActive?.(false);

    // Fixed-length calibration: 10 m
    const basePxPerMeter = pxLength / CAL_BASE_LEN_METERS;
    state.setBasePxPerMeter(basePxPerMeter);
    sessionStorage.setItem(LS_KEYS.BASE_PX_PER_M, String(basePxPerMeter));
    state.recomputePxPerMeter?.();

    toast?.(`Calibrated to 10 m: ${basePxPerMeter.toFixed(2)} px/m`);

    await transitionTo(STAGE.PLAN);

}

// --- Stage 2: Plan view -------------------------------------------
async function enterPlanStage() {
    clearBanner?.();
    setToolbarEnabled?.({
        measure: true, draw: true, comment: true,
        pan: true, zoomIn: true, zoomOut: true, zoomAll: true, reset: true,
    });

    let planPath = state.PdfPlanPath || sessionStorage.getItem(LS_KEYS.PLAN_PATH);
    if (!planPath) {
        // try defaults again (setupInit may set it in state)
        setupInit();
        planPath = state.PdfPlanPath || sessionStorage.getItem(LS_KEYS.PLAN_PATH);
    }
    if (!planPath && pickPlanPdf) {
        showBanner?.('Load plan', 'Choose a plan PDF to continue.');
        planPath = await pickPlanPdf();
    }
    if (!planPath) return;
    sessionStorage.setItem(LS_KEYS.PLAN_PATH, planPath);

    // Always ensure a fresh load (re-wires layers correctly after refresh)
    await loadPdfByName(planPath);
    await renderAtCurrentTransform();

    state.recomputePxPerMeter?.();
    toast?.(`Plan ready. Scale: ${state.pxPerMeter.toFixed(2)} px/m`);
}

document.addEventListener('DOMContentLoaded', () => {
    bootApp().catch(console.error);
})
