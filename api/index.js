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
fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/index.ts:8', message: 'Entry point loaded', data: { timestamp: Date.now() }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
// #endregion
const api_1 = __importDefault(require("../src/api"));
// #region agent log
fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/index.ts:11', message: 'App imported successfully', data: { hasApp: !!api_1.default }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
// #endregion
exports.default = api_1.default;
//# sourceMappingURL=index.js.map