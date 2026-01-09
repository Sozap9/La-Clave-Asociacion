import { Link } from 'react-router-dom';
import { MessageCircle, Music, Youtube, Facebook, Instagram } from 'lucide-react';
import { SOCIAL_LINKS, FOOTER_LINKS, APP_NAME } from '../../utils/constants';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialIcons = [
    { icon: MessageCircle, href: SOCIAL_LINKS.whatsapp, label: 'WhatsApp', color: 'hover:text-green-400' },
    { icon: Music, href: SOCIAL_LINKS.soundcloud, label: 'SoundCloud', color: 'hover:text-orange-400' },
    { icon: Youtube, href: SOCIAL_LINKS.youtube, label: 'YouTube', color: 'hover:text-red-500' },
    { icon: Facebook, href: SOCIAL_LINKS.facebook, label: 'Facebook', color: 'hover:text-blue-500' },
    { icon: Instagram, href: SOCIAL_LINKS.instagram, label: 'Instagram', color: 'hover:text-pink-500' }
  ];

  const footerLinks = [
    { label: 'Privacidad', href: FOOTER_LINKS.privacy },
    { label: 'Términos', href: FOOTER_LINKS.terms },
    { label: 'Estatutos', href: FOOTER_LINKS.statutes },
    { label: 'Ubicación', href: FOOTER_LINKS.location }
  ];

  return (
    <footer className="bg-[#0a0a0a] border-t border-[#262626] mt-auto">
      <div className="container-custom py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
            <div className="text-gray-400 text-sm">
              Idioma: <span className="text-white font-medium">Español</span>
            </div>
            <nav className="flex flex-wrap gap-4">
              {footerLinks.map((link) => (
                <Link key={link.href} to={link.href} className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {socialIcons.map((social) => {
              const Icon = social.icon;
              return (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className={`text-gray-400 ${social.color} transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg`} aria-label={social.label}>
                  <Icon size={20} />
                </a>
              );
            })}
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-[#262626]">
          <p className="text-gray-500 text-sm text-center">
            © {currentYear} {APP_NAME} todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;