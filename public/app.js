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

const saveBtn = document.getElementById('save-btn'); saveBtn.addEventListener('click', fn_handleSaveImageClick);
const measureBtn = document.getElementById('measure-btn'); measureBtn.addEventListener('click', fn_handleMeasureBtnClick);
const clearBtn = document.getElementById('clear-btn'); clearBtn.addEventListener('click', fn_handleClearClick);
const calibrateBtn = document.getElementById('calibrate-btn'); calibrateBtn.addEventListener('click', fn_handleCalibrateClick);
const info = document.getElementById('info');

pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdfjs/pdf.worker.mjs';
const container = document.getElementById('pdf-container');
let canvas;          // for PDF
let measureCanvas;   // for drawing
let previewCanvas;  // for preview of drawing lines in measureCanvas
let measuring = false;
let startPoint = null;
let pxPerMeter = 10 / 424; // Example: 10 meters = 424 pixels
let lastMeasuredStart = null;
let lastMeasuredEnd = null;
let isDrawing = false;
let previewCtx = null; // 2D context for preview line

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('info').innerText = `📏 Default calibration: 1px ≈ ${pxPerMeter.toFixed(5)} meters`;
});


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

    await page.render({ canvasContext: context, viewport }).promise;

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
        measureCanvas.addEventListener('click', fn_handleMeasureClick);
        measureCanvas.addEventListener('mousemove', fn_handleMeasureMousemove);

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
    });
}

// call renderPDF() function
renderPDF().then(r => {
    console.log('PDF canvas size:', canvas.width, canvas.height);
    console.log('OffsetTop/Left:', canvas.offsetTop, canvas.offsetLeft);
    console.log('PDF rendered; measureCanvas, canvas overlay created and appended');
}).catch(err => { console.error('Error rendering PDF:', err); });


// Add Save as PNG button functionality
function fn_handleSaveImageClick(event) {
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
function fn_handleMeasureBtnClick(event) {
    measuring = true;
    measureCanvas.style.pointerEvents = 'auto';
    info.innerText = 'Click two points to measure.';
}


function fn_handleClearClick(event) {
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
function fn_handleMeasureClick(event) {

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
function fn_handleMeasureMousemove(event) {

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
function fn_handleCalibrateClick(event) {

    const meters = parseFloat(document.getElementById('real-length').value);
    if (!lastMeasuredStart || !lastMeasuredEnd || isNaN(meters)) {
        alert('❌ Measure a distance first, then enter its real-world value.');
        return;
    }

    const dx = lastMeasuredEnd.x - lastMeasuredStart.x;
    const dy = lastMeasuredEnd.y - lastMeasuredStart.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);

    pxPerMeter = meters / pixelDistance;

    document.getElementById('info').innerText =
        `✅ Calibrated: 1px = ${pxPerMeter.toFixed(5)} meters`;

    // Optional: clear last line to force new calibration each time
    lastMeasuredStart = null;
    lastMeasuredEnd = null;

}
