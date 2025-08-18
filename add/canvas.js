

import { getSegments } from './measure_model.js';
import { pageToOverlayXY } from './coord.js';

export function redrawMeasurements() {
    console.log('canvas.js > redrawMeasurements() is called');

    if (!measureCanvas) return;
    const ctx = measureCanvas.getContext('2d');
    ctx.clearRect(0, 0, measureCanvas.width, measureCanvas.height);

    const segments = getSegments();
    ctx.strokeStyle = 'rgba(255,0,0,1)';
    ctx.lineWidth = 4;

    segments.forEach(({a,b}) => {
        const A = pageToOverlayXY(a);
        const B = pageToOverlayXY(b);
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
    });
}


