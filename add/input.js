/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ input.js;
 */

// import * as actions from './actions.js';
// import * as measure from './measure.js';
// import * as draw from './drawing.js';
import * as ui from "./ui.js";
import {canvas, drawingCanvas, measureCanvas, previewCanvas} from "./canvas";

// Tool registry
export const Tool = {
    NONE: 'none',
    MEASURE: 'measure',
    LINE: 'line',
    DELETE: 'delete',
    COMMENT: 'comment',
    PAN: 'pan',
};

// Current tool + temporary override (Space)
let activeTool = Tool.NONE;
let overrideTool = null;      // when Space is held → PAN
let spaceDown = false;

// Cache canvases
const el = {
    container: ui.DivPdfContainer,
    pdf:       canvas,
    measure:   measureCanvas,
    preview:   previewCanvas,
    drawing:   drawingCanvas,
};

// Convenience: which canvas is interactive for a tool
function interactiveCanvasFor(tool) {
    switch (tool) {
        case Tool.MEASURE: return el.measure;
        case Tool.LINE: return el.drawing;
        case Tool.DELETE: return el.drawing;
        case Tool.COMMENT: return el.drawing;
        case Tool.PAN: return el.preview;   // we pan the *whole stack*, but we listen on preview
        default: return null;
    }
}

export function setActiveTool(tool) {
    activeTool = tool;

    // Reset pointer-events on all layers
    [el.measure, el.preview, el.drawing].forEach(c => {
        c.style.pointerEvents = 'none';
        c.style.cursor = 'default';
    });

    const ic = interactiveCanvasFor(getEffectiveTool());
    if (ic) {
        ic.style.pointerEvents = 'auto';
        ic.style.cursor =
            activeTool === Tool.PAN ? 'grab' :
                activeTool === Tool.MEASURE ? 'crosshair' :
                    activeTool === Tool.LINE || activeTool === Tool.DELETE || activeTool === Tool.COMMENT ? 'crosshair' :
                        'default';
    }

    ui.reflectActiveTool?.(activeTool); // optional: update buttons/ARIA UI
}

// When Space is pressed, we temporarily override to PAN
function getEffectiveTool() {
    return overrideTool || activeTool;
}

function onPointerDown(e) {
    const tool = getEffectiveTool();
    if (tool === Tool.PAN) {
        e.preventDefault();
        // show grabbing on the interactive canvas
        const ic = interactiveCanvasFor(tool);
        if (ic) ic.style.cursor = 'grabbing';
        actions.startPan(e);
    }
    if (tool === Tool.MEASURE) {
        // left click to place points / finish segment
        measure.canvasOnMeasureClick?.(e);
    }
    if (tool === Tool.LINE) {
        draw.linePointerDown?.(e);
    }
    // if (tool === Tool.DELETE) {
    //     draw.freehandPointerDown?.(e);
    // }
}

function onPointerMove(e) {
    const tool = getEffectiveTool();
    if (tool === Tool.PAN) {
        actions.movePan(e);
    }
    if (tool === Tool.MEASURE) {
        measure.onMeasureMove?.(e);
    }
    if (tool === Tool.LINE) {
        draw.linePointerMove?.(e);
    }
    // if (tool === Tool.DELETE) {
    //     draw.freehandPointerMove?.(e);
    // }
}

function onPointerUp(e) {
    const tool = getEffectiveTool();
    if (tool === Tool.PAN) {
        const ic = interactiveCanvasFor(tool);
        if (ic) ic.style.cursor = 'grab';
        actions.endPan?.(e);
    }
    if (tool === Tool.LINE) {
        draw.linePointerUp?.(e);
    }
    // if (tool === Tool.DELETE) {
    //     draw.freehandPointerUp?.(e);
    // }
}

// Hook once
export function attachInput() {
    // Prevent text selection / drag ghost
    el.container.addEventListener('dragstart', e => e.preventDefault());
    el.container.addEventListener('contextmenu', e => e.preventDefault());

    // We listen on all canvases we might use
    [el.measure, el.preview, el.drawing].forEach(c => {
        if (!c) return;
        c.addEventListener('mousedown', onPointerDown);
        c.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);
    });

    // Space-to-pan override
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !spaceDown) {
            spaceDown = true;
            overrideTool = Tool.PAN;
            const ic = interactiveCanvasFor(getEffectiveTool());
            if (ic) ic.style.pointerEvents = 'auto';
            ic && (ic.style.cursor = 'grab');
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            spaceDown = false;
            overrideTool = null;
            // restore tool’s interactive canvas & cursor
            setActiveTool(activeTool);
        }
    });

    // Initialize with none or a default
    setActiveTool(Tool.MEASURE); // or Tool.NONE
}

export function wireToolButtons() {
    const btnMeasure  = document.querySelector('[data-tool="measure"]');
    const btnLine     = document.querySelector('[data-tool="line"]');
    const btnFreehand = document.querySelector('[data-tool="freehand"]');
    const btnPan      = document.querySelector('[data-tool="pan"]');

    btnMeasure?.addEventListener('click', () => setActiveTool(Tool.MEASURE));
    btnLine?.addEventListener('click',     () => setActiveTool(Tool.LINE));
    btnFreehand?.addEventListener('click', () => setActiveTool(Tool.DELETE));
    btnPan?.addEventListener('click',      () => setActiveTool(Tool.PAN));
}

// Optional UI helper so buttons reflect state
ui.reflectActiveTool = function(tool) {
    const all = document.querySelectorAll('[data-tool]');
    all.forEach(b => {
        const on = b.getAttribute('data-tool') === tool;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
    });
};
