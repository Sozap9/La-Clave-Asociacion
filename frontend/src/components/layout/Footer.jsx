import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { APP_NAME } from '../../utils/constants';
import { useLanguage } from '../../context/LanguageContext';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = LANGUAGES.find((l) => l.code === language);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <footer className="bg-[#0a0a0a] border-t border-[#262626] mt-auto">
      <div className="container-custom py-4">

        <div className="mt-6 pt-6 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Derechos */}
          <p className="text-gray-500 text-sm text-center sm:text-left">
            © {currentYear} {APP_NAME} {t('footer.rights')}
          </p>

          {/* Selector de idioma — mismo tamaño que los derechos */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-400 transition-colors duration-200"
            >
              <Globe size={12} />
              <span>{t('footer.language')}:</span>
              <span className="text-gray-400">{currentLang?.label}</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Desplegable */}
            {open && (
              <div className="absolute bottom-full right-0 mb-2 w-32 bg-[#111111] border border-[#262626] rounded-md shadow-lg overflow-hidden z-50">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors duration-150
                      ${language === lang.code
                        ? 'text-white bg-[#1a1a1a]'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-[#161616]'
                      }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;