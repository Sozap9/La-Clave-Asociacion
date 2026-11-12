import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const SidebarSection = ({ id, title, icon: Icon, items, isOpen, onToggle }) => {
  const location = useLocation();

  // ¿Alguna ruta de este menú está activa?
  const isActiveSection = items.some((item) =>
    location.pathname.startsWith(item.path),
  );

  return (
    <div className="mb-2">
      {/* Cabecera del menú */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
          isActiveSection
            ? "bg-gray-800 text-white"
            : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon size={20} className="flex-shrink-0" />
          <span className="font-medium truncate">{title}</span>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Submenú plegable */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
        }`}
      >
        <div className="ml-4 space-y-1 border-l-2 border-gray-800 pl-2">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className="flex items-center gap-3 min-w-0">
                <item.icon size={16} className="flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SidebarSection;
