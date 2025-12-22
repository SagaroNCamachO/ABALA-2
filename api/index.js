"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Punto de entrada para Vercel Serverless Functions.
 * Vercel detecta automáticamente este archivo como handler.
 */
// #region agent log
try {
    const fs = require('fs');
    const logPath = '.cursor/debug.log';
    const logEntry = JSON.stringify({ location: 'api/index.ts:1', message: 'Before importing app', data: { timestamp: Date.now() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) + '\n';
    fs.appendFileSync(logPath, logEntry);
}
catch (e) { }
// #endregion
const api_1 = __importDefault(require("../src/api"));
// #region agent log
try {
    const fs = require('fs');
    const logPath = '.cursor/debug.log';
    const logEntry = JSON.stringify({ location: 'api/index.ts:7', message: 'App imported, before export', data: { hasApp: !!api_1.default, timestamp: Date.now() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) + '\n';
    fs.appendFileSync(logPath, logEntry);
}
catch (e) { }
// #endregion
exports.default = api_1.default;
// #region agent log
try {
    const fs = require('fs');
    const logPath = '.cursor/debug.log';
    const logEntry = JSON.stringify({ location: 'api/index.ts:9', message: 'Export completed', data: { timestamp: Date.now() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) + '\n';
    fs.appendFileSync(logPath, logEntry);
}
catch (e) { }
// #endregion
//# sourceMappingURL=index.js.map