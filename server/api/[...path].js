// Vercel maps this file's path — api/[...path].js — to match every
// request under /api/*, then passes it straight to our existing Express
// app. Express still does its own internal routing (app.use('/api/auth',
// ...) etc.) exactly like it does locally — this file is just the
// doorway Vercel uses to reach it.
const app = require('../app');

module.exports = app;
