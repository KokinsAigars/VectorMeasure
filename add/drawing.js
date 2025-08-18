/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ drawing.js;
 */

let isDown = false;
let lastPt = null;

export function linePointerDown(e) {
    isDown = true;
    // lastPt = worldFromClient(e); // or just {x:e.offsetX, y:e.offsetY}
}

export function linePointerMove(e) {
    if (!isDown) return;
    // const cur = worldFromClient(e);
    // draw a preview line from lastPt -> cur on preview or drawing layer
    // (e.g., stroke on a temp ctx, or keep it in memory and request a redraw)
}

export function linePointerUp(e) {
    if (!isDown) return;
    // const end = worldFromClient(e);
    isDown = false;
    // commit the line to drawing-canvas and/or model, then clear preview
}
