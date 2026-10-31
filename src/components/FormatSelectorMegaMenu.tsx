import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Film, Music, Image as ImageIcon, FileText, Table, Check } from 'lucide-react';
import { SUPPORTED_FORMATS, CATEGORIES, type FormatCategory } from '../lib/converter/formats';
import { useTranslations, type SupportedLanguage } from '../i18n/ui';

interface FormatSelectorMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFormat: (formatId: string) => void;
  selectedFormat: string;
  allowedFormats?: string[];
  title: string;
  currentLang: SupportedLanguage;
}

export const FormatSelectorMegaMenu: React.FC<FormatSelectorMegaMenuProps> = ({
  isOpen,
  onClose,
  onSelectFormat,
  selectedFormat,
  allowedFormats,
  title,
  currentLang,
}) => {
  const t = useTranslations(currentLang);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
      setActiveCategory('ALL');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Filter visible categories based on allowedFormats
  const visibleCategories = useMemo(() => {
    if (!allowedFormats || allowedFormats.length === 0) {
      return CATEGORIES;
    }
    const allowedSet = new Set(
      allowedFormats
        .map((id) => SUPPORTED_FORMATS[id]?.category)
        .filter(Boolean)
    );
    return CATEGORIES.filter((cat) => allowedSet.has(cat));
  }, [allowedFormats]);

  // Reset category if selected category is not in visible categories
  useEffect(() => {
    if (activeCategory !== 'ALL' && !visibleCategories.includes(activeCategory as FormatCategory)) {
      setActiveCategory('ALL');
    }
  }, [visibleCategories, activeCategory]);

  // Filter formats
  const filteredFormats = useMemo(() => {
    return Object.values(SUPPORTED_FORMATS).filter((item) => {
      // Check if restricted by allowedFormats
      if (allowedFormats && allowedFormats.length > 0 && !allowedFormats.includes(item.id)) {
        return false;
      }
      // Check category
      if (activeCategory !== 'ALL' && item.category !== activeCategory) {
        return false;
      }
      // Check search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (
          item.id.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.extension.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [activeCategory, searchTerm, allowedFormats]);

  if (!isOpen) return null;

  const categoryIcons: Record<string, React.ReactNode> = {
    Video: <Film className="w-4 h-4" />,
    Audio: <Music className="w-4 h-4" />,
    Image: <ImageIcon className="w-4 h-4" />,
    Document: <FileText className="w-4 h-4" />,
    Spreadsheet: <Table className="w-4 h-4" />,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl bg-white dark:bg-obsidian-card border border-silver dark:border-obsidian-border shadow-elevation-dark overflow-hidden transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header & Search */}
        <div className="p-4 sm:p-6 border-b border-silver dark:border-obsidian-border bg-neutral-50/50 dark:bg-obsidian-box">
          <div className="flex items-center justify-between mb-4">
            <h2 id="modal-title" className="text-xl font-black text-obsidian dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-500 hover:text-obsidian dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchFormat')}
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-silver dark:border-obsidian-border bg-white dark:bg-obsidian text-obsidian dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-ruby text-base font-medium shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body: Sidebar Categories + Grid */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-[300px]">
          
          {/* Categories Sidebar */}
          <div className="w-full sm:w-56 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-silver dark:border-obsidian-border bg-neutral-50/30 dark:bg-obsidian-card/40 flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-y-auto shrink-0">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                activeCategory === 'ALL'
                  ? 'bg-ruby text-white shadow-ruby-sm'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
              }`}
            >
              <span>{t('allCategories')}</span>
            </button>

            {visibleCategories.map((cat) => {
              const catKeyMap: Record<FormatCategory, string> = {
                Video: t('video'),
                Audio: t('audio'),
                Image: t('image'),
                Document: t('document'),
                Spreadsheet: t('spreadsheet'),
              };
              const isCatActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                    isCatActive
                      ? 'bg-ruby text-white shadow-ruby-sm'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                  }`}
                >
                  {categoryIcons[cat]}
                  <span>{catKeyMap[cat] || cat}</span>
                </button>
              );
            })}
          </div>

          {/* Formats Grid */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {filteredFormats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-400">
                <Search className="w-12 h-12 mb-3 text-neutral-300 dark:text-neutral-600" />
                <p className="text-base font-semibold">No matching formats found</p>
                <p className="text-sm">Try searching for MP4, PDF, PNG, WAV or CSV</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredFormats.map((fmt) => {
                  const isSelected = fmt.id === selectedFormat;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => {
                        onSelectFormat(fmt.id);
                        onClose();
                      }}
                      className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-ruby bg-ruby/10 dark:bg-ruby/20 ring-2 ring-ruby shadow-ruby-sm'
                          : 'border-silver dark:border-obsidian-border bg-white dark:bg-obsidian-box hover:border-ruby hover:scale-[1.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg font-black tracking-wide text-obsidian dark:text-white">
                          {fmt.id}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-ruby text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate">
                        {fmt.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
