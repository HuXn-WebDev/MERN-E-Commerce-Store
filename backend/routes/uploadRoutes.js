import express from 'express';
import multer from 'multer';
import path from 'path';
import mongoose from 'mongoose';

const router = express.Router();

// Set up Multer storage and file filter
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const extname = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${extname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|webp/;
  const mimetypes = /image\/jpe?g|image\/png|image\/webp/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (filetypes.test(extname) && mimetypes.test(mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Images only'), false);
  }
};

const upload = multer({ storage, fileFilter });
const uploadSingleImage = upload.single('image');

// Mongoose model for storing image data in MongoDB
const ImageModel = mongoose.model('Image', {
  path: String,
});

router.post('/', (req, res) => {
  uploadSingleImage(req, res, async (err) => {
    if (err) {
      return res.status(400).send({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).send({ message: 'No image file provided' });
    }

    try {
      // Save image path to MongoDB
      const imagePath = `/${req.file.path}`;
      const image = new ImageModel({ path: imagePath });
      await image.save();

      res.status(200).send({
        message: 'Image uploaded and saved successfully',
        image: imagePath,
      });
    } catch (error) {
      res.status(500).send({ message: 'Internal Server Error' });
    }
  });
});

export default router;
