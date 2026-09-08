const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dossierUploads = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(dossierUploads)) {
  fs.mkdirSync(dossierUploads, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dossierUploads),
  filename: (req, file, cb) => {
    const suffixe = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, suffixe + path.extname(file.originalname));
  },
});

const typesAutorises = ['.pdf', '.jpg', '.jpeg', '.png'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!typesAutorises.includes(ext)) {
      return cb(new Error('Type de fichier non autorise. Utilisez PDF, JPG ou PNG.'));
    }
    cb(null, true);
  },
});

module.exports = upload;
