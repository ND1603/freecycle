const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const claimRoutes = require('./routes/claims');
const conversationRoutes = require('./routes/conversations');
const uploadRoutes = require('./routes/upload');

const app = express();

// credentials: true + a specific origin (not '*') is required for the
// browser to actually send/receive the auth cookie cross-origin between
// the client and this server, whether that's localhost during dev or
// two different Vercel URLs in production.
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/upload', uploadRoutes);

module.exports = app;
