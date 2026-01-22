/**
 * Componente Loader - Spinner de carga
 */
const Loader = ({ size = 'md', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4'
  };

  const spinner = (
    <div className="flex items-center justify-center">
      <div 
        className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] bg-opacity-75 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Loader;