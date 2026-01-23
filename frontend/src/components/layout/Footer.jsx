import { Link } from "react-router-dom";
import { AudioLines, Youtube, Instagram } from "lucide-react";
import { SOCIAL_LINKS, FOOTER_LINKS, APP_NAME } from "../../utils/constants";
import logo from "../../assets/logo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialIcons = [
    {
      icon: AudioLines,
      href: SOCIAL_LINKS.soundcloud,
      label: "SoundCloud",
      color: "hover:text-primary-500",
    },
    {
      icon: Instagram,
      href: SOCIAL_LINKS.instagram,
      label: "Instagram",
      color: "hover:text-primary-500",
    },
  ];

  const footerLinks = [
    { label: "Privacidad", href: FOOTER_LINKS.privacy },
    { label: "Términos", href: FOOTER_LINKS.terms },
    { label: "Estatutos", href: FOOTER_LINKS.statutes },
    { label: "Ubicación", href: FOOTER_LINKS.location },
  ];

  return (
    <footer className="bg-[#0a0a0a] border-t border-[#262626] mt-auto">
      <div className="container-custom py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
            {/* Enlaces del footer */}
            <nav className="flex flex-wrap gap-4">
              {footerLinks.map((link) => {
                const isExternal = link.href.startsWith("http");
                return isExternal ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-primary-400 text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-gray-400 hover:text-primary-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Iconos y logo */}
          <div className="flex items-center gap-6">
            {socialIcons.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-400 ${social.color} transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg`}
                  aria-label={social.label}
                >
                  <Icon size={20} />
                </a>
              );
            })}

            <div className="hidden sm:block">
              <img
                src={logo}
                alt="Logo"
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Derechos reservados */}
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
