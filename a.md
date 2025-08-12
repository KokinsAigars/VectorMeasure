

[//]: # (npx @tailwindcss/cli -i ./src/input.css -o ./docs/style.css --watch)


📁 /js/
File	Purpose
app.js	Main entry point. Initializes PDF, state, and event listeners.
canvas.js	Creates and manages PDF canvas and overlay canvases.
measure.js	Handles user click/move to measure distances.
calibration.js	Calibrates scale based on user input and last measurement.
actions.js	Handles UI actions: save image, clear, flip, reset view.
events.js	Binds all DOM/UI/canvas event listeners.
state.js	Stores and exposes global app state (scale, calibration, etc.).
ui.js (optional)	Centralized DOM elements (buttons, inputs, tooltips).
