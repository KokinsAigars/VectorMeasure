/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * --TEST--
 * module/ events.test.js;
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create DOM helpers for our mocked modules
function makeButton(id) {
  const btn = document.createElement('button');
  btn.id = id;
  return btn;
}
function makeDiv(id) {
  const div = document.createElement('div');
  div.id = id;
  return div;
}
function makeCanvas(id) {
  const c = document.createElement('canvas');
  c.id = id;
  return c;
}

// Mock ui.js to provide all referenced elements
vi.mock('./ui.js', () => {
  return {
    BtnZoomIn: makeButton('zoom-in-btn'),
    BtnZoomOut: makeButton('zoom-out-btn'),
    BtnPanToggle: makeButton('pan-btn'),
    BtnResetPdf: makeButton('reset-pdf-btn'),
    BtnFlipPdfHorizontal: makeButton('flip-pdf-horizontal-btn'),
    BtnFlipPdfVertical: makeButton('flip-pdf-vertical-btn'),
    BtnSave: makeButton('save-btn'),
    BtnMeasure: makeButton('measure-btn'),
    BtnAddLine: makeButton('add-line-btn'),
    BtnDeleteLine: makeButton('delete-line-btn'),
    BtnComment: makeButton('add-comment-btn'),
    BtnCalibrate: makeButton('calibrate-btn'),
    InputRecalibrate: document.createElement('input'),
    DivInfo: makeDiv('info'),
    CommentLayer: makeDiv('comment-layer'),
    DivPdfContainer: makeDiv('pdf-container'),
    DivMeasurementTip: makeDiv('measurement-tip'),
  };
});

// Mock canvas.js to provide canvases
vi.mock('./canvas.js', () => {
  return {
    pdfCanvas: makeCanvas('pdf-canvas'),
    drawingCanvas: makeCanvas('drawing-canvas'),
  };
});

// Mock actions.js and required properties
vi.mock('./actions.js', () => {
  return {
    handleZoomIn: vi.fn(),
    handleZoomOut: vi.fn(),
    handlePanBtn: vi.fn(),
    handleResetView: vi.fn(),
    flipPdfHorizontal: vi.fn(),
    flipPdfVertical: vi.fn(),
    handleSaveClick: vi.fn(),
    handleMeasureBtn: vi.fn(),
    handleAddLineBtn: vi.fn(),
    handleDeleteLineBtn: vi.fn(),
    handleAddCommentBtn: vi.fn(),
    startPan: vi.fn(),
    endPan: vi.fn(),
    movePan: vi.fn(),
    panMode: false,
    isPanning: false,
    TOOL: { DRAW: 'DRAW', DELETE: 'DELETE' },
    activeTool: 'DRAW',
  };
});

// Mock calibration.js
vi.mock('./calibration.js', () => ({
  handleCalibrateClick: vi.fn(),
}));

// Mock draw.js
vi.mock('./draw.js', () => ({
  onDrawMouseDown: vi.fn(),
  onDrawMouseMove: vi.fn(),
  onDrawMouseUp: vi.fn(),
  onDeleteHover: vi.fn(),
  onDeleteClick: vi.fn(),
  clearDeleteHover: vi.fn(),
}));

// Import after mocks so that events.js uses them
import * as ui from './ui.js';
import { pdfCanvas, drawingCanvas } from './canvas.js';
import * as actions from './actions.js';
import { setupEventListeners } from './events.js';

let docSpy;
let pdfCanvasSpy;
let drawingCanvasSpy;
const elementSpies = [];

