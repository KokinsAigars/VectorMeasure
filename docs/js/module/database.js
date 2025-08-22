/**
 * Project Name: “VectorMeasure”;
 * License: MIT;
 * Contributor(s): Aigars Kokins, ChatGPT-5;
 * total overkill
 * module/ database.js;
 */

import { debugLogLevelLoading, debugLogDatabase } from '../debug.js';
// import Dexie from "https://cdn.jsdelivr.net/npm/dexie@4/dist/dexie.mjs";
import Dexie from 'https://unpkg.com/dexie@4.0.8/dist/dexie.mjs';
// import {importDB, exportDB, importInto, peakImportFile} from "dexie-export-import";

export function createIndexedDB() {
    if(debugLogLevelLoading || debugLogDatabase) console.log('database.js > createIndexedDB() function called');

    const db = new Dexie('vmDB');

    // DB schema: conversations, messages
    db.version(1).stores({
        user: '++id, browserID, ipAddresses',
        projectId: '++id, title, planOrientation',
        comments: '++id, n, x, y, text',
        metadata: '++id createdAt, exportedAt, timestamp',
    });

    console.log("Dexie DB ready:", db);
}

export function deleteIndexedDB(){
    if(debugLogLevelLoading || debugLogDatabase) console.log('database.js > deleteIndexedDB() function called');

    db.delete()
}
