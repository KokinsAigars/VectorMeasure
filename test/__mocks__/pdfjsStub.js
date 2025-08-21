export default {
    getDocument: () => ({
        promise: Promise.reject(new Error('pdf.js not supported in tests')),
    }),
}