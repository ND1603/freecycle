const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const uniqueName = crypto.randomBytes(8).toString('hex') + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, WEBP, or GIF images are allowed.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST /api/upload - requires login, accepts one file under field name "image"
router.post('/', requireAuth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file was received.' });
    }
    // Client should prefix this with the server's base URL to display it
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({ imageUrl });
  });
});

module.exports = router;
