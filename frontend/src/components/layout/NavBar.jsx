import { useState } from 'react';
import { Menu } from 'lucide-react';
import MobileMenu from './MobileMenu';
import KeyLogo from '../common/KeyLogo';
import { LaClaveWordmark } from '../common/BrandWordmark';
import { useLanguage } from '../../context/LanguageContext';

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <nav className="sticky top-0 z-30 bg-black border-b border-[#262626] backdrop-blur-sm bg-opacity-95">
        <div className="container-custom">
          <div className="relative flex items-center justify-between h-20">

            {/* Logo */}
            {/* La llave es un SVG blanco sin fondo: se funde con el navbar */}
            <button
              onClick={() => window.location.href = '/'}
              aria-label={t('nav.goHome')}
              className="text-white hover:text-primary-400 transition-colors p-1"
            >
              <KeyLogo className="h-10 w-auto" />
            </button>

            {/* Título */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <LaClaveWordmark className="h-[18px] sm:h-[22px] w-auto text-white" />
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

export default NavBar;