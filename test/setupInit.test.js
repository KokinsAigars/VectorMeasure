/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * --TEST--
 * setupInit.test.js;
 */

import { it, expect, describe } from 'vitest';
import { js_setupInit } from '@cond';
import { setupInit } from "@docsJs/setupInit.js";
import {
    pxPerMeter,
    basePxPerMeter,
    PdfPlanPath,
    PdfPlanReversePath,
    PdfPlanVerticalPath
} from '@jsModule/state.js';

describe('state.js argument testing', () => {

    it.skipIf(!js_setupInit)('test initial setup providing pdf path(s) and base calibration', () => {

        setupInit();

        expect(pxPerMeter).not.toBeNull();
        expect(basePxPerMeter).not.toBeNull();
        expect(PdfPlanPath).not.toBeNull();
        expect(PdfPlanReversePath).not.toBeNull();
        expect(PdfPlanVerticalPath).not.toBeNull();
    })

});
