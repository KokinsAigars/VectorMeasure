/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * --TEST--
 * app.test.js;
 */

import { it, expect, vi, beforeEach } from 'vitest';
import { js_app } from '@cond';

// Mock loader to avoid real PDF/Canvas work and make it resolve to success
vi.mock('@jsModule/loader.js', () => {
  return {
    loadPdfByName: vi.fn(() => Promise.resolve(true)),
  };
});

// Optionally silence console in tests, but keep ability to assert on logs
const originalLog = console.log;
let logSpy;

beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(originalLog);
});

// Import after mocks so app.js uses the mocked loader
import * as loader from '@jsModule/loader.js';
import { PdfPlanPath, pxPerMeter } from '@jsModule/state.js';
import '@docsJs/app.js';


it.skipIf(!js_app)('calls loadPdfByName with state values and handles success', async () => {
    // Trigger the app initialization
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Allow microtasks and the promise chain to settle
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));

    // Verify that loadPdfByName was called with the current state values
    expect(loader.loadPdfByName).toHaveBeenCalledTimes(1);
    expect(loader.loadPdfByName).toHaveBeenCalledWith(PdfPlanPath, pxPerMeter);

    // Since our mock resolves to true, success path should log "Loaded!"
    const loggedLoaded = logSpy.mock.calls.some(
      (args) => typeof args[0] === 'string' && args[0].includes('Loaded!')
    );
    expect(loggedLoaded).toBe(true);
});
