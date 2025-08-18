/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ coord.js;
 */

import { unscaledViewport, viewport } from './canvas.js';
import { panOffset } from './state.js';

// Overlay canvas pixels -> page space (scale=1)
export function overlayToPageXY(xOverlay) {
    console.log('coord.js > overlayToPageXY(xOverlay) is called');

    const sx = unscaledViewport.width  / viewport.width;
    const sy = unscaledViewport.height / viewport.height;
    return {
        x: (xOverlay.x - panOffset.x) * sx,
        y: (xOverlay.y - panOffset.y) * sy
    };
}

// Page space (scale=1) -> overlay canvas pixels
export function pageToOverlayXY(pPage) {
    console.log('coord.js > pageToOverlayXY(pPage) is called');

    const sx = viewport.width  / unscaledViewport.width;
    const sy = viewport.height / unscaledViewport.height;
    return { x: pPage.x * sx, y: pPage.y * sy };
}

