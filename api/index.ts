/**
 * Punto de entrada para Vercel Serverless Functions.
 * Vercel detecta automáticamente este archivo como handler.
 */
// #region agent log
fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:8',message:'Entry point loaded',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion
import app from '../src/api';
// #region agent log
fetch('http://127.0.0.1:7242/ingest/527dd315-bd53-467b-961a-3aa45a909471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/index.ts:11',message:'App imported successfully',data:{hasApp:!!app},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

export default app;


