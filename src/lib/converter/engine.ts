import { SUPPORTED_FORMATS } from './formats';
import { convertImage, type ImageConvertOptions } from './images';
import { convertSpreadsheet } from './spreadsheets';
import { convertDocument, type DocumentConvertOptions } from './documents';
import { convertMedia, type MediaConvertOptions } from './videoAudio';

export interface ConvertOptions extends ImageConvertOptions, DocumentConvertOptions, MediaConvertOptions {}

export interface ConvertResult {
  blob: Blob;
  filename: string;
  previewUrl: string;
  previewType: 'image' | 'video' | 'audio' | 'text' | 'download';
  durationMs: number;
  originalSize: number;
  convertedSize: number;
}

export async function convertFile(
  file: File,
  fromFormat: string,
  toFormat: string,
  options: ConvertOptions = {},
  onProgress?: (progress: number, message: string) => void
): Promise<ConvertResult> {
  const startTime = performance.now();
  const src = fromFormat.toUpperCase();
  const tgt = toFormat.toUpperCase();

  const srcDef = SUPPORTED_FORMATS[src];
  const tgtDef = SUPPORTED_FORMATS[tgt];

  let resultBlob: Blob;

  // Determine category and delegate to specific modular worker
  const isMedia = (srcDef?.category === 'Video' || srcDef?.category === 'Audio') ||
                  (src === 'GIF' && tgtDef?.category === 'Video');
  const isImageToPdf = srcDef?.category === 'Image' && tgt === 'PDF';
  const isPdfToImage = src === 'PDF' && (tgt === 'JPG' || tgt === 'JPEG' || tgt === 'PNG');
  const isDocument = srcDef?.category === 'Document' || isImageToPdf || isPdfToImage;
  const isSpreadsheet = srcDef?.category === 'Spreadsheet';
  const isImageToImage = srcDef?.category === 'Image' && tgtDef?.category === 'Image';

  if (isMedia) {
    resultBlob = await convertMedia(file, src, tgt, options, onProgress);
  } else if (isDocument) {
    resultBlob = await convertDocument(file, src, tgt, options, onProgress);
  } else if (isSpreadsheet) {
    resultBlob = await convertSpreadsheet(file, src, tgt, onProgress);
  } else if (isImageToImage) {
    resultBlob = await convertImage(file, src, tgt, options, onProgress);
  } else {
    throw new Error(`Unsupported conversion in browser: ${fromFormat} to ${toFormat}`);
  }

  const durationMs = Math.round(performance.now() - startTime);

  // Generate output filename
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const ext = tgtDef ? tgtDef.extension : tgt.toLowerCase();
  const filename = `${baseName}.${ext}`;

  // Preview preparation
  let previewType: ConvertResult['previewType'] = 'download';
  const targetCategory = tgtDef?.category;

  if (targetCategory === 'Image' || tgt === 'JPG' || tgt === 'PNG' || tgt === 'WEBP' || tgt === 'GIF') {
    previewType = 'image';
  } else if (targetCategory === 'Video' || tgt === 'MP4' || tgt === 'WEBM') {
    previewType = 'video';
  } else if (targetCategory === 'Audio' || tgt === 'MP3' || tgt === 'WAV' || tgt === 'OGG' || tgt === 'AAC') {
    previewType = 'audio';
  } else if (tgt === 'TXT' || tgt === 'HTML' || tgt === 'CSV' || tgt === 'JSON') {
    previewType = 'text';
  }

  const previewUrl = URL.createObjectURL(resultBlob);

  return {
    blob: resultBlob,
    filename,
    previewUrl,
    previewType,
    durationMs,
    originalSize: file.size,
    convertedSize: resultBlob.size,
  };
}
