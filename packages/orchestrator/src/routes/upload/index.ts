import type { Application } from 'express';
import { upload } from './config.js';
import { uploadTempFile } from './temp.post.js';
import { getTempUploadDetail } from './temp-detail.get.js';
import { deleteTempUpload } from './temp-detail.delete.js';
import { getUploadStats } from './stats.get.js';

/**
 * Register all upload routes
 */
export function registerUploadRoutes(app: Application): void {
  app.post('/api/upload/temp', upload.single('file'), uploadTempFile);
  app.get('/api/upload/temp/:id', getTempUploadDetail);
  app.delete('/api/upload/temp/:id', deleteTempUpload);
  app.get('/api/upload/stats', getUploadStats);
}
