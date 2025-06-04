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
let pxPerMeter = 42.4; // 42.4 pixels per meter
const container = document.getElementById('pdf-container');
let viewport = null;
let canvas;         // for PDF
let measureCanvas;  // for drawing
let previewCanvas;  // for preview of drawing lines in measureCanvas
let previewCtx = null; // 2D context for preview line
let copyCanvas = null;
let originalPdfImage = null;
let measuring = false;
let startPoint = null;
let measuringEnabled = true;
let lastMeasuredStart = null;
let lastMeasuredEnd = null;
let isDrawing = false;
let currentScale = 1.5; // Default
let basePxPerMeter = null; // Store calibration relative to scale 1.0
let ctx = null;

const saveBtn = document.getElementById('save-btn'); saveBtn.addEventListener('click', fn_SaveImageClick);
const measureBtn = document.getElementById('measure-btn'); measureBtn.addEventListener('click', fn_MeasureBtnClick);
const clearBtn = document.getElementById('clear-btn'); clearBtn.addEventListener('click', fn_ClearClick);
document.getElementById('reset-pdf-btn').addEventListener('click', fn_resetPdfCanvasView);
document.getElementById('flip-pdf-horizontal-btn').addEventListener('click', fn_flipPdfCanvasHorizontally);
document.getElementById('flip-pdf-vertical-btn').addEventListener('click', fn_flipPdfCanvasVertically);
document.addEventListener('DOMContentLoaded', fn_ContentLoaded);
const calibrateBtn = document.getElementById('calibrate-btn'); calibrateBtn.addEventListener('click', fn_CalibrateClick);
const info = document.getElementById('info');
// const zoomInBtn = document.getElementById('zoom-in-btn'); zoomInBtn.addEventListener('click', fn_ZoomInBtnClick);
// const zoomOutBtn = document.getElementById('zoom-out-btn'); zoomOutBtn.addEventListener('click', fn_ZoomOutBtnClick);
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        fn_CancelMeasurement();
    }
});

async function createPDFCanvas(){

    const desiredWidth = container.clientWidth;

    const pdf = await pdfjsLib.getDocument(PDFlink).promise;
    const page = await pdf.getPage(1);

    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = desiredWidth / unscaledViewport.width;
    viewport = page.getViewport({ scale: scale });

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

    await page.render({ canvasContext: ctx, viewport }).promise;

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
    await createPDFCanvas();
    await createMeasureCanvas();
    await createPreviewCanvas();
}

// call MAIN() function
await initCanvasRenderPDF().then(r => {
    console.log('PDF canvas size:', canvas.width, canvas.height);
    console.log('OffsetTop/Left:', canvas.offsetTop, canvas.offsetLeft);
    console.log('PDF rendered; measureCanvas, canvas overlay created and appended');
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
// Add Measure functionality OnClick
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
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Store for calibration
        lastMeasuredStart = startPoint;
        lastMeasuredEnd = { x, y };

        const dx = x - startPoint.x;
        const dy = y - startPoint.y;
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

    }
}
// Add Measure functionality OnMouseMove
function fn_MeasureMousemove(event) {

    if (!isDrawing || !startPoint) return;

    const rect = previewCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Clear only the preview layer
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    previewCtx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    previewCtx.lineWidth = 1.5;
    previewCtx.beginPath();
    previewCtx.moveTo(startPoint.x, startPoint.y);
    previewCtx.lineTo(x, y);
    previewCtx.stroke();
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
}
// Cancel Measurement
function fn_CancelMeasurement() {

    // Only cancels Measurement
    // previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    // startPoint = null;
    // isDrawing = false;
    // document.getElementById('info').innerText = 'Measurement canceled.';

    // Full stops future measurement
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    ctx.clearRect(0, 0, measureCanvas.width, measureCanvas.height);

    startPoint = null;
    isDrawing = false;
    lastMeasuredStart = null;
    lastMeasuredEnd = null;
    measuringEnabled = false;

    document.getElementById('info').innerText = 'Measuring mode stopped by ESC.';
}
// Add Calibration logic
function fn_CalibrateClick(event) {

    const realWorldMeters = parseFloat(document.getElementById('real-length').value);

    if (!lastMeasuredStart || !lastMeasuredEnd || isNaN(realWorldMeters) || realWorldMeters <= 0) {
        alert('❌ Measure a distance first, then enter a valid real-world value.');
        return;
    }

    // Get pixel distance of the measurement line (on scaled canvas)
    const dx = lastMeasuredEnd.x - lastMeasuredStart.x;
    const dy = lastMeasuredEnd.y - lastMeasuredStart.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);

    // Calculate pixels per meter: how many pixels represent 1 meter
    pxPerMeter = pixelDistance / realWorldMeters;

    // Just for display
    const metersPerPixel = 1 / pxPerMeter;

    document.getElementById('info').innerText =
        `✅ Calibrated: 1px = ${metersPerPixel.toFixed(5)} meters`;

    // Reset measurement points
    lastMeasuredStart = null;
    lastMeasuredEnd = null;

    console.log(`ℹ️ pixelDistance = ${pixelDistance}, meters = ${realWorldMeters}`);
    console.log(`ℹ️ pxPerMeter = ${pxPerMeter}, metersPerPixel = ${metersPerPixel}`);
}







async function renderPdfAtScale(scale) {
    currentScale = scale;

    const pdf = await pdfjsLib.getDocument('map.pdf').promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: scale });

    // Resize canvas
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Resize overlay canvases
    measureCanvas.width = canvas.width;
    measureCanvas.height = canvas.height;
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;

    // Reset view (optionally clear drawings if not storing them)
    fn_ClearClick();
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
function fn_resetPdfCanvasView() {

    if (!originalPdfImage) {
        alert("Original PDF view not available.");
        return;
    }

    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the original saved image
    originalPdfImage.onload = () => {
        ctx.drawImage(originalPdfImage, 0, 0);
    };

    // If already loaded, draw immediately
    if (originalPdfImage.complete) {
        ctx.drawImage(originalPdfImage, 0, 0);
    }

    // Also clear measurements
    fn_ClearClick();
}

// Add DomContentLoaded
function fn_ContentLoaded(event) {
    const metersPerPx = 1 / pxPerMeter;
    document.getElementById('info').innerText =
        `📐 Default calibration: 1px ≈ ${metersPerPx.toFixed(5)} meters`;
}

// Add ZoomIn button Click event
function fn_ZoomOutBtnClick(event) {
    renderPdfAtScale(currentScale / 1.25).then(r => {
        // fn_updateScaleIndicator()
        null;
    });
}

// Add ZoomOut buttons Click event
function fn_ZoomInBtnClick(event) {
    renderPdfAtScale(currentScale * 1.25).then(r => {
        // fn_updateScaleIndicator()
        null;
    })
}

// Add info about the current scale
function fn_updateScaleIndicator() {
    const adjusted = basePxPerMeter ? (basePxPerMeter * currentScale).toFixed(5) : '—';
    document.getElementById('scale-indicator').innerText = `Scale: ${currentScale.toFixed(2)}x\n1px ≈ ${adjusted} m`;
}


