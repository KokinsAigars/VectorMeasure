/// <reference types="@vitest/browser/providers/playwright" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        name: 'browser',
        browser: {
            enabled: true,
            provider: 'playwright',
            testerHtmlPath: './docs/index.html', // use a test HTML that excludes pdfjs and app.js
            instances: [{ browser: 'chromium' }],
        },
        coverage: {
            provider: 'v8',
            exclude: [
                'docs/js/pdfjs/**',   // exclude whole pdfjs folder
            ],
        },
    },
    optimizeDeps: {
        exclude: ['./docs/js/pdfjs/pdf.mjs'],
    },
    ssr: {
        external: ['./docs/js/pdfjs/pdf.mjs'],
    },
})