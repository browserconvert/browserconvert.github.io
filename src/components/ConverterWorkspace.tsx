import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowRightLeft,
  ChevronDown,
  UploadCloud,
  FileCheck,
  Play,
  RotateCcw,
  Download,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Cpu,
  Layers,
  File as FileIcon,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FormatSelectorMegaMenu } from './FormatSelectorMegaMenu';
import { SUPPORTED_FORMATS, detectFormatFromFilename, getCompatibleTargets } from '../lib/converter/formats';
import { convertFile, type ConvertResult } from '../lib/converter/engine';
import { useTranslations, type SupportedLanguage } from '../i18n/ui';

interface ConverterWorkspaceProps {
  currentLang: SupportedLanguage;
}

interface QueuedFile {
  id: string;
  file: File;
  status: 'ready' | 'converting' | 'done' | 'error';
  progress: number;
  statusText?: string;
  result?: ConvertResult;
  errorMessage?: string;
}

export const ConverterWorkspace: React.FC<ConverterWorkspaceProps> = ({ currentLang }) => {
  const t = useTranslations(currentLang);

  // Two-button hub formats
  const [fromFormat, setFromFormat] = useState<string>('MP4');
  const [toFormat, setToFormat] = useState<string>('MP3');
  const [isFromModalOpen, setIsFromModalOpen] = useState<boolean>(false);
  const [isToModalOpen, setIsToModalOpen] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  // File queue
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Context Settings
  const [audioBitrate, setAudioBitrate] = useState<string>('192k');
  const [videoMode, setVideoMode] = useState<'fastRemux' | 'reencode'>('fastRemux');
  const [videoResolution, setVideoResolution] = useState<string>('original');
  const [imageQuality, setImageQuality] = useState<number>(0.9);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Global conversion status
  const [isConvertingAll, setIsConvertingAll] = useState<boolean>(false);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);

  // Listen for 1-click popular conversion triggers
  useEffect(() => {
    const handleFormatEvent = (e: any) => {
      if (e.detail?.from && e.detail?.to) {
        setFromFormat(e.detail.from);
        setToFormat(e.detail.to);
      }
    };
    window.addEventListener('browserconvert:select-format', handleFormatEvent);
    return () => window.removeEventListener('browserconvert:select-format', handleFormatEvent);
  }, []);

  // Auto-detect formats when files are added
  const handleFilesAdded = useCallback((newFiles: FileList | File[]) => {
    if (!newFiles || newFiles.length === 0) return;

    const filesArray = Array.from(newFiles);
    const firstFile = filesArray[0];

    // Smart auto-detect
    const detection = detectFormatFromFilename(firstFile.name);
    setFromFormat(detection.format);
    const compatible = getCompatibleTargets(detection.format);
    if (compatible.includes(detection.suggestedTarget)) {
      setToFormat(detection.suggestedTarget);
    } else {
      setToFormat(compatible[0] || 'JPG');
    }

    const newQueued: QueuedFile[] = filesArray.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      status: 'ready',
      progress: 0,
      statusText: t('statusReady'),
    }));

    setQueue((prev) => [...prev, ...newQueued]);
  }, [t]);

  // Drag & drop listeners
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  // 1-Click Swap formats
  const handleSwapFormats = () => {
    setIsSwapping(true);
    const nextFrom = toFormat;
    const compatible = getCompatibleTargets(nextFrom);
    let nextTo = fromFormat;
    if (!compatible.includes(nextTo)) {
      nextTo = compatible[0] || 'JPG';
    }
    setFromFormat(nextFrom);
    setToFormat(nextTo);
    setTimeout(() => setIsSwapping(false), 500);
  };

  // Remove file from queue
  const handleRemoveFile = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear entire queue
  const handleClearAll = () => {
    queue.forEach((q) => {
      if (q.result?.previewUrl) {
        URL.revokeObjectURL(q.result.previewUrl);
      }
    });
    setQueue([]);
  };

  // Execute Conversion
  const handleStartConversion = async () => {
    if (queue.length === 0 || isConvertingAll) return;

    setIsConvertingAll(true);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === 'done') continue;

      setActiveFileIndex(i);

      setQueue((prev) =>
        prev.map((q, idx) =>
          idx === i ? { ...q, status: 'converting', progress: 5, statusText: t('convertingButton') } : q
        )
      );

      try {
        const result = await convertFile(
          item.file,
          fromFormat,
          toFormat,
          {
            audioBitrate,
            videoMode,
            resolution: videoResolution,
            quality: imageQuality,
          },
          (progress, message) => {
            setQueue((prev) =>
              prev.map((q, idx) =>
                idx === i ? { ...q, progress, statusText: message } : q
              )
            );
          }
        );

        setQueue((prev) =>
          prev.map((q, idx) =>
            idx === i
              ? {
                  ...q,
                  status: 'done',
                  progress: 100,
                  statusText: t('statusDone'),
                  result,
                }
              : q
          )
        );

        // Fire celebration confetti!
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#CB2957', '#000000', '#DDDDDD'],
          });
        } catch {}

      } catch (err) {
        console.error('Conversion execution error:', err);
        setQueue((prev) =>
          prev.map((q, idx) =>
            idx === i
              ? {
                  ...q,
                  status: 'error',
                  progress: 0,
                  statusText: t('statusError'),
                  errorMessage: (err as Error).message,
                }
              : q
          )
        );
      }
    }

    setIsConvertingAll(false);
  };

  // Download converted file
  const handleDownload = (result: ConvertResult) => {
    const link = document.createElement('a');
    link.href = result.previewUrl;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper formatting for file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isAudioConversion = SUPPORTED_FORMATS[toFormat]?.category === 'Audio';
  const isVideoConversion = SUPPORTED_FORMATS[toFormat]?.category === 'Video';
  const isImageConversion = SUPPORTED_FORMATS[toFormat]?.category === 'Image';

  const anyDone = queue.some((q) => q.status === 'done');
  const allDone = queue.length > 0 && queue.every((q) => q.status === 'done');

  return (
    <div className="w-full min-h-[calc(100dvh-5rem)] flex flex-col justify-center items-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      
      {/* ======================================================== */}
      {/* 100% FIRST FOLD HERO WORKSPACE BOX DIV                   */}
      {/* ======================================================== */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        
        {/* Top Privacy & Security Badge */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-ruby/10 dark:bg-ruby/20 border border-ruby/30 text-ruby text-xs sm:text-sm font-bold tracking-wide mb-4 animate-fade-in">
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ruby shrink-0" />
          {/* Simple short text on mobile and tablet */}
          <span className="inline lg:hidden">{t('privacyBadgeShort') || '100% Client-Side'}</span>
          {/* Full text on desktop */}
          <span className="hidden lg:inline">{t('privacyBadge')}</span>
        </div>

        {/* Big Bold Typography */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black text-obsidian dark:text-white text-center leading-tight tracking-tight mb-3">
          {t('heroTitle')}
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-300 text-center max-w-2xl mb-8">
          {t('heroSubtitle')}
        </p>

        {/* ======================================================== */}
        {/* UNIVERSAL CONVERTER BOX (Card Container)                 */}
        {/* ======================================================== */}
        <div className="w-full rounded-3xl bg-white dark:bg-obsidian-card border border-silver dark:border-obsidian-border shadow-elevation dark:shadow-elevation-dark p-4 sm:p-8 transition-all">
          
          {/* ======================================================== */}
          {/* CLOUDCONVERT-STYLE TWO-BUTTON FORMAT HUB                 */}
          {/* [ Convert: MP4 v ]  ⇄  [ To: MP3 v ]                     */}
          {/* ======================================================== */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
            
            {/* Convert [From] Button */}
            <div className="w-full sm:w-64">
              <span className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1.5 pl-1 uppercase tracking-wider">
                {t('convertLabel')}
              </span>
              <button
                type="button"
                onClick={() => setIsFromModalOpen(true)}
                className="w-full h-16 px-5 rounded-2xl bg-black text-white hover:bg-neutral-900 border border-neutral-800 flex items-center justify-between shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-ruby"
                aria-label={`Select input format. Current format is ${fromFormat}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black tracking-wider text-white">
                    {fromFormat}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-ruby font-bold uppercase text-white">
                    {SUPPORTED_FORMATS[fromFormat]?.category || 'FILE'}
                  </span>
                </div>
                <ChevronDown className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* 1-Click Swap Button */}
            <div className="flex items-center justify-center sm:pt-6">
              <button
                type="button"
                onClick={handleSwapFormats}
                className="w-12 h-12 rounded-2xl bg-white dark:bg-obsidian-pill border border-silver dark:border-obsidian-border text-obsidian dark:text-white hover:border-ruby hover:scale-110 active:scale-95 flex items-center justify-center transition-all shadow-sm animate-swap-pulse group focus:outline-none focus:ring-2 focus:ring-ruby/50"
                title={t('swapFormats')}
                aria-label={t('swapFormats')}
              >
                <ArrowRightLeft
                  className={`w-5 h-5 text-ruby transition-transform duration-500 ${
                    isSwapping ? 'rotate-180 scale-125' : 'animate-swap-loop group-hover:scale-110'
                  }`}
                />
              </button>
            </div>

            {/* Convert [To] Button */}
            <div className="w-full sm:w-64">
              <span className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1.5 pl-1 uppercase tracking-wider">
                {t('toLabel')}
              </span>
              <button
                type="button"
                onClick={() => setIsToModalOpen(true)}
                className="w-full h-16 px-5 rounded-2xl bg-black text-white hover:bg-neutral-900 border border-neutral-800 flex items-center justify-between shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-ruby"
                aria-label={`Select output format. Current format is ${toFormat}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black tracking-wider text-ruby">
                    {toFormat}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-ruby/20 border border-ruby/40 font-bold uppercase text-ruby">
                    {SUPPORTED_FORMATS[toFormat]?.category || 'FILE'}
                  </span>
                </div>
                <ChevronDown className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
              </button>
            </div>

          </div>

          {/* Context Settings Toggle Button (if media or image) */}
          {(isAudioConversion || isVideoConversion || isImageConversion) && (
            <div className="flex justify-center mb-5">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 bg-alabaster dark:bg-obsidian-box border border-silver dark:border-obsidian-border hover:border-ruby transition-colors"
              >
                <Sliders className="w-4 h-4 text-ruby" />
                <span>{t('settingsTitle')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}

          {/* Context-Aware Settings Options Drawer */}
          {showSettings && (
            <div className="mb-6 p-4 rounded-2xl bg-neutral-50 dark:bg-obsidian-box border border-silver dark:border-obsidian-border animate-fade-in">
              <div className="flex flex-wrap items-center justify-center gap-6">
                
                {/* Audio Bitrate */}
                {isAudioConversion && (
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-xs font-bold text-neutral-500">{t('audioBitrate')}</span>
                    <div className="inline-flex rounded-xl p-1 bg-alabaster dark:bg-obsidian border border-silver dark:border-obsidian-border">
                      {['128k', '192k', '320k'].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setAudioBitrate(rate)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                            audioBitrate === rate ? 'bg-ruby text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {rate}bps
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Quality / Mode */}
                {isVideoConversion && (
                  <>
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-xs font-bold text-neutral-500">{t('videoQuality')}</span>
                      <div className="inline-flex rounded-xl p-1 bg-alabaster dark:bg-obsidian border border-silver dark:border-obsidian-border">
                        <button
                          type="button"
                          onClick={() => setVideoMode('fastRemux')}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                            videoMode === 'fastRemux' ? 'bg-ruby text-white' : 'text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {t('fastRemux')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoMode('reencode')}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                            videoMode === 'reencode' ? 'bg-ruby text-white' : 'text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {t('reencode')}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-xs font-bold text-neutral-500">{t('videoResolution')}</span>
                      <div className="inline-flex rounded-xl p-1 bg-alabaster dark:bg-obsidian border border-silver dark:border-obsidian-border">
                        {['original', '1080', '720', '480'].map((res) => (
                          <button
                            key={res}
                            type="button"
                            onClick={() => setVideoResolution(res)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                              videoResolution === res ? 'bg-ruby text-white' : 'text-neutral-600 dark:text-neutral-400'
                            }`}
                          >
                            {res === 'original' ? t('originalRes') : `${res}p`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Image Quality */}
                {isImageConversion && (
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-xs font-bold text-neutral-500">{t('imageQuality')}: {Math.round(imageQuality * 100)}%</span>
                    <input
                      type="range"
                      min="0.3"
                      max="1.0"
                      step="0.05"
                      value={imageQuality}
                      onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                      className="w-36 accent-ruby"
                    />
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Hidden file input always available */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFilesAdded(e.target.files);
            }}
          />

          {/* ======================================================== */}
          {/* STEP 1: INITIAL UPLOAD DROPZONE (When queue is empty)    */}
          {/* ======================================================== */}
          {queue.length === 0 ? (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`w-full rounded-2xl border-2 border-dashed p-8 sm:p-12 flex flex-col items-center justify-center text-center transition-all ${
                isDragging
                  ? 'border-ruby bg-ruby/5 dark:bg-ruby/10 scale-[1.01]'
                  : 'border-silver dark:border-obsidian-border bg-alabaster/40 dark:bg-obsidian-box hover:border-ruby'
              }`}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white dark:bg-obsidian-card border border-silver dark:border-obsidian-border flex items-center justify-center text-ruby mb-4 shadow-sm group-hover:scale-105 transition-transform">
                <UploadCloud className="w-9 h-9 sm:w-11 sm:h-11" />
              </div>

              <p className="text-xl sm:text-2xl font-black text-obsidian dark:text-white mb-1.5">
                {t('dropzoneTitle')}
              </p>

              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mb-6">
                {t('dropzoneSubtitle')}
              </p>

              {/* Oversized #CB2957 Select File button */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-4 rounded-2xl bg-ruby hover:bg-ruby-hover text-white text-base sm:text-lg font-black shadow-ruby-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <FileCheck className="w-5 h-5" />
                  <span>{t('selectFiles')}</span>
                </button>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* STEP 2: UPLOADED FILES & PROCESSING (Dropzone disappears)*/
            /* ======================================================== */
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`w-full rounded-2xl p-2 sm:p-4 space-y-4 animate-fade-in transition-all ${
                isDragging ? 'ring-2 ring-ruby bg-ruby/5 dark:bg-ruby/10' : ''
              }`}
            >
              {/* Header: File Count + Add More Files + Clear All */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-silver dark:border-obsidian-border">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-base sm:text-lg font-black text-obsidian dark:text-white">
                    {t('queueTitle')} ({queue.length})
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-ruby/15 text-ruby font-bold">
                    {fromFormat} → {toFormat}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isConvertingAll}
                    className="px-3 py-1.5 rounded-xl border border-silver dark:border-obsidian-border bg-white dark:bg-obsidian-card text-obsidian dark:text-white hover:border-ruby text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-ruby" />
                    <span>{t('addMoreFiles')}</span>
                  </button>

                  {!isConvertingAll && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="px-3 py-1.5 rounded-xl text-neutral-500 hover:text-ruby hover:bg-ruby/10 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('clearQueue')}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Uploaded Files List */}
              <div className="space-y-3">
                {queue.map((item, index) => {
                  const isThisDone = item.status === 'done';
                  const isThisConverting = item.status === 'converting';
                  const isThisError = item.status === 'error';

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-alabaster/60 dark:bg-obsidian-box border border-silver dark:border-obsidian-border transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-obsidian-card border border-silver dark:border-obsidian-border flex items-center justify-center shrink-0">
                            {isThisDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : isThisError ? (
                              <AlertCircle className="w-5 h-5 text-rose-500" />
                            ) : (
                              <FileIcon className="w-5 h-5 text-ruby" />
                            )}
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-bold text-obsidian dark:text-white truncate">
                              {item.file.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {formatBytes(item.file.size)}
                            </p>
                          </div>
                        </div>

                        {/* Status / Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isThisDone && item.result && (
                            <button
                              type="button"
                              onClick={() => handleDownload(item.result!)}
                              className="px-4 py-2 rounded-xl bg-ruby hover:bg-ruby-hover text-white text-xs font-bold shadow-ruby-sm flex items-center gap-1.5 transition-all"
                            >
                              <Download className="w-4 h-4" />
                              <span>{t('downloadFile')}</span>
                            </button>
                          )}

                          {!isConvertingAll && !isThisDone && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(item.id)}
                              className="p-2 text-neutral-400 hover:text-ruby rounded-lg transition-colors"
                              aria-label={t('removeFile')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Animated Progress Bar */}
                      {(isThisConverting || isThisDone) && (
                        <div className="mt-3 space-y-1.5" aria-live="polite">
                          <div className="w-full h-3 rounded-full bg-silver/60 dark:bg-obsidian-pill overflow-hidden">
                            <div
                              className="h-full bg-ruby rounded-full transition-all duration-300 animate-stripes"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
                            <span className="truncate">{item.statusText}</span>
                            <span className="font-bold text-ruby">{item.progress}%</span>
                          </div>
                        </div>
                      )}

                      {/* Error Banner */}
                      {isThisError && (
                        <div className="mt-2 p-2 rounded-lg bg-rose-500/10 text-rose-500 text-xs font-medium">
                          {item.errorMessage || 'Conversion failed'}
                        </div>
                      )}

                      {/* Instant Result Preview */}
                      {isThisDone && item.result && (
                        <div className="mt-4 p-4 rounded-xl bg-white dark:bg-obsidian-card border border-silver dark:border-obsidian-border animate-fade-in">
                          <div className="flex items-center justify-between mb-3 text-xs font-bold text-neutral-500">
                            <span>{t('previewTitle')}</span>
                            <span>{t('timeElapsed')} {item.result.durationMs}ms</span>
                          </div>

                          {/* Image preview */}
                          {item.result.previewType === 'image' && (
                            <div className="max-h-60 flex justify-center bg-black/5 dark:bg-black/40 rounded-xl overflow-hidden p-2">
                              <img
                                src={item.result.previewUrl}
                                alt="Converted preview"
                                className="max-h-56 object-contain rounded-lg"
                              />
                            </div>
                          )}

                          {/* Audio preview */}
                          {item.result.previewType === 'audio' && (
                            <div className="w-full p-2">
                              <audio
                                controls
                                preload="metadata"
                                src={item.result.previewUrl}
                                className="w-full"
                              />
                            </div>
                          )}

                          {/* Video preview */}
                          {item.result.previewType === 'video' && (
                            <div className="max-h-72 flex justify-center bg-black rounded-xl overflow-hidden">
                              <video
                                controls
                                playsInline
                                preload="metadata"
                                src={item.result.previewUrl}
                                className="max-h-68 w-full object-contain"
                              />
                            </div>
                          )}

                          {/* Text/Document preview notice */}
                          {item.result.previewType === 'text' && (
                            <div className="p-3 rounded-lg bg-neutral-100 dark:bg-obsidian text-xs font-mono text-neutral-700 dark:text-neutral-300 overflow-x-auto">
                              ✓ {item.result.filename} ({formatBytes(item.result.convertedSize)})
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                            <span>{t('originalSize')}: {formatBytes(item.result.originalSize)}</span>
                            <span className="font-bold text-obsidian dark:text-white">
                              {t('convertedSize')}: {formatBytes(item.result.convertedSize)}
                            </span>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              {/* Status Badge: RAM Banner */}
              <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-ruby/5 dark:bg-ruby/15 border border-ruby/20 text-center">
                <Cpu className="w-4 h-4 text-ruby shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-ruby">
                  {t('memoryBanner')}
                </span>
              </div>

              {/* Next Step Processing Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {!allDone && (
                  <button
                    type="button"
                    onClick={handleStartConversion}
                    disabled={isConvertingAll}
                    className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-ruby hover:bg-ruby-hover disabled:opacity-50 text-white text-lg font-black shadow-ruby-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>{isConvertingAll ? t('convertingButton') : t('convertButton')}</span>
                  </button>
                )}

                {allDone && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        queue.forEach((q) => {
                          if (q.result) handleDownload(q.result);
                        });
                      }}
                      className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-ruby hover:bg-ruby-hover text-white text-lg font-black shadow-ruby-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <Download className="w-5 h-5" />
                      <span>{queue.length > 1 ? t('downloadAll') : t('downloadFile')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-obsidian text-white hover:bg-neutral-900 border border-neutral-800 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{t('convertMore')}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ======================================================== */}
      {/* MEGA DROPDOWN FORMAT MODALS                              */}
      {/* ======================================================== */}
      <FormatSelectorMegaMenu
        isOpen={isFromModalOpen}
        onClose={() => setIsFromModalOpen(false)}
        onSelectFormat={(id) => {
          setFromFormat(id);
          const comp = getCompatibleTargets(id);
          if (comp.length > 0 && !comp.includes(toFormat)) {
            setToFormat(comp[0]);
          }
        }}
        selectedFormat={fromFormat}
        title={`${t('convertLabel')} (${t('allCategories')})`}
        currentLang={currentLang}
      />

      <FormatSelectorMegaMenu
        isOpen={isToModalOpen}
        onClose={() => setIsToModalOpen(false)}
        onSelectFormat={(id) => setToFormat(id)}
        selectedFormat={toFormat}
        allowedFormats={getCompatibleTargets(fromFormat)}
        title={`${t('toLabel')} (${fromFormat} → ...)`}
        currentLang={currentLang}
      />

    </div>
  );
};
