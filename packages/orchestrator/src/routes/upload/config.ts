import multer from 'multer';

/**
 * Multer configuration for file uploads
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
    files: 1, // Only one file per request
  },
});
