/**
 * Project Name: “VectorMeasure”
 * Abbreviation: VM
 * License: MIT
 * Contributor(s): Aigars Kokins
 * 2025.06.03 - init()
 *
 * The purpose of this project is to test pdf.js functionality
 * https://github.com/mozilla/pdf.js
 *
 */

/**
 * 1. Add Canvas and render PDF
 *
 * 1. Add canvas overlay [measureCanvas] (transparent layer for drawing lines)
 *
 * 2. Click two points to draw a line
 *
 * 3. Measure pixel distance
 *
 * 4. Add a simple calibration tool to convert to real-world unit
 */

// app.js
console.log("VectorMeasure initialized");

const PDFlink = 'map.pdf'; /* ---- PDF FILE in public/ as map.pdf */

const saveBtn = document.getElementById('save-btn'); saveBtn.addEventListener('click', fn_SaveImageClick);
const measureBtn = document.getElementById('measure-btn'); measureBtn.addEventListener('click', fn_MeasureBtnClick);
const clearBtn = document.getElementById('clear-btn'); clearBtn.addEventListener('click', fn_ClearClick);
document.getElementById('reset-pdf-btn').addEventListener('click', fn_resetPdfCanvasView);
document.getElementById('flip-pdf-horizontal-btn').addEventListener('click', fn_flipPdfCanvasHorizontally);
document.getElementById('flip-pdf-vertical-btn').addEventListener('click', fn_flipPdfCanvasVertically);
document.addEventListener('DOMContentLoaded', fn_ContentLoaded);
const calibrateBtn = document.getElementById('calibrate-btn'); calibrateBtn.addEventListener('click', fn_CalibrateClick);
const info = document.getElementById('info');
const zoomInBtn = document.getElementById('zoom-in-btn'); zoomInBtn.addEventListener('click', fn_ZoomInBtnClick);
const zoomOutBtn = document.getElementById('zoom-out-btn'); zoomOutBtn.addEventListener('click', fn_ZoomOutBtnClick);

pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdfjs/pdf.worker.mjs';
const container = document.getElementById('pdf-container');
let canvas;          // for PDF
let originalPdfImage = null;
let measureCanvas;   // for drawing
let previewCanvas;  // for preview of drawing lines in measureCanvas
let measuring = false;
let startPoint = null;
let pxPerMeter = 10 / 424; // Example: 10 meters = 424 pixels
let lastMeasuredStart = null;
let lastMeasuredEnd = null;
let isDrawing = false;
let previewCtx = null; // 2D context for preview line
let isFlipped = true;
let isFlippedVertically = false;
let currentScale = 1.5; // Default
let basePxPerMeter = null; // Store calibration relative to scale 1.0


async function renderPDF() {

    const pdf = await pdfjsLib.getDocument(PDFlink).promise;
    const page = await pdf.getPage(1);
    const scale = 1.5;
    const viewport = page.getViewport({ scale: scale });

    canvas = document.createElement('canvas');
    canvas.id = 'pdf-canvas';
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    document.body.appendChild(canvas);

    await page.render({ canvasContext: context, viewport }).promise.then(() => {
        // ✅ Save a snapshot of the original PDF canvas
        originalPdfImage = new Image();
        originalPdfImage.src = canvas.toDataURL('image/png');
    });

    // Still recommend requestAnimationFrame even with async
    requestAnimationFrame(() => {
        measureCanvas = document.createElement('canvas');
        measureCanvas.id = 'measure-canvas';
        measureCanvas.width = canvas.width;
        measureCanvas.height = canvas.height;
        measureCanvas.style.position = 'absolute';
        measureCanvas.style.top = canvas.offsetTop + 'px';
        measureCanvas.style.left = canvas.offsetLeft + 'px';
        measureCanvas.style.pointerEvents = 'none';
        document.body.appendChild(measureCanvas);
        measureCanvas.addEventListener('click', fn_MeasureClick);
        measureCanvas.addEventListener('mousemove', fn_MeasureMousemove);

        previewCanvas = document.createElement('canvas');
        previewCanvas.id = 'preview-canvas';
        previewCanvas.width = canvas.width;
        previewCanvas.height = canvas.height;
        previewCanvas.style.position = 'absolute';
        previewCanvas.style.top = canvas.offsetTop + 'px';
        previewCanvas.style.left = canvas.offsetLeft + 'px';
        previewCanvas.style.pointerEvents = 'none';
        document.body.appendChild(previewCanvas);

        previewCtx = previewCanvas.getContext('2d');


        container.appendChild(canvas);
        container.appendChild(measureCanvas);
        container.appendChild(previewCanvas);

        fn_updateScaleIndicator();
    });
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
    measuring = true;
    measureCanvas.style.pointerEvents = 'auto';
    info.innerText = 'Click two points to measure.';
}

