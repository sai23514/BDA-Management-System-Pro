/**
 * Vercel serverless entry — exports the Express app.
 * Socket.io is not started here (serverless has no persistent WebSocket).
 * Chat still works via REST; live push needs a long-running host (Render/Railway).
 */
import app from '../server/src/app.js';

export default app;
