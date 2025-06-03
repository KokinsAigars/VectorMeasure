// Project Name: “VectorMeasure”
// Abbreviation: VM
// License: MIT
// Contributor(s): Aigars Kokins

/**
 * The purpose of this project is to test pdf.js functionality
 * https://github.com/mozilla/pdf.js
 * by integrating a PDF file in an HTML page and adding measure functionality
 * or even some overlay on an HTML Canvas to be saved as a PNG image file
 */

// app.js
console.log("VectorMeasure initialized");

pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdfjs/pdf.worker.mjs';
let canvas;          // for PDF
let measureCanvas;   // for drawing

const PDFlink = 'map.pdf'; // place your PDF inside public/ as map.pdf

const saveBtn = document.getElementById('save-btn');
saveBtn.addEventListener('click', fn_handleSaveImageClick);

const measureBtn = document.getElementById('measure-btn');
measureBtn.addEventListener('click', fn_handleMeasureBtnClick);

const calibrateBtn = document.getElementById('calibrate-btn');
calibrateBtn.addEventListener('click', fn_handleCalibrateClick);

const info = document.getElementById('info');

let measuring = false;
let startPoint = null;

let pxPerMeter = null; // or pxPerUnit if you want more generic


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
    });
}

// call renderPDF() function
renderPDF().then(r => {
    console.log('PDF canvas size:', canvas.width, canvas.height);
    console.log('OffsetTop/Left:', canvas.offsetTop, canvas.offsetLeft);
    console.log('PDF rendered; measureCanvas, canvas overlay created and appended');

}).catch(err =>
{
    console.error('❌ Error rendering PDF:', err);
});





// Add Save as PNG button functionality
function fn_handleSaveImageClick(event) {
    const canvas = document.getElementById('pdf-canvas');
    const imageData = canvas.toDataURL('image/png');

    //  link is <a> trick to initiate a file download in the browser
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'page.png';
    link.click();
}

// Add a "Measure" button
function fn_handleMeasureBtnClick(event) {
    measuring = true;
    measureCanvas.style.pointerEvents = 'auto';
    info.innerText = 'Click two points to measure.';
}

// Add Measure functionality
function fn_handleMeasureClick(event) {
    if (!measuring) return;

    const rect = measureCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const ctx = measureCanvas.getContext('2d');

    if (!startPoint) {
        startPoint = { x, y };
    } else {

        // Draw line
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        // draw line, same as before...
        const dx = x - startPoint.x;
        const dy = y - startPoint.y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);

        if (pxPerMeter) {
            const meters = pixelDistance * pxPerMeter;
            document.getElementById('info').innerText =
                `Distance: ${pixelDistance.toFixed(2)} px ≈ ${meters.toFixed(2)} m`;
        } else {
            document.getElementById('info').innerText =
                `Distance: ${pixelDistance.toFixed(2)} px (no calibration)`;
        }

        // reset
        startPoint = null;
        measuring = false;
        measureCanvas.style.pointerEvents = 'none';
    }
}

// Add Calibration logic
function fn_handleCalibrateClick(event) {

    const meters = parseFloat(document.getElementById('real-length').value);

    if (!startPoint || isNaN(meters)) {
        alert('❌ Measure a distance first, then enter its real-world value.');
        return;
    }

    const dx = lastMeasuredEnd.x - startPoint.x;
    const dy = lastMeasuredEnd.y - startPoint.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);

    pxPerMeter = meters / pixelDistance;
    document.getElementById('info').innerText = `✅ Calibrated: 1px ≈ ${pxPerMeter.toFixed(5)} meters`;

    // Reset
    startPoint = null;
    lastMeasuredEnd = null;

}
