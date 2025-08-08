/**
 * Project Name: “VectorMeasure”
 * Abbreviation: VM
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * 2025.06.03 - init()
 *
 * The purpose of this project is to test pdf.js functionality
 * https://github.com/mozilla/pdf.js
 *
 */

/**
 * Add Canvas and render PDF
 *
 * Add canvas overlay [measureCanvas] (transparent layer for drawing lines)
 *
 * Click two points to draw a line
 *
 * Measure pixel distance
 *
 * Add a simple calibration tool to convert to real-world unit
 */

    
    https://nodejs.org/en/download
    npm install npm@latest
    npm install -g npm-check-updates
    npm audit fix --force

    npm install

    npm run dev
    http://localhost:3000/


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

