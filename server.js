/**
 * Project Name: “VectorMeasure”
 * Abbreviation: VM
 * License: MIT
 * Contributor(s): Aigars Kokins
 * server.js
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'docs')));

app.listen(PORT, () => {
    console.log(`✅ VectorMeasure running at http://localhost:${PORT}`);
});