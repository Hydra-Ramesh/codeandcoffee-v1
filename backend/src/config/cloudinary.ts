import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';
import { config } from './env.js';

// Configure Cloudinary v2
if (config.cloudinary.url) {
  // If CLOUDINARY_URL is provided, cloudinary SDK auto-configures, but we ensure secure: true
  cloudinary.config({ secure: true });
} else if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

/**
 * Checks if Cloudinary is configured with valid credentials
 */
export function isCloudinaryConfigured(): boolean {
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.trim().length > 0) {
    return true;
  }
  return !!(
    config.cloudinary.cloudName &&
    config.cloudinary.cloudName.trim().length > 0 &&
    config.cloudinary.apiKey &&
    config.cloudinary.apiKey.trim().length > 0 &&
    config.cloudinary.apiSecret &&
    config.cloudinary.apiSecret.trim().length > 0
  );
}

/**
 * Uploads a memory buffer directly to Cloudinary v2 using streams
 */
export function uploadBufferToCloudinary(
  buffer: Buffer,
  options?: {
    folder?: string;
    publicId?: string;
    filename?: string;
  }
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options?.folder || 'code_and_coffee/blogs',
        public_id: options?.publicId,
        resource_type: 'image',
        // Automatically optimize quality and format (webp/avif where supported)
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Cloudinary upload returned an empty response.'));
        }
        resolve(result);
      }
    );

    // Pipe the buffer to Cloudinary stream
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    stream.pipe(uploadStream);
  });
}

/**
 * Deletes an image from Cloudinary by its public ID
 */
export async function deleteFromCloudinary(publicId: string): Promise<any> {
  if (!isCloudinaryConfigured()) return null;
  return cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
export default cloudinary;
