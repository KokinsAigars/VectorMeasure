import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
    server: {
        host: '127.0.0.1',
        port: 63315,
        strictPort: true,
    },
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
                'docs/js/libs/**',
            ],
        },
        exclude: [
            'node_modules',
            'docs/js/libs/**',
            'docs/pdf/**'
        ],
    },
    optimizeDeps: {
        exclude: [
            'docs/js/libs/pdfjs/pdf.mjs',
            'docs/js/libs/dexie/dexie.mjs'
        ],  // exclude from dependency pre-bundling
    },
    ssr: {
        external: [
            'docs/js/libs/pdfjs/pdf.mjs',
            'docs/js/libs/dexie/dexie.mjs'
        ], // don’t try to SSR this file
    },
    resolve: {
        alias: {
            // file alias
            '@cond': path.resolve(process.cwd(), 'test-conditions.js'),

            // directory alias
            '@docsJs': path.resolve(process.cwd(), 'docs/js'),
            '@jsModule' : path.resolve(process.cwd(), 'docs/js/module'),
            '@libs' : path.resolve(process.cwd(), 'docs/js/libs'),

            './docs/js/libs/pdfjs/pdf.mjs': path.resolve(__dirname, 'test/__mocks__/pdfjsStub.js'),
        },
    },
})

