// app.js (stage controller)

import { setupInit } from './setupInit.js';
import * as ui from './module/ui.js';
import * as actions from './module/actions.js';
import * as state from './module/state.js';
import { renderAtCurrentTransform, pdfDoc, ensureCanvas, setupCanvasHiDPI } from './module/canvas.js';
import { loadPdfByName } from './module/loader.js';
import { enableMeasureModeOnce, setMeasureActive } from './module/measure.js';
import {clearBanner, pickPlanPdf, setToolbarEnabled, showBanner, toast} from "./module/actions.js";
import {currentScale, PdfPlanPath_calibrate} from "./module/state.js";
import {DivMeasurementTip} from "./module/ui.js";

// --- App stages ---------------------------------------------------
export const STAGE = { CALIBRATE: 'CALIBRATE', PLAN: 'PLAN' };

// Persist keys
const LS_KEYS = {
    // Base key for storing all calibrations
    CALIBRATIONS: 'vm.calibrations',
    // Current plan path
    PLAN_PATH: 'vm.planPath',
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


// Helper function to get/set calibrations
function getCalibrations() {
    const calibrations = sessionStorage.getItem(LS_KEYS.CALIBRATIONS);
    return calibrations ? JSON.parse(calibrations) : {};
}

function saveCalibration(planPath, pxPerMeter) {
    const calibrations = getCalibrations();
    calibrations[planPath] = {
        pxPerMeter,
        timestamp: new Date().toISOString()
    };
    sessionStorage.setItem(LS_KEYS.CALIBRATIONS, JSON.stringify(calibrations));
    return pxPerMeter;
}

function getCalibration(planPath) {
    const calibrations = getCalibrations();
    return calibrations[planPath]?.pxPerMeter;
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

// --- Stage 1: Calibrate (fixed 10 m) ------------------------------
async function enterCalibrateStage() {
    setToolbarEnabled?.({
        measure: true, draw: false, comment: false,
        pan: true, zoomIn: true, zoomOut: true, zoomAll: true, reset: true,
    });
    showBanner?.('Calibration', 'Click two points exactly 10 meters apart.');

    // Ensure a page exists to measure on (use default plan or ask user)
    let planPath_calibrate = state.PdfPlanPath_calibrate;
    if (!planPath_calibrate) {
        planPath_calibrate = await pickPlanPdf?.();
    }

    // If not already loaded, load it now
    if (!pdfDoc) {
        await loadPdfByName(planPath_calibrate);
        await renderAtCurrentTransform();
    }

    // One-shot measure; enable listeners explicitly for safety
    setMeasureActive?.(true);
    const { pxLength } = await enableMeasureModeOnce();
    setMeasureActive?.(false);

    // Fixed-length calibration: 10 m (divide by currentScale to get base value)
    const basePxPerMeter = (pxLength / CAL_BASE_LEN_METERS) / currentScale;
    state.setBasePxPerMeter(basePxPerMeter);
    
    // Save calibration for this specific plan
    saveCalibration(planPath_calibrate, basePxPerMeter);
    state.recomputePxPerMeter?.();

    toast?.(`Calibrated to 10 m: ${basePxPerMeter.toFixed(2)} px/m for ${planPath_calibrate.split('/').pop()}`);

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

// --- Boot App -----------------------------------------------------
export async function bootApp() {
    // Get the current plan path
    let planPath = state.PdfPlanPath || sessionStorage.getItem(LS_KEYS.PLAN_PATH);

    // No plan selected yet, go to calibration
    if (!planPath) {
        await transitionTo(STAGE.CALIBRATE);
        return;
    }

    // Check if we have a saved calibration for this plan
    const storedCalibration = getCalibration(planPath);

    if (!storedCalibration) {
        await transitionTo(STAGE.CALIBRATE);
    } else {
        state.setBasePxPerMeter(storedCalibration);
        state.recomputePxPerMeter?.();
        await transitionTo(STAGE.PLAN);
    }
}

// Wait for DOM to be fully loaded before initializing
export async function initApp() {
    try {
        console.log('Initializing...');
        sessionStorage.clear();
        // First make sure UI is set up
        setupInit();
        
        // Then boot the app
        await bootApp();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        // Show error to user
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '20px';
        errorDiv.style.fontFamily = 'Arial, sans-serif';
        errorDiv.innerHTML = `
            <h2>Error initializing application</h2>
            <p>${error.message}</p>
            <p>Please refresh the page to try again.</p>
        `;
        document.body.innerHTML = '';
        document.body.appendChild(errorDiv);
    }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp().then();
}
