import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
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
      <div className="container-custom px-6">

        {/* ── Fila superior: idioma (izquierda) + links (derecha) ── */}
        <div className="flex flex-row items-center justify-between gap-3 py-4">

          {/* Selector de idioma */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors duration-200"
            >
              <Globe size={11} />
              <span>{t('footer.language')}:</span>
              <span className="text-gray-300">{currentLang?.label}</span>
              <ChevronDown
                size={11}
                className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>

            {open && (
              <div className="absolute bottom-full left-0 mb-2 w-32 bg-[#111111] border border-[#262626] rounded-md shadow-lg overflow-hidden z-50">
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

          {/* Links de navegación */}
          <nav className="flex items-center gap-4">
            <Link
              to="/estatutos"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors duration-200"
            >
              {t('footer.links.statutes')}
            </Link>
            <span className="text-gray-700 text-xs">·</span>
            <Link
              to="/contacto"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors duration-200"
            >
              {t('footer.links.contact')}
            </Link>
          </nav>
        </div>

        {/* ── Separador ── */}
        <div className="border-t border-[#262626]" />

        {/* ── Fila inferior: copyright ── */}
        <div className="py-4 flex items-center justify-center">
          <p className="text-gray-600 text-xs">
            © {currentYear} {APP_NAME} — {t('footer.rights')}
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;