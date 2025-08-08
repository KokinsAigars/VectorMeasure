/**
 * Project Name: “VectorMeasure”
 * License: MIT
 * Contributor(s): Aigars Kokins, ChatGPT-5
 * app.js
 */

import { selector } from './ui.js';
import { loadPdfByName } from './loader.js';

// call MAIN() function
document.addEventListener('DOMContentLoaded', () => {

    const defaultPlan = selector.value;
    console.log('defaultPlan: ', defaultPlan)
    loadPdfByName(defaultPlan).then(success => {
        if (success) console.log('Loaded!');
    });

});