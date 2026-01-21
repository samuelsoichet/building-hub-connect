import heic2any from 'heic2any';

export type AttachmentType = 'image' | 'pdf' | 'unknown';

/**
 * Determine the type of attachment based on file type
 */
export function getAttachmentType(file: File): AttachmentType {
  if (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic')) {
    return 'image';
  }
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return 'pdf';
  }
  return 'unknown';
}

/**
 * Check if a file is a HEIC image
 */
export function isHeicFile(file: File): boolean {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif')
  );
}

/**
 * Convert HEIC file to JPEG
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    const blob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });
    
    // heic2any can return a single blob or array of blobs
    const resultBlob = Array.isArray(blob) ? blob[0] : blob;
    
    // Create a new file with .jpg extension
    const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    return new File([resultBlob], newFileName, { type: 'image/jpeg' });
  } catch (error) {
    console.error('Error converting HEIC to JPEG:', error);
    throw new Error('Failed to convert HEIC image. Please convert it to JPEG manually.');
  }
}

/**
 * Process a file for upload - converts HEIC to JPEG if needed
 */
export async function processFileForUpload(file: File): Promise<File> {
  if (isHeicFile(file)) {
    return convertHeicToJpeg(file);
  }
  return file;
}

/**
 * Check if a file type is supported for upload
 */
export function isSupportedFileType(file: File): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/heic',
    'image/heif',
    'application/pdf',
  ];
  
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = 
    lowerName.endsWith('.heic') || 
    lowerName.endsWith('.heif') ||
    lowerName.endsWith('.pdf');
  
  return supportedTypes.includes(file.type) || hasValidExtension;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate file size
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}
