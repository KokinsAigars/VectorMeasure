

// app.js
console.log("VectorMeasure initialized");

pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdfjs/pdf.worker.min.js';
let canvas;          // for PDF
let measureCanvas;   // for drawing
const url = 'map.pdf'; // place your PDF inside public/ as map.pdf


const loadingTask = pdfjsLib.getDocument(url);
loadingTask.promise.then(pdf => {
    return pdf.getPage(1);
}).then(page => {
    const scale = 1.5;
    const viewport = page.getViewport({ scale });

    // Setup canvas for PDF render
    canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.position = 'relative';
    document.body.appendChild(canvas);

    // Render the PDF page
    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    return page.render(renderContext).promise;
}).then(() => {
    console.log('PDF rendered');
});



// Step 1: Add a "Measure" button
document.getElementById('save-btn').addEventListener('click', () => {
    const canvas = document.querySelector('canvas'); // assuming one canvas
    const imageData = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'page.png';
    link.click();
});

// ✅ Setup measuring canvas
measureCanvas = document.createElement('canvas');
measureCanvas.width = canvas.width;
measureCanvas.height = canvas.height;
measureCanvas.style.position = 'absolute';
measureCanvas.style.top = canvas.offsetTop + 'px';
measureCanvas.style.left = canvas.offsetLeft + 'px';
measureCanvas.style.pointerEvents = 'none';
document.body.appendChild(measureCanvas);


// Step 3: Activate measure mode on button click
const measureBtn = document.getElementById('measure-btn');
const info = document.getElementById('info');

let measuring = false;
let startPoint = null;

measureBtn.addEventListener('click', () => {
    measuring = true;
    measureCanvas.style.pointerEvents = 'auto';
    info.innerText = 'Click two points to measure.';
});

// Step 4: Capture clicks and draw a line

measureCanvas.addEventListener('click', (event) => {
    const rect = measureCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const ctx = measureCanvas.getContext('2d');

    if (!startPoint) {
        startPoint = { x, y };
    } else {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        const dx = x - startPoint.x;
        const dy = y - startPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        info.innerText = `Distance: ${dist.toFixed(2)} pixels`;

        startPoint = null;
        measuring = false;
        measureCanvas.style.pointerEvents = 'none';
    }
});

