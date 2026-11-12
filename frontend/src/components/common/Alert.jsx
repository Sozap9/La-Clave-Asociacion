import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

// Aviso con cierre automático
const Alert = ({ 
  type = 'info', 
  message, 
  onClose, 
  autoCloseDelay = 5000,
  persistent = false 
}) => {
  
  // Se cierra solo salvo que sea persistente
  useEffect(() => {
    if (!persistent && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [onClose, autoCloseDelay, persistent]);

  const config = {
    success: {
      bg: 'bg-green-500/20',
      border: 'border-green-500',
      text: 'text-green-200',
      icon: CheckCircle
    },
    error: {
      bg: 'bg-red-500/20',
      border: 'border-red-500',
      text: 'text-red-200',
      icon: XCircle
    },
    warning: {
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500',
      text: 'text-yellow-200',
      icon: AlertCircle
    },
    info: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500',
      text: 'text-blue-200',
      icon: Info
    }
  };

  const { bg, border, text, icon: Icon } = config[type] || config.info;

  return (
    <div className={`${bg} border ${border} ${text} px-4 py-3 rounded-lg mb-6 flex items-start justify-between animate-fade-in`}>
      <div className="flex items-start gap-3 flex-1">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
      
      {onClose && (
        <button 
          onClick={onClose}
          className="ml-4 hover:opacity-70 transition-opacity flex-shrink-0"
          aria-label="Cerrar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
