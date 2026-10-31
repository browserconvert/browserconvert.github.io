import React from 'react';
import { POPULAR_CONVERSIONS, useTranslations, type SupportedLanguage } from '../i18n/ui';
import { ArrowRight, Sparkles, Film, Music, FileText, Image as ImageIcon } from 'lucide-react';

interface PopularConversionsProps {
  currentLang: SupportedLanguage;
}

export const PopularConversions: React.FC<PopularConversionsProps> = ({ currentLang }) => {
  const t = useTranslations(currentLang);

  const handleSelectConversion = (from: string, to: string) => {
    // Dispatch custom event to notify ConverterWorkspace
    const event = new CustomEvent('browserconvert:select-format', {
      detail: { from, to },
    });
    window.dispatchEvent(event);

    // Smooth scroll to top converter box
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'video':
        return <Film className="w-4 h-4 text-ruby" />;
      case 'audio':
        return <Music className="w-4 h-4 text-ruby" />;
      case 'document':
        return <FileText className="w-4 h-4 text-ruby" />;
      case 'image':
      default:
        return <ImageIcon className="w-4 h-4 text-ruby" />;
    }
  };

  return (
    <section
      id="popular-conversions"
      className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-alabaster dark:bg-obsidian border-t border-silver dark:border-obsidian-border transition-colors"
      aria-labelledby="popular-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ruby/10 text-ruby text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Conversion Hub</span>
          </div>
          <h2 id="popular-heading" className="text-2xl sm:text-3xl md:text-4xl font-black text-obsidian dark:text-white tracking-tight mb-3">
            {t('popularTitle')}
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            {t('popularSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_CONVERSIONS.map((item) => (
            <button
              key={`${item.from}-${item.to}`}
              type="button"
              onClick={() => handleSelectConversion(item.from, item.to)}
              className="p-4 rounded-2xl bg-white dark:bg-obsidian-card border border-silver dark:border-obsidian-border shadow-sm hover:border-ruby hover:shadow-ruby-sm hover:-translate-y-0.5 active:translate-y-0 transition-all text-left flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-ruby"
              aria-label={`Convert ${item.from} to ${item.to}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-alabaster dark:bg-obsidian-box border border-silver dark:border-obsidian-border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {getCategoryIcon(item.category)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-obsidian dark:text-white text-sm sm:text-base">
                    <span>{item.from}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-ruby" />
                    <span>{item.to}</span>
                  </div>
                  <span className="text-xs text-neutral-500 font-medium">
                    {item.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-ruby/10 text-ruby border border-ruby/20">
                  {item.badge}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
