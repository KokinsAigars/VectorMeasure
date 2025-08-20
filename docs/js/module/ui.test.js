/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * A unit test
 * module/ ui.test.js;
 */

import { it, expect } from 'vitest';
import * as ui from "./ui.js";

it('ui.js element selection', () => {

    const elements = [
        ui.BtnZoomIn,
        ui.BtnZoomOut,
        ui.BtnPanToggle,
        ui.BtnResetPdf,
        ui.BtnFlipPdfHorizontal,
        ui.BtnFlipPdfVertical,
        ui.BtnMeasure,
        ui.BtnAddLine,
        ui.BtnDeleteLine,
        ui.BtnComment,
        ui.BtnSave,
        ui.InputRecalibrate,
        ui.BtnCalibrate,
        ui.DivInfo,
        ui.CommentLayer,
        ui.DivPdfContainer,
        ui.DivMeasurementTip,
    ].map(Boolean);

    console.log('ui.DivPdfContainer: ', ui.DivPdfContainer);
    console.log('ui.BtnMeasure: ', ui.BtnMeasure);

    // expect(elements.every(v => v === true)).toBe(true);
    // expect(elements).not.toContain(false);
    expect(elements.every(Boolean)).toBe(true);
})

















