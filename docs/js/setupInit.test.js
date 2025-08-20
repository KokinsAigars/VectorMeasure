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

    it('test initial setup providing pdf path(s) and base calibration', async () => {

        await setupInit();

        expect(pxPerMeter).not.toBeNull();
        expect(basePxPerMeter).not.toBeNull();
        expect(PdfPlanPath).not.toBeNull();
        expect(PdfPlanReversePath).not.toBeNull();
        expect(PdfPlanVerticalPath).not.toBeNull();
    })

});
