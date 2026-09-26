import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';
import { getUploadsRoot, ensureUploadsRoot } from '../config/paths';

const uploadsRoot = path.join(ensureUploadsRoot(), 'logos');
const avatarsRoot = path.join(ensureUploadsRoot(), 'avatars');

if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

if (!fs.existsSync(avatarsRoot)) {
  fs.mkdirSync(avatarsRoot, { recursive: true });
}

const createStorage = (destination: string, prefix: string): multer.StorageEngine =>
  multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, destination);
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase() || '.png';
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      callback(null, `${prefix}-${unique}${extension}`);
    },
  });

const storage = createStorage(uploadsRoot, 'logo');

const imageFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowed.includes(file.mimetype)) {
    callback(new ApiError(400, 'Logo must be a JPEG, PNG, WEBP, or GIF image'));
    return;
  }

  callback(null, true);
};

export const logoUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

export const avatarUpload = multer({
  storage: createStorage(avatarsRoot, 'avatar'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

export const toLogoPath = (filename: string): string => {
  return `/uploads/logos/${filename}`;
};

export const toAvatarPath = (filename: string): string => {
  return `/uploads/avatars/${filename}`;
};
