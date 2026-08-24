import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { am } from './am';

const STORAGE_KEY = 'stm_lang';

export const LANGUAGES = {
  en: { label: 'English', flag: '🇬🇧', dir: 'ltr' },
  am: { label: 'አማርኛ', flag: '🇪🇹', dir: 'ltr' },
};

export const DEFAULT_LANG = 'en';

function detectLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES[saved]) return saved;
  } catch {
    /* ignore */
  }
  const browser = (navigator.language || 'en').toLowerCase().slice(0, 2);
  return LANGUAGES[browser] ? browser : DEFAULT_LANG;
}

const initialLng = detectLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: {} },
    am: { translation: am },
  },
  lng: initialLng,
  fallbackLng: 'en',
  supportedLngs: ['en', 'am'],
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  interpolation: {
    escapeValue: false,
  },
  returnEmptyString: false,
  missingKeyHandler: (lng, ns, key) => {
    if (lng === 'en') return key;
    return key;
  },
});

function applyDocumentLang(lng) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
    document.documentElement.setAttribute('dir', LANGUAGES[lng].dir || 'ltr');
  }
}

applyDocumentLang(initialLng);

export function setLanguage(lng) {
  if (!LANGUAGES[lng]) return;
  i18n.changeLanguage(lng);
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
  applyDocumentLang(lng);
}

export { i18n };
export default i18n;
