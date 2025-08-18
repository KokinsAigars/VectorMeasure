

export function recomputePxPerMeter() {
    console.log('state.js > recomputePxPerMeter() is called');

    pxPerMeter = basePxPerMeter * currentScale;
}


let _measureOn = false;
export const isMeasureOn = () => _measureOn;

export const setMeasureOn = (v) => {
    console.log('state.js > setMeasureOn(v) is called');

    _measureOn = v;
    // broadcast to anyone who cares
    window.dispatchEvent(new CustomEvent('measure:change', { detail: { on: v } }));
};



let _addLineOn = false;
export const isAddLineOn = () => _addLineOn;
export const setAddLineOn = (v) => {
    console.log('state.js > setAddLineOn(v) is called');

    _addLineOn = v;
    // broadcast to anyone who cares
    window.dispatchEvent(new CustomEvent('addLine: change', { detail: { on: v } }));
};

