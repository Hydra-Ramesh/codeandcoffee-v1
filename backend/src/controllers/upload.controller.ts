import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure local fallback uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer memory storage engine for direct buffer streaming to Cloudinary v2
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, GIF, SVG) are allowed!'));
    }
  },
});

export class UploadController {
  /**
   * Upload an image to Cloudinary v2 object storage (with local fallback if unconfigured)
   */
  static async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file || !req.file.buffer) {
        res.status(400).json({ success: false, message: 'No image file uploaded.' });
        return;
      }

      // Check if Cloudinary v2 is configured
      if (isCloudinaryConfigured()) {
        try {
          const cloudinaryResult = await uploadBufferToCloudinary(req.file.buffer, {
            folder: 'code_and_coffee/blogs',
            filename: req.file.originalname,
          });

          res.status(200).json({
            success: true,
            message: 'Image uploaded to Cloudinary v2 successfully.',
            data: {
              url: cloudinaryResult.secure_url,
              publicId: cloudinaryResult.public_id,
              width: cloudinaryResult.width,
              height: cloudinaryResult.height,
              format: cloudinaryResult.format,
              size: cloudinaryResult.bytes,
              storage: 'cloudinary_v2',
            },
          });
          return;
        } catch (cloudinaryErr) {
          console.error('⚠️ Cloudinary v2 upload failed, falling back to disk storage:', cloudinaryErr);
          // Fall through to local fallback
        }
      }

      // Fallback: Local disk storage
      const ext = path.extname(req.file.originalname) || '.jpg';
      const uniqueName = `image_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(uploadsDir, uniqueName);

      await fs.promises.writeFile(filePath, req.file.buffer);

      const protocol = req.protocol;
      const host = req.get('host');
      const fileUrl = `${protocol}://${host}/uploads/${uniqueName}`;

      res.status(200).json({
        success: true,
        message: 'Image stored in local uploads directory.',
        data: {
          url: fileUrl,
          filename: uniqueName,
          size: req.file.size,
          mimetype: req.file.mimetype,
          storage: 'local',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete an image from Cloudinary v2 by public ID
   */
  static async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publicId = (req.params.publicId || req.body.publicId || req.query.publicId) as string;
      if (!publicId) {
        res.status(400).json({ success: false, message: 'Image publicId is required.' });
        return;
      }

      if (isCloudinaryConfigured()) {
        await deleteFromCloudinary(publicId);
      }

      res.status(200).json({
        success: true,
        message: 'Image deleted successfully from Cloudinary.',
      });
    } catch (err) {
      next(err);
    }
  }
}
