import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import Button from '../components/common/Button';

const UpgradeToSocio = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dni_cara_a: null,
    dni_cara_b: null
  });
  const navigate = useNavigate();

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        [field]: file
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.dni_cara_a || !formData.dni_cara_b) {
      alert('Debes subir ambas caras del DNI');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implementar llamada al backend
      // const formDataToSend = new FormData();
      // formDataToSend.append('dni_cara_a', formData.dni_cara_a);
      // formDataToSend.append('dni_cara_b', formData.dni_cara_b);
      
      // const response = await fetch(`${import.meta.env.VITE_API_URL}/users/upgrade-to-socio`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: formDataToSend
      // });

      // if (response.ok) {
      //   // Redirigir a Stripe checkout
      // }

      alert('Funcionalidad en desarrollo. Pronto podrás mejorar tu cuenta.');
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const beneficiosSocio = [
    'Acceso completo a todos los eventos',
    'Reservas prioritarias',
    'Galería de fotos exclusiva',
    'Descuentos en merchandising',
    'Invitaciones a eventos especiales',
    'Newsletter exclusiva'
  ];

  const comparacion = [
    { feature: 'Acceso a eventos', basico: false, socio: true },
    { feature: 'Reservar entradas', basico: false, socio: true },
    { feature: 'Galería de fotos', basico: false, socio: true },
    { feature: 'Eventos especiales', basico: false, socio: true },
    { feature: 'Descuentos', basico: false, socio: true },
    { feature: 'Newsletter', basico: false, socio: true },
  ];

  return (
    <div className="min-h-screen py-20 px-4 relative overflow-hidden">
      {/* Fondo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-gray-950 z-10" />
        <img
          src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80"
          alt="Background"
          className="w-full h-full object-cover opacity-30"
        />
      </div>

      {/* Contenido */}
      <div className="relative z-20 container-custom max-w-6xl">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Conviértete en Socio de La Clave
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Desbloquea acceso completo a eventos, galería y beneficios exclusivos por solo 10€/mes
          </p>
        </div>

        {/* Comparación de Planes */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Usuario Básico */}
          <div className="bg-[#0a0a0a]/50 backdrop-blur-lg rounded-2xl p-8 border border-[#262626]">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-400 mb-2">Usuario Básico</h3>
              <p className="text-4xl font-bold text-white">Gratis</p>
            </div>
            <ul className="space-y-3">
              {comparacion.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-gray-400">
                  <X size={20} className="text-red-400 flex-shrink-0" />
                  <span className="line-through">{item.feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Socio */}
          <div className="bg-gradient-to-br from-primary-600/30 via-primary-700/20 to-primary-800/30 backdrop-blur-lg rounded-2xl p-8 border-2 border-primary-500 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              RECOMENDADO
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Socio</h3>
              <p className="text-5xl font-bold text-primary-400 mb-1">10€</p>
              <p className="text-gray-300">/mes</p>
            </div>
            <ul className="space-y-3">
              {beneficiosSocio.map((beneficio, index) => (
                <li key={index} className="flex items-center gap-3 text-white">
                  <Check size={20} className="text-green-400 flex-shrink-0" />
                  <span>{beneficio}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Formulario de Upgrade */}
        <div className="bg-gradient-to-br from-primary-600/30 via-primary-700/20 to-primary-800/30 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-primary-500/20">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Comienza tu Membresía
          </h2>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
            {/* Paso 1: Subir DNI */}
            <div className="bg-[#0a0a0a]/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Paso 1: Verificación de Identidad
              </h3>
              <p className="text-gray-400 mb-6">
                Para cumplir con la normativa, necesitamos verificar tu identidad. 
                Por favor, sube ambas caras de tu DNI o NIE.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Cara A */}
                <div>
                  <label 
                    htmlFor="cara_a" 
                    className={`btn w-full cursor-pointer text-center block ${
                      formData.dni_cara_a ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {formData.dni_cara_a ? '✓ Cara A Cargada' : 'Subir Cara A'}
                  </label>
                  <input
                    type="file"
                    id="cara_a"
                    onChange={(e) => handleFileChange(e, 'dni_cara_a')}
                    accept="image/*"
                    className="hidden"
                    required
                  />
                  {formData.dni_cara_a && (
                    <p className="text-green-400 text-sm mt-2 text-center">
                      {formData.dni_cara_a.name}
                    </p>
                  )}
                </div>

                {/* Cara B */}
                <div>
                  <label 
                    htmlFor="cara_b" 
                    className={`btn w-full cursor-pointer text-center block ${
                      formData.dni_cara_b ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {formData.dni_cara_b ? '✓ Cara B Cargada' : 'Subir Cara B'}
                  </label>
                  <input
                    type="file"
                    id="cara_b"
                    onChange={(e) => handleFileChange(e, 'dni_cara_b')}
                    accept="image/*"
                    className="hidden"
                    required
                  />
                  {formData.dni_cara_b && (
                    <p className="text-green-400 text-sm mt-2 text-center">
                      {formData.dni_cara_b.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Paso 2: Pago */}
            <div className="bg-[#0a0a0a]/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Paso 2: Configurar Pago
              </h3>
              <p className="text-gray-400 mb-4">
                Serás redirigido a Stripe para configurar tu método de pago de forma segura.
              </p>
              <div className="flex items-center justify-center gap-4 text-gray-400">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" 
                     alt="Stripe" 
                     className="h-8 opacity-70" />
                <span>Pago 100% seguro</span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/perfil')}
                className="flex-1"
              >
                Volver al Perfil
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !formData.dni_cara_a || !formData.dni_cara_b}
                className="flex-1"
              >
                {loading ? 'Procesando...' : 'Continuar al Pago'}
              </Button>
            </div>

            <p className="text-gray-500 text-sm text-center mt-4">
              Al continuar, aceptas nuestros términos de servicio y política de privacidad.
              Puedes cancelar tu membresía en cualquier momento.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpgradeToSocio;
