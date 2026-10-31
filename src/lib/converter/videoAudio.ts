import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;

export interface MediaConvertOptions {
  audioBitrate?: string; // '128k', '192k', '320k'
  videoMode?: 'fastRemux' | 'reencode';
  resolution?: string; // 'original', '1080', '720', '480'
}

export async function getFFmpeg(
  onProgress?: (progress: number, message: string) => void
): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  if (isLoading) {
    // Wait for in-flight initialization
    while (isLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (ffmpegInstance && ffmpegInstance.loaded) return ffmpegInstance;
  }

  isLoading = true;
  onProgress?.(10, 'Initializing client-side FFmpeg WebAssembly engine...');

  try {
    const ffmpeg = new FFmpeg();

    let coreURL: string;
    let wasmURL: string;

    try {
      onProgress?.(15, 'Loading local WebAssembly core...');
      coreURL = await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript');
      wasmURL = await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm');
    } catch {
      onProgress?.(20, 'Loading backup WebAssembly core from CDN...');
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
      coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
      wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
    }

    onProgress?.(30, 'Instantiating WebAssembly in browser RAM...');
    await ffmpeg.load({
      coreURL,
      wasmURL,
    });

    ffmpegInstance = ffmpeg;
    isLoading = false;
    onProgress?.(40, 'FFmpeg engine ready!');
    return ffmpegInstance;
  } catch (err) {
    isLoading = false;
    console.error('Failed to load FFmpeg Wasm:', err);
    throw new Error(
      `Failed to initialize local WebAssembly FFmpeg engine: ${(err as Error).message}. Please ensure your browser supports WebAssembly.`
    );
  }
}

export async function convertMedia(
  file: File | Blob,
  sourceFormat: string,
  targetFormat: string,
  options: MediaConvertOptions = {},
  onProgress?: (progress: number, message: string) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg(onProgress);

  const srcExt = sourceFormat.toLowerCase();
  const tgtExt = targetFormat.toLowerCase();
  const inputFileName = `input_${Date.now()}.${srcExt}`;
  const outputFileName = `output_${Date.now()}.${tgtExt}`;

  onProgress?.(45, 'Loading file into virtual RAM filesystem...');
  await ffmpeg.writeFile(inputFileName, await fetchFile(file));

  // Progress listener
  const progressHandler = ({ progress }: { progress: number }) => {
    const pct = Math.min(98, Math.max(50, Math.round(50 + progress * 48)));
    onProgress?.(pct, `Transcoding in browser memory (${Math.round(progress * 100)}%)...`);
  };

  ffmpeg.on('progress', progressHandler);

  // Build FFmpeg command arguments
  const args: string[] = ['-i', inputFileName];

  // Check if target is audio
  const isTargetAudio = ['mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac'].includes(tgtExt);

  if (isTargetAudio) {
    if (tgtExt === 'mp3') {
      const bitrate = options.audioBitrate || '192k';
      args.push('-vn', '-c:a', 'libmp3lame', '-b:a', bitrate);
    } else if (tgtExt === 'wav') {
      args.push('-vn', '-c:a', 'pcm_s16le');
    } else if (tgtExt === 'aac' || tgtExt === 'm4a') {
      const bitrate = options.audioBitrate || '192k';
      args.push('-vn', '-c:a', 'aac', '-b:a', bitrate);
    } else if (tgtExt === 'ogg') {
      const bitrate = options.audioBitrate || '192k';
      args.push('-vn', '-c:a', 'libvorbis', '-b:a', bitrate);
    } else if (tgtExt === 'flac') {
      args.push('-vn', '-c:a', 'flac');
    }
  } else {
    // Video conversion
    if (tgtExt === 'gif') {
      args.push('-vf', 'fps=10,scale=480:-1:flags=lanczos', '-c:v', 'gif');
    } else if (tgtExt === 'webm') {
      // WebM strictly requires VP8/VP9 video codec and Vorbis/Opus audio codec
      args.push(
        '-c:v', 'libvpx',
        '-deadline', 'realtime',
        '-cpu-used', '5',
        '-b:v', '1M',
        '-crf', '30',
        '-c:a', 'libvorbis',
        '-b:a', '128k'
      );

      if (options.resolution && options.resolution !== 'original') {
        const resMap: Record<string, string> = {
          '1080': 'scale=-2:1080',
          '720': 'scale=-2:720',
          '480': 'scale=-2:480',
        };
        if (resMap[options.resolution]) {
          args.push('-vf', resMap[options.resolution]);
        }
      }
    } else {
      // MP4, MOV, MKV, AVI, M4V
      if (
        options.videoMode === 'fastRemux' &&
        (srcExt === 'mov' || srcExt === 'm4v' || srcExt === 'mp4') &&
        tgtExt === 'mp4'
      ) {
        // Fast lossless remux
        args.push('-c', 'copy');
      } else {
        // Standard H.264 + AAC
        args.push(
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '26',
          '-c:a', tgtExt === 'avi' ? 'libmp3lame' : 'aac',
          '-b:a', '128k'
        );

        if (tgtExt === 'mp4' || tgtExt === 'm4v' || tgtExt === 'mov') {
          args.push('-movflags', '+faststart');
        }

        if (options.resolution && options.resolution !== 'original') {
          const resMap: Record<string, string> = {
            '1080': 'scale=-2:1080',
            '720': 'scale=-2:720',
            '480': 'scale=-2:480',
          };
          if (resMap[options.resolution]) {
            args.push('-vf', resMap[options.resolution]);
          }
        }
      }
    }
  }

  args.push(outputFileName);

  // Collect FFmpeg diagnostic logs
  const logs: string[] = [];
  const logHandler = ({ message }: { message: string }) => {
    logs.push(message);
    if (logs.length > 50) logs.shift();
  };
  ffmpeg.on('log', logHandler);

  onProgress?.(52, 'Executing local conversion...');
  let exitCode = -1;
  try {
    exitCode = await ffmpeg.exec(args);
  } catch (execErr) {
    console.error('FFmpeg execution crash:', execErr);
    try { await ffmpeg.deleteFile(inputFileName); } catch {}
    try { await ffmpeg.deleteFile(outputFileName); } catch {}
    throw new Error(`Media conversion failed: ${(execErr as Error).message}`);
  } finally {
    ffmpeg.off('log', logHandler);
  }

  if (exitCode !== 0) {
    try { await ffmpeg.deleteFile(inputFileName); } catch {}
    try { await ffmpeg.deleteFile(outputFileName); } catch {}
    const errorDetails = logs.filter(l => /error|fatal|invalid/i.test(l)).slice(-3).join('; ');
    throw new Error(
      `Media transcoding failed with code ${exitCode}${errorDetails ? ': ' + errorDetails : '. Please verify format compatibility.'}`
    );
  }

  onProgress?.(98, 'Extracting output binary stream...');
  const data = await ffmpeg.readFile(outputFileName);
  const dataLength = (data as Uint8Array).byteLength || (data as Uint8Array).length;

  // Cleanup virtual files
  try {
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);
  } catch {}

  // Verify file has valid output size
  if (dataLength < 512 && !isTargetAudio) {
    throw new Error(
      `Converted output is too small (${dataLength} bytes). Transcoding stream did not complete properly.`
    );
  }

  const mimeMap: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    gif: 'image/gif',
  };

  const outputMime = mimeMap[tgtExt] || 'application/octet-stream';
  const finalBlob = new Blob([data as Uint8Array], { type: outputMime });

  onProgress?.(100, 'Media conversion finished!');
  return finalBlob;
}
