/**
 * Punto de entrada para Vercel Serverless Functions.
 * Vercel detecta automáticamente este archivo como handler.
 */
// #region agent log
try {
  const fs = require('fs');
  const logPath = '.cursor/debug.log';
  const logEntry = JSON.stringify({location:'api/index.ts:1',message:'Before importing app',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'}) + '\n';
  fs.appendFileSync(logPath, logEntry);
} catch(e) {}
// #endregion
import app from '../src/api';
// #region agent log
try {
  const fs = require('fs');
  const logPath = '.cursor/debug.log';
  const logEntry = JSON.stringify({location:'api/index.ts:7',message:'App imported, before export',data:{hasApp:!!app,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'}) + '\n';
  fs.appendFileSync(logPath, logEntry);
} catch(e) {}
// #endregion

export default app;
// #region agent log
try {
  const fs = require('fs');
  const logPath = '.cursor/debug.log';
  const logEntry = JSON.stringify({location:'api/index.ts:9',message:'Export completed',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'}) + '\n';
  fs.appendFileSync(logPath, logEntry);
} catch(e) {}
// #endregion


