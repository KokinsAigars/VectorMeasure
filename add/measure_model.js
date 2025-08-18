/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * module/ measure_model.js;
 */

// Store segments in page coords (scale=1), e.g. {x,y} in PDF pixels at s=1
const segments = []; // [{ a:{x,y}, b:{x,y} }, ...]

export function addSegment(aPage, bPage) {
    console.log('measure_model.js > addSegment(aPage, bPage) is called');

    segments.push({ a: aPage, b: bPage });
}

export function getSegments() {
    console.log('measure_model.js > getSegments() is called');

    return segments;
}

