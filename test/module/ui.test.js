/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * --TEST--
 * module/ ui.test.js;
 */

import { it, expect, beforeAll } from 'vitest';
import * as testCond from '@cond';
import * as ui from "@jsModule/ui.js";

beforeAll(() => {
    console.log('beforeAll hook');
    console.log('!testCond.production: ', !testCond.production);
    console.log('!testCond.development: ', !testCond.development);
})

it.skipIf(!testCond.production)('ui.js element selection 1', () => {

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
});

it.skipIf(!testCond.production)('ui.js element selection 2', () => {

    const elements = [
        document.getElementById('zoom-in-btn'),
        document.getElementById('zoom-out-btn'),
        document.getElementById('pan-btn'),
        document.getElementById('reset-pdf-btn'),
        document.getElementById('flip-pdf-horizontal-btn'),
        document.getElementById('flip-pdf-vertical-btn'),
        document.getElementById('measure-btn'),
        document.getElementById('add-line-btn'),
        document.getElementById('delete-line-btn'),
        document.getElementById('add-comment-btn'),
        document.getElementById('save-btn'),
        document.querySelector('.input'),
        document.getElementById('calibrate-btn'),
        document.getElementById('info'),
        document.getElementById('comment-layer'),
        document.getElementById('pdf-container'),
        document.getElementById('measurement-tip'),
    ].map(Boolean);

    expect(elements.every(Boolean)).toBe(true);
});

it.skipIf(!testCond.development)('finds #pdf-container', () => {
    const el = document.getElementById('pdf-container');
    expect(el).not.toBeNull();
});

