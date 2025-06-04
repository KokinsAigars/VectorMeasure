/**
 * Project Name: “VectorMeasure”
 * Abbreviation: VM
 * License: MIT
 * Contributor(s): Aigars Kokins
 * app.js
 */

console.log("VectorMeasure initialized");

pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdfjs/pdf.worker.mjs';
const PDFlink = 'pdf/map.pdf'; /* ---- PDF FILE in public/ as map.pdf */

// Default calibration: 1px ≈ 0.02470 meters [1/0.02470 = 40.48]
let pxPerMeter = 40.48;
let basePxPerMeter = 40.48; // Store calibration relative to scale 1.0
let currentScale = 1.5;
let pdfDoc = null;
let pdfPage = null;
const container = document.getElementById('pdf-container');
let viewport = null;
let canvas;         // for PDF
let measureCanvas;  // for drawing
let previewCanvas;  // for preview of drawing lines in measureCanvas
let previewCtx = null; // 2D context for preview line
let copyCanvas = null;
let originalPdfImage = null;
let startPoint = null;
let measuringEnabled = true;
let lastMeasuredStart = null;
let lastMeasuredEnd = null;
let isDrawing = false;
let originalCanvasWidth;
let unscaledViewport = null;
let ctx = null;
let panOffset = null;

const saveBtn = document.getElementById('save-btn'); saveBtn.addEventListener('click', fn_SaveImageClick);
const measureBtn = document.getElementById('measure-btn'); measureBtn.addEventListener('click', fn_MeasureBtnClick);
const clearBtn = document.getElementById('clear-btn'); clearBtn.addEventListener('click', fn_ClearClick);
document.getElementById('reset-pdf-btn').addEventListener('click', fn_resetPdfCanvasView);
document.getElementById('flip-pdf-horizontal-btn').addEventListener('click', fn_flipPdfCanvasHorizontally);
document.getElementById('flip-pdf-vertical-btn').addEventListener('click', fn_flipPdfCanvasVertically);
document.addEventListener('DOMContentLoaded', fn_ContentLoaded);
const calibrateBtn = document.getElementById('calibrate-btn'); calibrateBtn.addEventListener('click', fn_CalibrateBtnClick);
const info = document.getElementById('info');

// keydown - Escape, calls function to stop measure tool
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        fn_CancelMeasurement();
    }
});

async function loadPDF() {
    if (!pdfDoc) {
        pdfDoc = await pdfjsLib.getDocument(PDFlink).promise;
        pdfPage = await pdfDoc.getPage(1);
    }
}
async function createPDFCanvas(){

    await loadPDF();

    unscaledViewport = pdfPage.getViewport({ scale: 1 });
    const desiredWidth = container.clientWidth;
    const scale = desiredWidth / unscaledViewport.width;
    viewport = pdfPage.getViewport({ scale: scale });

    currentScale = scale;
    originalCanvasWidth = desiredWidth;

    canvas = document.createElement('canvas');
    canvas.id = 'pdf-canvas';

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';

    ctx = canvas.getContext('2d');

    // Set container height based on scaled PDF
    container.style.height = `${viewport.height}px`;

    container.appendChild(canvas);

    await pdfPage.render({ canvasContext: ctx, viewport }).promise;

    // Create a copy for reset view
    originalPdfImage = new Image();
    originalPdfImage.src = canvas.toDataURL('image/png');
}
async function createMeasureCanvas(){
    measureCanvas = document.createElement('canvas');
    measureCanvas.id = 'measure-canvas';

    measureCanvas.width = viewport.width;
    measureCanvas.height = viewport.height;

    measureCanvas.style.position = 'absolute';
    measureCanvas.style.top = '0';
    measureCanvas.style.left = '0';
    measureCanvas.style.pointerEvents = 'none';

    measureCanvas.addEventListener('click', fn_MeasureClick);
    measureCanvas.addEventListener('mousemove', fn_MeasureMousemove);

    container.appendChild(measureCanvas);
}
async function createPreviewCanvas(){
    previewCanvas = document.createElement('canvas');
    previewCanvas.id = 'preview-canvas';

    previewCanvas.width = viewport.width;
    previewCanvas.height = viewport.height;

    previewCanvas.style.position = 'absolute';
    previewCanvas.style.top = '0';
    previewCanvas.style.left = '0';
    previewCanvas.style.pointerEvents = 'none';

    previewCtx = previewCanvas.getContext('2d');

    container.appendChild(previewCanvas);
}
async function initCanvasRenderPDF() {

    await new Promise(requestAnimationFrame);
    await createPDFCanvas();
    await createMeasureCanvas();
    await createPreviewCanvas();

    requestAnimationFrame(() => {
        console.log('Reset scale:', currentScale);
        console.log('Canvas size:', canvas.width, canvas.height);
        console.log('Transform:', canvas.style.transform);
    });
}