beforeEach(() => {
  // Reset spies for each run
  elementSpies.splice(0, elementSpies.length);
  if (docSpy) docSpy.mockRestore();
  if (pdfCanvasSpy) pdfCanvasSpy.mockRestore();
  if (drawingCanvasSpy) drawingCanvasSpy.mockRestore();

  // Spy on document.addEventListener
  docSpy = vi.spyOn(document, 'addEventListener');

  // Spy on canvases
  pdfCanvasSpy = vi.spyOn(pdfCanvas, 'addEventListener');
  drawingCanvasSpy = vi.spyOn(drawingCanvas, 'addEventListener');

  // Spy on UI button listeners
  const elements = [
    ui.BtnZoomIn, ui.BtnZoomOut, ui.BtnPanToggle, ui.BtnResetPdf,
    ui.BtnFlipPdfHorizontal, ui.BtnFlipPdfVertical, ui.BtnSave,
    ui.BtnMeasure, ui.BtnAddLine, ui.BtnDeleteLine, ui.BtnComment, ui.BtnCalibrate,
  ];
  elements.forEach((el) => {
    elementSpies.push(vi.spyOn(el, 'addEventListener'));
  });
});

describe('events.js -> setupEventListeners', () => {
  it('exports setupEventListeners function', () => {
    expect(typeof setupEventListeners).toBe('function');
  });

  it('adds click listeners for all UI buttons', () => {
    setupEventListeners();

    const pairs = [
      [ui.BtnZoomIn, 'click'],
      [ui.BtnZoomOut, 'click'],
      [ui.BtnPanToggle, 'click'],
      [ui.BtnResetPdf, 'click'],
      [ui.BtnFlipPdfHorizontal, 'click'],
      [ui.BtnFlipPdfVertical, 'click'],
      [ui.BtnSave, 'click'],
      [ui.BtnMeasure, 'click'],
      [ui.BtnAddLine, 'click'],
      [ui.BtnDeleteLine, 'click'],
      [ui.BtnComment, 'click'],
      [ui.BtnCalibrate, 'click'],
    ];

    for (const [el, type] of pairs) {
      // Ensure addEventListener has been called with proper event type
      const calls = el.addEventListener.mock.calls;
      const found = calls.some(([evt, handler]) => evt === type && typeof handler === 'function');
      expect(found).toBe(true);
    }
  });

  it('adds document-level listeners for pan/draw interactions', () => {
    setupEventListeners();

    const events = ['keydown', 'keyup', 'mousemove', 'mouseup'];
    const calls = docSpy.mock.calls;

    for (const evt of events) {
      const found = calls.some(([type, handler]) => type === evt && typeof handler === 'function');
      expect(found).toBe(true);
    }
  });

  it('adds listeners to canvases (pdfCanvas and drawingCanvas)', () => {
    setupEventListeners();

    // pdfCanvas should have mousedown listener
    const pdfCalls = pdfCanvasSpy.mock.calls;
    const hasPdfMousedown = pdfCalls.some(([type, handler]) => type === 'mousedown' && typeof handler === 'function');
    expect(hasPdfMousedown).toBe(true);

    // drawingCanvas should have mousedown, mousemove, mouseleave, click listeners
    const drawCalls = drawingCanvasSpy.mock.calls;
    const expected = ['mousedown', 'mousemove', 'mouseleave', 'click'];
    for (const evt of expected) {
      const found = drawCalls.some(([type, handler]) => type === evt && typeof handler === 'function');
      expect(found).toBe(true);
    }
  });

  it('provides required action and draw function stubs (existence check)', () => {
    expect(typeof actions.handleZoomIn).toBe('function');
    expect(typeof actions.handleZoomOut).toBe('function');
    expect(typeof actions.handlePanBtn).toBe('function');
    expect(typeof actions.handleResetView).toBe('function');
    expect(typeof actions.flipPdfHorizontal).toBe('function');
    expect(typeof actions.flipPdfVertical).toBe('function');
    expect(typeof actions.handleSaveClick).toBe('function');
    expect(typeof actions.handleMeasureBtn).toBe('function');
    expect(typeof actions.handleAddLineBtn).toBe('function');
    expect(typeof actions.handleDeleteLineBtn).toBe('function');
    expect(typeof actions.handleAddCommentBtn).toBe('function');
    expect(typeof actions.startPan).toBe('function');
    expect(typeof actions.endPan).toBe('function');
    expect(typeof actions.movePan).toBe('function');
    expect(actions.TOOL).toBeTruthy();
  });
});
