/**
 * EmptyState — estado vacío reutilizable en toda la app.
 *
 * Sigue el patrón visual usado originalmente en MisEntradas.jsx:
 * icono fino centrado (strokeWidth 1), título ligero en mayúsculas,
 * subtítulo opcional y acción opcional (botón, link...).
 *
 * Uso:
 *   <EmptyState
 *     icon={Ticket}
 *     title="No tienes entradas"
 *     subtitle="Reserva tu primera entrada para un evento"
 *   />
 *
 *   <EmptyState
 *     icon={Image}
 *     title="No hay álbumes disponibles"
 *     subtitle="Pronto subiremos nuevas fotos de nuestros eventos"
 *     action={<Button variant="primary" to="/eventos">Ver Eventos</Button>}
 *   />
 */
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