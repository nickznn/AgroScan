const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

function absoluteUrl(req, relativePath) {
  if (!relativePath) return null;
  return `${req.protocol}://${req.get('host')}${relativePath}`;
}

module.exports = { upload, absoluteUrl };
