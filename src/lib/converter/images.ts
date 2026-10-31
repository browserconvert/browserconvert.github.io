export interface ImageConvertOptions {
  quality?: number; // 0.1 to 1.0
  width?: number;
  height?: number;
}

export async function convertImage(
  file: File | Blob,
  sourceFormat: string,
  targetFormat: string,
  options: ImageConvertOptions = {},
  onProgress?: (progress: number, message: string) => void
): Promise<Blob> {
  onProgress?.(10, 'Analyzing image data...');

  let processBlob = file;

  // Handle HEIC/HEIF using heic2any
  if (sourceFormat.toUpperCase() === 'HEIC' || file.type.includes('heic') || file.type.includes('heif')) {
    onProgress?.(25, 'Decoding Apple HEIC image in WebAssembly...');
    try {
      const heic2any = (await import('heic2any')).default;
      const converted = await heic2any({
        blob: file,
        toType: targetFormat.toUpperCase() === 'PNG' ? 'image/png' : 'image/jpeg',
        quality: options.quality ?? 0.92,
      });
      processBlob = Array.isArray(converted) ? converted[0] : converted;
      if (targetFormat.toUpperCase() === 'JPG' || targetFormat.toUpperCase() === 'JPEG' || targetFormat.toUpperCase() === 'PNG') {
        onProgress?.(100, 'HEIC conversion finished!');
        return processBlob;
      }
    } catch (err) {
      console.error('HEIC conversion error:', err);
      throw new Error(`Failed to decode HEIC file: ${(err as Error).message}`);
    }
  }

  onProgress?.(45, 'Loading image into Canvas...');

  const img = new Image();
  const url = URL.createObjectURL(processBlob);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image into browser memory'));
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  let width = options.width || img.naturalWidth || img.width;
  let height = options.height || img.naturalHeight || img.height;

  // Special case for ICO: scale to standard icon dimension if needed
  if (targetFormat.toUpperCase() === 'ICO') {
    if (width > 256 || height > 256) {
      const scale = Math.min(64 / width, 64 / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error('Unable to initialize HTML5 Canvas 2D context');
  }

  // If converting to JPEG or ICO from transparent PNG, fill with white background
  if (targetFormat.toUpperCase() === 'JPG' || targetFormat.toUpperCase() === 'JPEG') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  onProgress?.(70, 'Rendering pixel buffers...');
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(url);

  onProgress?.(85, 'Encoding output format...');

  const quality = options.quality ?? 0.9;
  let mimeType = 'image/png';
  const target = targetFormat.toUpperCase();

  if (target === 'JPG' || target === 'JPEG') {
    mimeType = 'image/jpeg';
  } else if (target === 'WEBP') {
    mimeType = 'image/webp';
  } else if (target === 'ICO') {
    mimeType = 'image/x-icon';
  } else if (target === 'GIF') {
    mimeType = 'image/gif';
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Failed to encode image to ${targetFormat}`));
          return;
        }
        onProgress?.(100, 'Image conversion complete!');
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}
