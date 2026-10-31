import React from 'react';
import { X, Share, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTranslations, type SupportedLanguage } from '../i18n/ui';

interface IosInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
}

export const IosInstallModal: React.FC<IosInstallModalProps> = ({ isOpen, onClose, currentLang }) => {
  const t = useTranslations(currentLang);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-obsidian-card border border-silver dark:border-obsidian-border shadow-elevation-dark p-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-silver dark:border-obsidian-border mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-ruby text-white flex items-center justify-center shadow-ruby-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-obsidian dark:text-white">
                {t('iosInstallTitle')}
              </h3>
              <p className="text-xs text-neutral-500">100% Offline Progressive Web App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-obsidian dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6 text-sm text-neutral-700 dark:text-neutral-300">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-alabaster/60 dark:bg-obsidian-box border border-silver dark:border-obsidian-border">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
              <Share className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-obsidian dark:text-white">{t('iosInstallStep1')}</p>
              <p className="text-xs text-neutral-500">Look for the square icon with the upward arrow.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-alabaster/60 dark:bg-obsidian-box border border-silver dark:border-obsidian-border">
            <div className="w-8 h-8 rounded-xl bg-ruby/10 text-ruby flex items-center justify-center shrink-0 mt-0.5">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-obsidian dark:text-white">{t('iosInstallStep2')}</p>
              <p className="text-xs text-neutral-500">Add icon to your iOS home screen.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-alabaster/60 dark:bg-obsidian-box border border-silver dark:border-obsidian-border">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-obsidian dark:text-white">{t('iosInstallStep3')}</p>
              <p className="text-xs text-neutral-500">Works even in Airplane Mode with 0 data usage.</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-ruby hover:bg-ruby-hover text-white text-sm font-bold shadow-ruby-sm transition-all"
        >
          {t('iosInstallClose')}
        </button>
      </div>
    </div>
  );
};
