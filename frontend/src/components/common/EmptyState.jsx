// Estado vacío: icono fino, título, subtítulo y acción opcionales
// <EmptyState icon={Ticket} title="No tienes entradas" action={<Button …/>} />
const EmptyState = ({
  icon: Icon,
  title,
  subtitle,
  action,
  className = "",
}) => {
  return (
    <div className={`text-center py-16 ${className}`}>
      {Icon && (
        <Icon
          className="mx-auto mb-4 text-gray-700"
          size={44}
          strokeWidth={1}
        />
      )}

      <h3
        className={`text-lg font-light text-gray-400 uppercase tracking-widest ${
          subtitle ? "mb-2" : action ? "mb-6" : ""
        }`}
      >
        {title}
      </h3>

      {subtitle && (
        <p className={`text-gray-500 text-sm ${action ? "mb-6" : ""}`}>
          {subtitle}
        </p>
      )}

      {action}
    </div>
  );
};

export default EmptyState;