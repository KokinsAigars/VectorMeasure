/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * --TEST--
 * module/ measure.test.js;
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { js_module_ui } from '@cond';

// Mock canvas.js to supply canvases the module uses
vi.mock('@jsModule/canvas.js', () => {
  const mc = document.createElement('canvas');
  const pc = document.createElement('canvas');
  // Spy on add/remove to ensure removal uses same refs
  mc.addEventListener = vi.fn(mc.addEventListener.bind(mc));
  mc.removeEventListener = vi.fn(mc.removeEventListener.bind(mc));
  pc.addEventListener = vi.fn(pc.addEventListener.bind(pc));
  pc.removeEventListener = vi.fn(pc.removeEventListener.bind(pc));
  return { measureCanvas: mc, previewCanvas: pc };
});

// Mock ui.js elements used by measure.js
vi.mock('@jsModule/ui.js', () => {
  const info = document.createElement('div');
  info.id = 'info';
  const tip = document.createElement('div');
  tip.id = 'measurement-tip';
  document.body.appendChild(info);
  document.body.appendChild(tip);
  return { DivInfo: info, DivMeasurementTip: tip };
});

// state defaults
vi.mock('@jsModule/state.js', () => ({ pxPerMeter: 10, currentScale: 1 }));

// Import after mocks
import { setMeasureActive, cancelCurrentMeasure } from '@jsModule/measure.js';

describe.skipIf(!js_module_ui)('measure.js event binding', () => {
  beforeEach(() => {
    cancelCurrentMeasure();
  });

  it('adds listeners on activate and removes them on deactivate', () => {
    const { measureCanvas } = require('@jsModule/canvas.js');

    setMeasureActive(true);

    // expect added
    const addCalls = measureCanvas.addEventListener.mock.calls;
    expect(addCalls.some(c => c[0] === 'click')).toBe(true);
    expect(addCalls.some(c => c[0] === 'mousemove')).toBe(true);
    expect(addCalls.some(c => c[0] === 'mouseleave')).toBe(true);

    setMeasureActive(false);

    const removeCalls = measureCanvas.removeEventListener.mock.calls;
    expect(removeCalls.some(c => c[0] === 'click')).toBe(true);
    expect(removeCalls.some(c => c[0] === 'mousemove')).toBe(true);
    expect(removeCalls.some(c => c[0] === 'mouseleave')).toBe(true);
  });
});
