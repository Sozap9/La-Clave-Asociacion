import { useState } from 'react';
import { Menu } from 'lucide-react';
import Logo from '../common/Logo';
import MobileMenu from './MobileMenu';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-30 bg-black border-b border-[#262626] backdrop-blur-sm bg-opacity-95">
        <div className="container-custom">
          <div className="relative flex items-center justify-between h-20">
            {/* Logo a la izquierda */}
            <Logo />

            {/* Texto "La Clave" centrado */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <span className="text-2xl font-display text-white">
                La Clave
              </span>
            </div>

            {/* Botón hamburguesa a la derecha */}
            <button
              onClick={() => setMenuOpen(true)}
              className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
              aria-label="Abrir menú"
            >
              <Menu size={28} />
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