// call MAIN() function
await initCanvasRenderPDF().then(r => {
    // console.log('PDF canvas size:', canvas.width, canvas.height);
    // console.log('OffsetTop/Left:', canvas.offsetTop, canvas.offsetLeft);
    // console.log('PDF rendered; measureCanvas, canvas overlay created and appended');
}).catch(err => { console.error('Error rendering PDF:', err); });


// Add Save as PNG button functionality
function fn_SaveImageClick(event) {
    // all used canvas
    const pdfCanvas = document.getElementById('pdf-canvas');
    const measureCanvas = document.getElementById('measure-canvas');

    // Create an off-screen canvas, to merge the two
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.id = 'merged-canvas';
    mergedCanvas.width = pdfCanvas.width;
    mergedCanvas.height = pdfCanvas.height;

    const ctx = mergedCanvas.getContext('2d');

    // Draw PDF background
    ctx.drawImage(pdfCanvas, 0, 0);

    // Draw measurements over it
    ctx.drawImage(measureCanvas, 0, 0);


    // Export to PNG
    const imageData = mergedCanvas.toDataURL('image/png');

    //  link is <a> trick to initiate a file download in the browser
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'VectorMeasure.png';
    link.click();
}
// Add a "Measure" button
function fn_MeasureBtnClick(event) {
    fn_ClearClick();
    // measuring = !measuring;
    measureCanvas.style.pointerEvents = 'auto';
    info.innerText = 'Click two points to measure.';
    measuringEnabled = true;
}
//MeasureCanvas functionality
function fn_MeasureClick(event) {

    if (!measuringEnabled) return;

    const rect = measureCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ctx = measureCanvas.getContext('2d');

    if (!startPoint) {

        // Clear previous measurement immediately
        ctx.clearRect(0, 0, measureCanvas.width, measureCanvas.height);

        startPoint = { x, y };
        isDrawing = true;

    } else {
        // Draw new measurement
        ctx.strokeStyle = 'rgba(255, 0, 0)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Store for calibration
        lastMeasuredStart = startPoint;
        lastMeasuredEnd = { x, y };

        let dx = x - startPoint.x;  //Straight vertical lines (dx ≈ 0)
        let dy = y - startPoint.y;  // Straight horizontal lines (dy ≈ 0)

        const pixelDistance = Math.sqrt(dx * dx + dy * dy);

        let meters = pixelDistance / pxPerMeter;
        let displayDistance;

        const firstDecimalDigit = Math.floor((meters * 10) % 10);

        if (firstDecimalDigit === 0) {
            displayDistance = `${Math.round(meters)} m`;
        } else {
            displayDistance = `${meters.toFixed(2)} m`;
        }

        document.getElementById('info').innerText = `📏 Segment: ${displayDistance}`;

        // Clear preview canvas
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        // Reset state
        startPoint = null;
        isDrawing = false;

        // Hide Measure HTML Tip
        document.getElementById('measurement-tip').style.display = 'none';

    }
}
function fn_MeasureMousemove(event) {

    if (!isDrawing || !startPoint) return;

    const rect = previewCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Clear previous preview line
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    previewCtx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    previewCtx.lineWidth = 2;
    previewCtx.beginPath();
    previewCtx.moveTo(startPoint.x, startPoint.y);
    previewCtx.lineTo(x, y);
    previewCtx.stroke();

    // Calculate distance
    const dx = x - startPoint.x;
    const dy = y - startPoint.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    const meters = pxPerMeter ? pixelDistance / pxPerMeter : pixelDistance;

    // Round down to 0.1m
    const flooredMeters = Math.floor(meters * 10) / 10;
    const isWhole = flooredMeters % 1 === 0;
    const distanceText = isWhole
        ? `${flooredMeters.toFixed(0)} m`
        : `${flooredMeters.toFixed(1)} m`;

    // Show floating tip
    const tooltip = document.getElementById('measurement-tip');
    tooltip.innerText = distanceText;
    tooltip.style.left = `${event.clientX + 12}px`;
    tooltip.style.top = `${event.clientY + 12}px`;
    tooltip.style.display = 'block';
}

