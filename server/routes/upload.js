const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const { put } = require('@vercel/blob');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

// memoryStorage keeps the file as a Buffer in req.file.buffer instead of
// writing it to local disk — necessary here since Vercel's serverless
// functions don't have persistent disk storage between requests.
const storage = multer.memoryStorage();

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
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file was received.' });
    }

    try {
      const uniqueName = crypto.randomBytes(8).toString('hex') + '-' + req.file.originalname;
      const blob = await put(uniqueName, req.file.buffer, {
        access: 'public',
        contentType: req.file.mimetype,
      });
      // blob.url is a full https URL — client uses it directly, no
      // prefixing needed (unlike the old local-disk relative path).
      res.status(201).json({ imageUrl: blob.url });
    } catch (uploadErr) {
      console.error('❌ blob upload error:', uploadErr.message);
      res.status(500).json({ error: 'Could not upload the image. Try again.' });
    }
  });
});

module.exports = router;
