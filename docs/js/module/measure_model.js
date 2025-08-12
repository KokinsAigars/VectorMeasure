/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * module/ measure_model.js
 */

// Store segments in page coords (scale=1), e.g. {x,y} in PDF pixels at s=1
const segments = []; // [{ a:{x,y}, b:{x,y} }, ...]

export function addSegment(aPage, bPage) {
    segments.push({ a: aPage, b: bPage });
}

export function getSegments() {
    return segments;
}

export function clearSegments() {
    segments.length = 0;
}



