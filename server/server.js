const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const claimRoutes = require('./routes/claims');
const conversationRoutes = require('./routes/conversations');
const uploadRoutes = require('./routes/upload');

const app = express();

// credentials: true + a specific origin (not '*') is required for the
// browser to actually send/receive the auth cookie cross-origin between
// the client (Vite, port 5173) and this server (port 5000).
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Serves uploaded images at http://localhost:5000/uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Express server running on port ${PORT}`));
