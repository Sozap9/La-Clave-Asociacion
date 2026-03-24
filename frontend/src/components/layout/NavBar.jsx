import { useState } from 'react';
import { Menu } from 'lucide-react';
import MobileMenu from './MobileMenu';
import logo from '../../assets/laclavelogo.png';
import { useLanguage } from '../../context/LanguageContext';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <nav className="sticky top-0 z-30 bg-black border-b border-[#262626] backdrop-blur-sm bg-opacity-95">
        <div className="container-custom">
          <div className="relative flex items-center justify-between h-20">

            {/* Logo */}
            <button
              onClick={() => window.location.href = '/'}
              aria-label={t('nav.goHome')}
            >
              <img
                src={logo}
                alt="Logo"
                className="w-12 h-12 rounded-full object-cover"
              />
            </button>

            {/* Título */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <span className="text-2xl font-display text-white">
                La Clave 981
              </span>
            </div>

            {/* Menú hamburguesa */}
            <button
              onClick={() => setMenuOpen(true)}
              className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
              aria-label={t('nav.openMenu')}
            >
              <Menu size={30} />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );
};

export default Navbar;