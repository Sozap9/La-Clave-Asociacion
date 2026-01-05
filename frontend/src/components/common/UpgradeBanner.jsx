import { useNavigate } from 'react-router-dom';
import { Sparkles, Check } from 'lucide-react';
import Button from './Button';

/**
 * Banner para incentivar a usuarios básicos a mejorar su cuenta
 */
const UpgradeBanner = () => {
  const navigate = useNavigate();

  const benefits = [
    'Acceso a todos los eventos',
    'Reservas prioritarias',
    'Galería exclusiva'
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600/20 to-primary-800/20 backdrop-blur-lg border border-primary-500/30 shadow-2xl">
      
      {/* Efecto de brillo animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      
      <div className="relative p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          
          {/* Contenido */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-primary-500/20 text-primary-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Sparkles size={16} />
              <span>OFERTA ESPECIAL</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              ¡Desbloquea Todo el Contenido!
            </h2>
            
            <p className="text-gray-300 text-lg mb-6">
              Conviértete en socio y disfruta de ventajas exclusivas por solo{' '}
              <span className="text-primary-400 font-bold text-2xl">10€/mes</span>
            </p>

            {/* Lista de beneficios */}
            <ul className="space-y-2 mb-6">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3 text-white">
                  <Check size={20} className="text-green-400 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                onClick={() => navigate('/mejorar-cuenta')}
                className="px-8 bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg hover:shadow-primary-500/50"
              >
                <Sparkles size={16} className="inline mr-2" />
                Mejorar mi Cuenta
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/perfil')}
              >
                Ver mi Perfil
              </Button>
            </div>
          </div>

          {/* Imagen/Icono decorativo */}
          <div className="hidden lg:block">
            <div className="w-48 h-48 bg-gradient-to-br from-primary-500/30 to-primary-700/30 rounded-full flex items-center justify-center shadow-glow">
              <Crown size={80} className="text-primary-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Importar Crown desde lucide-react
import { Crown } from 'lucide-react';

export default UpgradeBanner;
