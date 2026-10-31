export type FormatCategory = 'Video' | 'Audio' | 'Image' | 'Document' | 'Spreadsheet';

export interface FormatDefinition {
  id: string;
  name: string;
  extension: string;
  category: FormatCategory;
  mimeType: string;
  popularTargets: string[];
}

export const SUPPORTED_FORMATS: Record<string, FormatDefinition> = {
  // Video
  MP4: { id: 'MP4', name: 'MP4 Video', extension: 'mp4', category: 'Video', mimeType: 'video/mp4', popularTargets: ['MP3', 'WEBM', 'MOV', 'GIF'] },
  MOV: { id: 'MOV', name: 'QuickTime MOV', extension: 'mov', category: 'Video', mimeType: 'video/quicktime', popularTargets: ['MP4', 'MP3', 'WEBM'] },
  WEBM: { id: 'WEBM', name: 'WebM Video', extension: 'webm', category: 'Video', mimeType: 'video/webm', popularTargets: ['MP4', 'MP3', 'GIF'] },
  MKV: { id: 'MKV', name: 'Matroska MKV', extension: 'mkv', category: 'Video', mimeType: 'video/x-matroska', popularTargets: ['MP4', 'MP3'] },
  AVI: { id: 'AVI', name: 'AVI Video', extension: 'avi', category: 'Video', mimeType: 'video/x-msvideo', popularTargets: ['MP4', 'MP3'] },
  M4V: { id: 'M4V', name: 'iTunes M4V', extension: 'm4v', category: 'Video', mimeType: 'video/x-m4v', popularTargets: ['MP4', 'MP3'] },

  // Audio
  MP3: { id: 'MP3', name: 'MP3 Audio', extension: 'mp3', category: 'Audio', mimeType: 'audio/mpeg', popularTargets: ['WAV', 'M4A', 'AAC', 'OGG'] },
  M4A: { id: 'M4A', name: 'M4A Audio', extension: 'm4a', category: 'Audio', mimeType: 'audio/mp4', popularTargets: ['MP3', 'WAV'] },
  WAV: { id: 'WAV', name: 'WAV Audio', extension: 'wav', category: 'Audio', mimeType: 'audio/wav', popularTargets: ['MP3', 'AAC', 'FLAC', 'OGG'] },
  AAC: { id: 'AAC', name: 'AAC Audio', extension: 'aac', category: 'Audio', mimeType: 'audio/aac', popularTargets: ['MP3', 'WAV'] },
  OGG: { id: 'OGG', name: 'Ogg Vorbis', extension: 'ogg', category: 'Audio', mimeType: 'audio/ogg', popularTargets: ['MP3', 'WAV'] },
  FLAC: { id: 'FLAC', name: 'FLAC Audio', extension: 'flac', category: 'Audio', mimeType: 'audio/flac', popularTargets: ['MP3', 'WAV'] },

  // Image
  JPG: { id: 'JPG', name: 'JPEG Image', extension: 'jpg', category: 'Image', mimeType: 'image/jpeg', popularTargets: ['PNG', 'WEBP', 'PDF', 'ICO'] },
  PNG: { id: 'PNG', name: 'PNG Image', extension: 'png', category: 'Image', mimeType: 'image/png', popularTargets: ['JPG', 'WEBP', 'PDF', 'ICO'] },
  WEBP: { id: 'WEBP', name: 'WebP Image', extension: 'webp', category: 'Image', mimeType: 'image/webp', popularTargets: ['PNG', 'JPG', 'PDF'] },
  HEIC: { id: 'HEIC', name: 'Apple HEIC/HEIF', extension: 'heic', category: 'Image', mimeType: 'image/heic', popularTargets: ['JPG', 'PNG', 'WEBP'] },
  SVG: { id: 'SVG', name: 'Scalable Vector SVG', extension: 'svg', category: 'Image', mimeType: 'image/svg+xml', popularTargets: ['PNG', 'JPG', 'PDF'] },
  GIF: { id: 'GIF', name: 'GIF Animation', extension: 'gif', category: 'Image', mimeType: 'image/gif', popularTargets: ['MP4', 'PNG', 'WEBP'] },
  ICO: { id: 'ICO', name: 'Windows Icon', extension: 'ico', category: 'Image', mimeType: 'image/x-icon', popularTargets: ['PNG', 'JPG'] },

  // Document
  PDF: { id: 'PDF', name: 'PDF Document', extension: 'pdf', category: 'Document', mimeType: 'application/pdf', popularTargets: ['DOCX', 'TXT', 'JPG', 'PNG'] },
  DOCX: { id: 'DOCX', name: 'Word Document', extension: 'docx', category: 'Document', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', popularTargets: ['PDF', 'TXT', 'HTML'] },
  TXT: { id: 'TXT', name: 'Plain Text', extension: 'txt', category: 'Document', mimeType: 'text/plain', popularTargets: ['PDF', 'DOCX', 'HTML'] },
  HTML: { id: 'HTML', name: 'HTML Document', extension: 'html', category: 'Document', mimeType: 'text/html', popularTargets: ['PDF', 'DOCX', 'TXT'] },

  // Spreadsheet
  CSV: { id: 'CSV', name: 'CSV Delimited', extension: 'csv', category: 'Spreadsheet', mimeType: 'text/csv', popularTargets: ['XLSX', 'JSON'] },
  XLSX: { id: 'XLSX', name: 'Excel Spreadsheet', extension: 'xlsx', category: 'Spreadsheet', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', popularTargets: ['CSV', 'JSON', 'PDF'] },
  JSON: { id: 'JSON', name: 'JSON Data', extension: 'json', category: 'Spreadsheet', mimeType: 'application/json', popularTargets: ['CSV', 'XLSX'] },
};

export const CATEGORIES: FormatCategory[] = ['Video', 'Audio', 'Image', 'Document', 'Spreadsheet'];

export function detectFormatFromFilename(filename: string): { format: string; suggestedTarget: string } {
  const ext = filename.split('.').pop()?.toUpperCase() || '';
  let matchedFormat = 'PNG';
  let suggestedTarget = 'JPG';

  // Specific aliases
  if (ext === 'JPEG') {
    matchedFormat = 'JPG';
  } else if (ext === 'HEIF') {
    matchedFormat = 'HEIC';
  } else if (SUPPORTED_FORMATS[ext]) {
    matchedFormat = ext;
  }

  const def = SUPPORTED_FORMATS[matchedFormat];
  if (def && def.popularTargets.length > 0) {
    suggestedTarget = def.popularTargets[0];
  }

  return { format: matchedFormat, suggestedTarget };
}

export const COMPATIBLE_TARGETS: Record<string, string[]> = {
  // Video: Transcode to other video containers, extract audio tracks, or generate GIF
  MP4: ['MP3', 'WEBM', 'MOV', 'MKV', 'AVI', 'M4V', 'WAV', 'AAC', 'M4A', 'OGG', 'FLAC', 'GIF'],
  MOV: ['MP4', 'MP3', 'WEBM', 'MKV', 'AVI', 'M4V', 'WAV', 'AAC', 'M4A', 'OGG', 'FLAC', 'GIF'],
  WEBM: ['MP4', 'MP3', 'MOV', 'MKV', 'AVI', 'M4V', 'WAV', 'AAC', 'M4A', 'OGG', 'FLAC', 'GIF'],
  MKV: ['MP4', 'MP3', 'WEBM', 'MOV', 'AVI', 'M4V', 'WAV', 'AAC', 'M4A', 'OGG', 'FLAC', 'GIF'],
  AVI: ['MP4', 'MP3', 'WEBM', 'MOV', 'MKV', 'M4V', 'WAV', 'AAC', 'M4A', 'OGG', 'FLAC', 'GIF'],
  M4V: ['MP4', 'MP3', 'WEBM', 'MOV', 'MKV', 'AVI', 'WAV', 'AAC', 'M4A', 'OGG', 'FLAC', 'GIF'],

  // Audio: Transcode across all standard audio codecs
  MP3: ['WAV', 'M4A', 'AAC', 'OGG', 'FLAC'],
  M4A: ['MP3', 'WAV', 'AAC', 'OGG', 'FLAC'],
  WAV: ['MP3', 'M4A', 'AAC', 'OGG', 'FLAC'],
  AAC: ['MP3', 'WAV', 'M4A', 'OGG', 'FLAC'],
  OGG: ['MP3', 'WAV', 'AAC', 'M4A', 'FLAC'],
  FLAC: ['MP3', 'WAV', 'AAC', 'M4A', 'OGG'],

  // Image: Convert across raster formats or embed into vector PDF
  JPG: ['PNG', 'WEBP', 'PDF', 'ICO'],
  PNG: ['JPG', 'WEBP', 'PDF', 'ICO'],
  WEBP: ['PNG', 'JPG', 'PDF', 'ICO'],
  HEIC: ['JPG', 'PNG', 'WEBP', 'PDF'],
  SVG: ['PNG', 'JPG', 'WEBP', 'PDF'],
  GIF: ['MP4', 'PNG', 'JPG', 'WEBP'],
  ICO: ['PNG', 'JPG', 'WEBP'],

  // Document: PDF (Text/Docx/HTML/Image), Word DOCX, Plain Text TXT, and HTML
  PDF: ['TXT', 'DOCX', 'HTML', 'JPG', 'PNG'],
  DOCX: ['PDF', 'TXT', 'HTML'],
  TXT: ['PDF', 'DOCX', 'HTML'],
  HTML: ['PDF', 'DOCX', 'TXT'],

  // Spreadsheet: CSV, Excel XLSX, JSON data, HTML table, Text
  CSV: ['XLSX', 'JSON', 'TXT', 'HTML'],
  XLSX: ['CSV', 'JSON', 'TXT', 'HTML'],
  JSON: ['CSV', 'XLSX', 'TXT'],
};

export function getCompatibleTargets(sourceFormat: string): string[] {
  const upper = sourceFormat?.toUpperCase() || '';
  if (COMPATIBLE_TARGETS[upper]) {
    return COMPATIBLE_TARGETS[upper];
  }
  return ['PNG', 'JPG', 'PDF'];
}