// Add a "Clear" measurement lines button
function fn_ClearClick(event) {
    const ctx = measureCanvas.getContext('2d');
    ctx.clearRect(0, 0, measureCanvas.width, measureCanvas.height);

    const previewCtx = previewCanvas.getContext('2d');
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    startPoint = null;
    isDrawing = false;
    lastMeasuredStart = null;
    lastMeasuredEnd = null;
    document.getElementById('info').innerText = 'Measurements cleared.';
}

// Add Measure functionality OnClick
function fn_MeasureClick(event) {

    // measuring = true;
    // previewCanvas.style.pointerEvents = 'auto';
    // measureCanvas.style.pointerEvents = 'auto';

    const rect = measureCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const ctx = measureCanvas.getContext('2d');

    if (!startPoint) {
        startPoint = { x, y };
        isDrawing = true;

    } else {

        const ctx = measureCanvas.getContext('2d');
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Save for calibration if needed
        lastMeasuredStart = startPoint;
        lastMeasuredEnd = { x, y };

        const dx = x - startPoint.x;
        const dy = y - startPoint.y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);
        const distance = pxPerMeter ? `${(pixelDistance * pxPerMeter).toFixed(2)} m` : `${pixelDistance.toFixed(2)} px`;

        document.getElementById('info').innerText = `Segment: ${distance}`;

        // Clear preview layer only
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        // ✅ Reset just the startPoint, keep measuring!
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

// Add Calibration logic
function fn_CalibrateClick(event) {

    // const meters = parseFloat(document.getElementById('real-length').value);
    if (!lastMeasuredStart || !lastMeasuredEnd || isNaN(meters)) {
        alert('❌ Measure a distance first, then enter its real-world value.');
        return;
    }

    const dx = lastMeasuredEnd.x - lastMeasuredStart.x;
    const dy = lastMeasuredEnd.y - lastMeasuredStart.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);

    const adjustedPxPerMeter = basePxPerMeter * currentScale;
    const meters = pixelDistance * adjustedPxPerMeter;

    pxPerMeter = meters / pixelDistance;

    document.getElementById('info').innerText = `✅ Calibrated: 1px = ${pxPerMeter.toFixed(5)} meters`;

    lastMeasuredStart = null;
    lastMeasuredEnd = null;

    fn_updateScaleIndicator()
}

// Add a "Flip" pdf horizontally button
function fn_flipPdfCanvasHorizontally() {
    const ctx = canvas.getContext('2d');

    // Create an off-screen copy of the original canvas
    const copyCanvas = document.createElement('canvas');
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
    const ctx = canvas.getContext('2d');

    // Copy current canvas to an off-screen one
    const copyCanvas = document.createElement('canvas');
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

    const ctx = canvas.getContext('2d');
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
    document.getElementById('info').innerText = `📏 Default calibration: 1px ≈ ${pxPerMeter.toFixed(5)} meters`;
}


// Add ZoomIn button Click event
function fn_ZoomOutBtnClick(event) {
    renderPdfAtScale(currentScale / 1.25).then(r => fn_updateScaleIndicator());
}

// Add ZoomOut buttons Click event
function fn_ZoomInBtnClick(event) {
    renderPdfAtScale(currentScale * 1.25).then(r => fn_updateScaleIndicator());
}

// Add info about the current scale
function fn_updateScaleIndicator() {
    const adjusted = basePxPerMeter ? (basePxPerMeter * currentScale).toFixed(5) : '—';
    document.getElementById('scale-indicator').innerText =
        `Scale: ${currentScale.toFixed(2)}x\n1px ≈ ${adjusted} m`;
}

// call renderPDF() function
renderPDF().then(r => {
    console.log('PDF canvas size:', canvas.width, canvas.height);
    console.log('OffsetTop/Left:', canvas.offsetTop, canvas.offsetLeft);
    console.log('PDF rendered; measureCanvas, canvas overlay created and appended');
}).catch(err => { console.error('Error rendering PDF:', err); });
