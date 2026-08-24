import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Check } from 'lucide-react';
import { LANGUAGES, setLanguage } from '../i18n';

export function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = i18n.resolvedLanguage || i18n.language;

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const btn = compact
    ? 'flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-400'
    : 'inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-400';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Language"
        title={LANGUAGES[current]?.label || 'English'}
        className={btn}
      >
        <Languages className="h-4 w-4" />
        {!compact && <span>{LANGUAGES[current]?.label || 'English'}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          {Object.entries(LANGUAGES).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => {
                setLanguage(code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition hover:bg-brand-50 dark:hover:bg-brand-500/10 ${
                code === current ? 'font-semibold text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="flex-1 text-left">{lang.label}</span>
              {code === current && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
