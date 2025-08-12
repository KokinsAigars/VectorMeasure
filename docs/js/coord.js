/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * coord.js
 */

import { unscaledViewport, viewport } from './canvas.js';
import { panOffset } from './state.js';

// Screen/client -> overlay canvas pixels
export function eventToOverlayXY(e, overlayCanvas) {
    const r = overlayCanvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
}

// Overlay canvas pixels -> page space (scale=1)
export function overlayToPageXY(xOverlay) {
    const sx = unscaledViewport.width  / viewport.width;
    const sy = unscaledViewport.height / viewport.height;
    return {
        x: (xOverlay.x - panOffset.x) * sx,
        y: (xOverlay.y - panOffset.y) * sy
    };
}

// Page space (scale=1) -> overlay canvas pixels
export function pageToOverlayXY(pPage) {
    const sx = viewport.width  / unscaledViewport.width;
    const sy = viewport.height / unscaledViewport.height;
    return { x: pPage.x * sx, y: pPage.y * sy };
}