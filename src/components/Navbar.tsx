import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Moon,
  Globe,
  Heart,
  DownloadCloud,
  ChevronDown,
  Layers,
  Check,
  Menu,
  X,
} from 'lucide-react';
import { languages, type SupportedLanguage, getLocalizedPath, useTranslations } from '../i18n/ui';
import { IosInstallModal } from './IosInstallModal';

interface NavbarProps {
  currentLang: SupportedLanguage;
}

export const Navbar: React.FC<NavbarProps> = ({ currentLang }) => {
  const t = useTranslations(currentLang);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [langMenuOpen, setLangMenuOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [mobileLangOpen, setMobileLangOpen] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIosModalOpen, setIsIosModalOpen] = useState<boolean>(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('bc_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  // Listen for PWA install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Close language menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile/tablet menu on resize to desktop (>= 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bc_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bc_theme', 'dark');
      setIsDark(true);
    }
  };

  const handleInstallClick = async () => {
    // Detect iOS Safari
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos && !isInstalled) {
      setIsIosModalOpen(true);
      return;
    }

    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setInstallPrompt(null);
      }
      return;
    }

    alert(t('offlineReady'));
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-alabaster/90 dark:bg-obsidian/90 border-b border-silver dark:border-obsidian-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* BRAND LOGO & TITLE */}
        <a
          href={getLocalizedPath(currentLang, currentLang)}
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-ruby rounded-xl p-1"
          aria-label={t('brand')}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="w-12 h-12 rounded-2xl bg-ruby flex items-center justify-center text-white shadow-ruby-sm group-hover:scale-105 transition-transform">
            <Layers className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-black tracking-tight text-obsidian dark:text-white flex items-center gap-1.5">
              Browser<span className="text-ruby">Convert</span>
            </span>
            <span className="hidden md:inline-block text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              {t('tagline')}
            </span>
          </div>
        </a>

        {/* ======================================================== */}
        {/* DESKTOP NAVBAR (>= 1024px)                               */}
        {/* ======================================================== */}
        <div className="hidden lg:flex items-center gap-3">
          
          {/* 8-Language Selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-silver dark:border-obsidian-border bg-white dark:bg-obsidian-card text-obsidian dark:text-neutral-200 hover:border-ruby transition-all text-sm font-semibold shadow-sm"
              aria-label={t('selectLanguage')}
              aria-expanded={langMenuOpen}
            >
              <Globe className="w-4 h-4 text-ruby" />
              <span>{languages[currentLang]}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-obsidian-card border border-silver dark:border-obsidian-border shadow-elevation-dark py-2 z-50">
                {(Object.keys(languages) as SupportedLanguage[]).map((langKey) => {
                  const isActive = langKey === currentLang;
                  return (
                    <a
                      key={langKey}
                      href={getLocalizedPath(currentLang, langKey)}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-ruby text-white font-bold'
                          : 'text-obsidian dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                      onClick={() => setLangMenuOpen(false)}
                    >
                      <span>{languages[langKey]}</span>
                      {isActive && <Check className="w-4 h-4 text-white" />}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2.5 rounded-xl border border-silver dark:border-obsidian-border bg-white dark:bg-obsidian-card text-obsidian dark:text-neutral-200 hover:border-ruby transition-all shadow-sm"
            aria-label={isDark ? t('lightMode') : t('darkMode')}
            title={isDark ? t('lightMode') : t('darkMode')}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-neutral-800" />
            )}
          </button>

          {/* Install PWA Button */}
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-silver dark:border-obsidian-border bg-white dark:bg-obsidian-card text-obsidian dark:text-neutral-200 hover:border-ruby transition-all text-sm font-semibold shadow-sm"
            aria-label={t('installApp')}
          >
            <DownloadCloud className="w-4 h-4 text-ruby" />
            <span>{isInstalled ? t('installed') : t('installApp')}</span>
          </button>

          {/* Support Developer */}
          <a
            href="https://kisharadilshan.gumroad.com/coffee"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-ruby hover:bg-ruby-hover text-white text-sm font-bold shadow-ruby-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            aria-label="Support the Developer"
          >
            <Heart className="w-4 h-4 fill-white animate-pulse" />
            <span>{t('supportDev')}</span>
          </a>
        </div>

        {/* ======================================================== */}
        {/* MOBILE & TABLET NAVBAR (< 1024px): SIMPLE TOGGLE ICON    */}
        {/* Keep it minimal, responsive and clean on phones & tabs   */}
        {/* ======================================================== */}
        <div className="flex lg:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white dark:bg-obsidian-card border border-silver dark:border-obsidian-border text-obsidian dark:text-white active:scale-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-ruby"
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-ruby" />
            ) : (
              <Menu className="w-6 h-6 text-obsidian dark:text-white" />
            )}
          </button>
        </div>

      </div>

      {/* ======================================================== */}
      {/* MOBILE & TABLET EXPANDABLE MENU DRAWER (< 1024px)        */}
      {/* ======================================================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-silver dark:border-obsidian-border bg-alabaster/95 dark:bg-obsidian-card/95 backdrop-blur-xl px-4 py-5 space-y-4 shadow-elevation-dark animate-fade-in transition-all">
          
          {/* Language Switcher in Mobile Drawer */}
          <div>
            <button
              onClick={() => setMobileLangOpen(!mobileLangOpen)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-obsidian-box border border-silver dark:border-obsidian-border text-obsidian dark:text-white text-sm font-bold"
              aria-expanded={mobileLangOpen}
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-5 h-5 text-ruby" />
                <span>{t('selectLanguage')}: <span className="text-ruby">{languages[currentLang]}</span></span>
              </div>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${mobileLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {mobileLangOpen && (
              <div className="mt-2 grid grid-cols-2 gap-2 p-2 rounded-2xl bg-white dark:bg-obsidian-box border border-silver dark:border-obsidian-border">
                {(Object.keys(languages) as SupportedLanguage[]).map((langKey) => (
                  <a
                    key={langKey}
                    href={getLocalizedPath(currentLang, langKey)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-colors ${
                      langKey === currentLang
                        ? 'bg-ruby text-white'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    onClick={() => {
                      setMobileLangOpen(false);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span>{languages[langKey]}</span>
                    {langKey === currentLang && <Check className="w-3.5 h-3.5" />}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle in Mobile Drawer */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-obsidian-box border border-silver dark:border-obsidian-border text-obsidian dark:text-white text-sm font-bold active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-neutral-800" />
              )}
              <span>{isDark ? t('lightMode') : t('darkMode')}</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-alabaster dark:bg-obsidian-pill text-neutral-500 font-bold">
              {isDark ? 'Dark' : 'Light'}
            </span>
          </button>

          {/* Add to Home Screen in Mobile Drawer */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleInstallClick();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-obsidian-box border border-silver dark:border-obsidian-border text-obsidian dark:text-white text-sm font-bold active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <DownloadCloud className="w-5 h-5 text-ruby" />
              <span>{isInstalled ? t('installed') : t('installApp')}</span>
            </div>
            <span className="text-xs font-semibold text-neutral-400">PWA</span>
          </button>

          {/* Support Developer in Mobile Drawer */}
          <a
            href="https://kisharadilshan.gumroad.com/coffee"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-ruby hover:bg-ruby-hover text-white text-sm font-bold shadow-ruby-sm active:scale-[0.99] transition-all"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Heart className="w-5 h-5 fill-white" />
            <span>{t('supportDev')}</span>
          </a>

        </div>
      )}

      <IosInstallModal
        isOpen={isIosModalOpen}
        onClose={() => setIsIosModalOpen(false)}
        currentLang={currentLang}
      />
    </header>
  );
};