// Add a "Clear" measurement lines button
function fn_ClearClick(event) {
    ctx = measureCanvas.getContext('2d');
    ctx.clearRect(0, 0, measureCanvas.width, measureCanvas.height);

    previewCtx = previewCanvas.getContext('2d');
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    startPoint = null;
    isDrawing = false;
    lastMeasuredStart = null;
    lastMeasuredEnd = null;

    measuringEnabled = false;

    document.getElementById('info').innerText = 'Measurements cleared.';

    // Hide Measure HTML Tip
    document.getElementById('measurement-tip').style.display = 'none';
}
// Cancel Measurement
function fn_CancelMeasurement() {

    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    ctx.clearRect(0, 0, measureCanvas.width, measureCanvas.height);

    startPoint = null;
    isDrawing = false;
    lastMeasuredStart = null;
    lastMeasuredEnd = null;
    measuringEnabled = false;

    document.getElementById('info').innerText = 'Measuring mode stopped by ESC.';

    // Hide Measure HTML Tip
    document.getElementById('measurement-tip').style.display = 'none';
}
// Add Calibration logic
function fn_CalibrateBtnClick(event) {

    const realWorldMeters = parseFloat(document.getElementById('real-length').value);

    if (!lastMeasuredStart || !lastMeasuredEnd || isNaN(realWorldMeters) || realWorldMeters <= 0) {
        alert('❌ Measure a distance first, then enter a valid real-world value.');
        return;
    }

    // Get pixel distance of the measurement line (on scaled canvas)
    const dx = lastMeasuredEnd.x - lastMeasuredStart.x;
    const dy = lastMeasuredEnd.y - lastMeasuredStart.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);

    pxPerMeter = pixelDistance / realWorldMeters;

    document.getElementById('info').innerText =
        `✅ Calibrated: 1px = ${(1 / pxPerMeter).toFixed(5)} m`;

    // Reset measurement points
    lastMeasuredStart = null;
    lastMeasuredEnd = null;

    console.log(`ℹ️ pixelDistance = ${pixelDistance}, meters = ${realWorldMeters}`);
}

// Add a "Flip" pdf horizontally button
function fn_flipPdfCanvasHorizontally() {
    ctx = canvas.getContext('2d');

    // Create an off-screen copy of the original canvas
    copyCanvas = document.createElement('canvas');
    copyCanvas.width = canvas.width;
    copyCanvas.height = canvas.height;
    const copyCtx = copyCanvas.getContext('2d');
    copyCtx.drawImage(canvas, 0, 0);

    // Clear and flip original canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(copyCanvas, 0, 0);
    ctx.restore();

    fn_ClearClick();

}

// Add a "Flip" pdf horizontally button
function fn_flipPdfCanvasVertically() {
    ctx = canvas.getContext('2d');

    // Copy current canvas to an off-screen one
    copyCanvas = document.createElement('canvas');
    copyCanvas.width = canvas.width;
    copyCanvas.height = canvas.height;
    const copyCtx = copyCanvas.getContext('2d');
    copyCtx.drawImage(canvas, 0, 0);

    // Flip the original canvas vertically
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(1, -1); // Flip vertically
    ctx.translate(0, -canvas.height); // Move origin back into view
    ctx.drawImage(copyCanvas, 0, 0);
    ctx.restore();

    fn_ClearClick(); // Optional: clear overlays
}

// Add a "Reset" PDF View button
async function fn_resetPdfCanvasView() {

    currentScale = originalCanvasWidth / unscaledViewport.width;
    panOffset = { x: 0, y: 0 };
    pxPerMeter = basePxPerMeter;

    // Clear all transforms
    [canvas, measureCanvas, previewCanvas].forEach(c => {
        c.style.transform = 'none';
    });

    await fn_renderPDFWithTransform();

    requestAnimationFrame(() => {
        document.getElementById('info').innerText = '🔄 View reset to original state';
        console.log('Reset scale:', currentScale);
        console.log('Canvas size:', canvas.width, canvas.height);
        console.log('Transform:', canvas.style.transform);
    });

    ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset canvas 2D context

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw saved PDF image
    if (originalPdfImage.complete) {
        ctx.drawImage(originalPdfImage, 0, 0);
    } else {
        originalPdfImage.onload = () => {
            ctx.drawImage(originalPdfImage, 0, 0);
        };
    }

    [canvas, measureCanvas, previewCanvas].forEach(c => {
        c.style.transform = 'none';
        c.style.left = '0px';
        c.style.top = '0px';
    })
}

// Add DomContentLoaded
function fn_ContentLoaded(event) {
    const metersPerPx = 1 / pxPerMeter;
    document.getElementById('info').innerText =
        `📐 Default calibration: 1px ≈ ${metersPerPx.toFixed(5)} meters`;
}




async function fn_renderPDFWithTransform() {

    const viewport = pdfPage.getViewport({scale: currentScale});

    // Resize canvas
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    ctx.setTransform(1, 0, 0, 1, panOffset.x, panOffset.y); // reset transform
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    await pdfPage.render({canvasContext: ctx, viewport}).promise;

    // Update overlay canvases
    [measureCanvas, previewCanvas].forEach(c => {
        c.width = canvas.width;
        c.height = canvas.height;
        c.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${currentScale})`;
        c.style.transformOrigin = 'top left';
    })

    // Recalculate pxPerMeter
    currentScale = originalCanvasWidth / unscaledViewport.width;
    panOffset = { x: 0, y: 0 };
    pxPerMeter = basePxPerMeter;

    document.getElementById('info').innerText =
        `🔍 Zoom: ${currentScale.toFixed(2)}x | 1px = ${(1/pxPerMeter).toFixed(5)} m`;
}
