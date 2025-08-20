/// <reference types="@vitest/browser/providers/playwright" />
import { defineConfig } from 'vitest/config'
import * as path from 'path'

export default defineConfig({
    test: {
        name: 'browser',
        browser: {
            enabled: true,
            provider: 'playwright',
            testerHtmlPath: './docs/index.html',
            instances: [{ browser: 'chromium' }],
        },
        coverage: {
            provider: 'v8',
            exclude: [
                'docs/js/pdfjs/**',
            ],
        },
        exclude: [
            'node_modules',
            'docs/js/pdfjs/**',
            'docs/pdf/**'
        ],
    },
    optimizeDeps: {
        exclude: ['./docs/js/pdfjs/pdf.mjs'],
    },
    ssr: {
        external: ['./docs/js/pdfjs/pdf.mjs'],
    },
    resolve: {
        alias: {
            '@cond': path.resolve(__dirname, 'test-conditions.js'),
        },
    },
})