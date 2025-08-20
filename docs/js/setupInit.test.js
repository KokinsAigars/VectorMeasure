/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * Integration testing
 * setupInit.test.js;
 */

import { it, expect, describe } from 'vitest';
import { setupInit } from "./setupInit.js";
import {
    pxPerMeter,
    basePxPerMeter,
    PdfPlanPath,
    PdfPlanReversePath,
    PdfPlanVerticalPath
} from './module/state.js';

describe('state.js argument testing', () => {

    it('test initial setup providing pdf path(s) and base calibration', () => {
        let result = false;

        setupInit();

        if (pxPerMeter !== null && basePxPerMeter !== null &&
            PdfPlanPath !== null && PdfPlanReversePath !== null &&
            PdfPlanVerticalPath !== null) result = true

        expect(result).toBe(true)
    })

});
