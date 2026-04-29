import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const AdminCard = ({
  image,
  imageAlt,
  imageSize = "md",
  avatar,
  title,
  subtitle,
  badges = [],
  actions = [],
  children,
  fields = [],
  columns = 0,
  highlight = false,
  expandable = false,
  defaultExpanded = false,
  className = "",
  onClick,
  onExpand,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpand?.(newState);
  };

  const imageSizeClasses = {
    sm: "w-16 h-16",
    md: "w-32 h-32",
    lg: "w-48 h-48",
  };

  const badgeColors = {
    green: "bg-green-500/20 text-green-300 border border-green-500/30",
    blue: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    red: "bg-red-500/20 text-red-300 border border-red-500/30",
    yellow: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    purple: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
    primary: "bg-primary-500/20 text-primary-300 border border-primary-500/30",
    gray: "bg-gray-500/20 text-gray-300 border border-gray-500/30",
  };

  const actionColors = {
    primary: "text-primary-300 hover:bg-primary-500/20",
    green: "text-green-400 hover:bg-green-500/20",
    red: "text-red-400 hover:bg-red-500/20",
    blue: "text-blue-400 hover:bg-blue-500/20",
    gray: "text-gray-400 hover:bg-gray-500/20",
  };

  return (
    <div
      className={`
        bg-[#1a1a1a]
        border border-[#262626]
        rounded-xl
        p-5 md:p-6
        transition-all
        hover:border-primary-500/50
        ${highlight ? "ring-1 ring-primary-500/20 border-primary-500/50" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Layout principal */}
      <div className="flex flex-col md:flex-row gap-5">
        {/* Imagen / Avatar */}
        {(image || avatar) && (
          <div className="flex-shrink-0 self-start">
            {image ? (
              <img
                src={image}
                alt={imageAlt || title}
                className={`${imageSizeClasses[imageSize]} rounded-lg object-cover`}
              />
            ) : (
              avatar
            )}
          </div>
        )}

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-4">
            {/* Título */}
            <div className="flex-1 min-w-0">
              {title && (
                <div className="flex flex-wrap items-center gap-4 mb-1">
                  <h3 className="text-lg md:text-xl font-bold text-white">
                    {title}
                  </h3>

                  {badges.map((badge, i) => (
                    <span
                      key={i}
                      className={`
                        inline-flex items-center gap-1
                        px-1.5 py-0.5 text-xs font-medium rounded-full
                        ${badge.color ? badgeColors[badge.color] : badgeColors.gray}
                      `}
                    >
                      {badge.icon && (
                        <span className="flex-shrink-0">{badge.icon}</span>
                      )}
                      <span>{badge.text}</span>
                    </span>
                  ))}
                </div>
              )}

              {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
            </div>

            {/* Acciones */}
            {actions.length > 0 && (
              <div
                className="
                  flex flex-col gap-2
                  md:items-end
                "
              >
                {/* Botones de acción + selector de rol en la misma fila */}
                <div className="flex items-center gap-2 justify-start md:justify-end flex-wrap">
                  {actions
                    .filter((a) => a.type !== "role")
                    .map((action, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick?.(e);
                        }}
                        disabled={action.disabled}
                        className={`
                          p-2 rounded-lg transition-colors
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${action.color ? actionColors[action.color] : actionColors.gray}
                        `}
                        title={action.title}
                      >
                        {action.icon}
                      </button>
                    ))}

                  {/* Selector de rol — inline con los iconos */}
                  {actions.filter((a) => a.type === "role").map((action, i) => (
                    <div key={i} onClick={(e) => e.stopPropagation()}>
                      {action.element}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fields */}
          {fields.length > 0 && (
            <div
              className={`
                grid grid-cols-2
                ${columns === 3 ? "md:grid-cols-3" : ""}
                ${columns === 4 ? "md:grid-cols-4" : ""}
                ${columns === 5 ? "md:grid-cols-5" : ""}
                ${columns > 5 ? `md:grid-cols-${columns}` : ""}
                mb-2
              `}
            >
              {fields.map((field, i) => (
                <div key={i} className="min-w-0">
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                    {field.icon && (
                      <span className="flex-shrink-0">{field.icon}</span>
                    )}
                    <span className="truncate">{field.label}</span>
                  </p>

                  {field.badge ? (
                    <span
                      className={`
                        inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full
                        ${field.badgeColor ? badgeColors[field.badgeColor] : badgeColors.gray}
                      `}
                    >
                      {field.value}
                    </span>
                  ) : (
                    <p className="text-white text-sm font-medium truncate">
                      {field.value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {children}
        </div>
      </div>

      {/* Expand */}
      {expandable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          className="
            mt-4 w-full flex items-center justify-center gap-2
            text-sm text-gray-400 hover:text-primary-300
          "
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {isExpanded ? "Ver menos" : "Ver más"}
        </button>
      )}
    </div>
  );
};

export default AdminCard;
