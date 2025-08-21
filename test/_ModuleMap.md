### 🧩 Module Map

- `app.js` – Main initializer on 'DOMContentLoaded' - initial parameters, calls to load pdf in canvas
- `setupInit.js` – Initial Calibration values and plan paths
- `debug.js` – Global parameters for debugging levels, console.log() control

- `loader.js` – Loads pdf(s) in canvas., separate function as it needs to be called on reset, flip canvas
- `pdf-runtime.js` – Ensures that there is a pdfjs library, skips for vitest testing theoretically 
- `canvas.js` – Renders PDF and creates overlays., holds also renderAtCurrentTransform() function that is called on zom etc.

- `state.js` – Central source of shared variables
- `ui.js` – Selects UI elements and creates a variables 
- `events.js` – Wires up EventListeners for buttons && DOM document
- `actions.js` – Toolbar (html buttons) functionality (functions)

- `measure.js` – Measurement functions
- `draw.js` – Line drawing and Line delete function
- `comments.js` – Adding comments function
- `calibration.js` – Applies real-world scaling


pdfjs/pdf.mjs 
- https://mozilla.github.io/pdf.js/
- https://github.com/mozilla/pdf.js
