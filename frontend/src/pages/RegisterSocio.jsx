import { useState } from 'react';
import Button from '../components/common/Button';
import { NAV_ROUTES } from '../utils/constants';

const RegisterSocio = () => {
  const [formData, setFormData] = useState({
    // Datos básicos
    username: '',
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    fecha_nacimiento: '',
    dni: '', // DNI como texto (12345678A)
    
    // Archivos DNI (solo para socios)
    dni_cara_a: null,
    dni_cara_b: null,
    
    // Stripe/Pago se manejará por separado
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
    setError('');
    setLoading(true);

    // Validar contraseñas
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    // Validar que se hayan subido ambas caras del DNI
    if (!formData.dni_cara_a || !formData.dni_cara_b) {
      setError('Debes subir ambas caras del DNI');
      setLoading(false);
      return;
    }

    try {
      // Crear FormData porque incluye archivos
      const formDataToSend = new FormData();
      
      // Añadir campos de texto
      formDataToSend.append('username', formData.username);
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('apellidos', formData.apellidos);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('telefono', formData.telefono);
      formDataToSend.append('fecha_nacimiento', formData.fecha_nacimiento);
      formDataToSend.append('dni', formData.dni);
      
      // Añadir archivos
      formDataToSend.append('dni_cara_a', formData.dni_cara_a);
      formDataToSend.append('dni_cara_b', formData.dni_cara_b);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register/socio`, {
        method: 'POST',
        body: formDataToSend
        // NO enviar Content-Type, el navegador lo añade automáticamente con boundary para FormData
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        
        // Si el backend devuelve tokens, guardarlos
        if (data.data.accessToken) {
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
        }
        
        // Si hay que ir a Stripe, redirigir
        if (data.data.stripeCheckoutUrl) {
          window.location.href = data.data.stripeCheckoutUrl;
        } else {
          // Si no hay Stripe, ir al home
          setTimeout(() => {
            window.location.href = NAV_ROUTES.HOME;
          }, 2000);
        }
      } else {
        setError(data.message || 'Error al registrarse como socio');
      }
    } catch (err) {
      console.error('Error en registro socio:', err);
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="relative z-20 container-custom max-w-5xl">
        
        {/* Texto Explicativo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-4">Registro de Socio</h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-3xl mx-auto">
            Conviértete en socio de La Clave y disfruta de ventajas exclusivas: acceso prioritario a eventos, 
            descuentos especiales, y mucho más.
          </p>
          <p className="text-primary-400 mt-4 text-xl font-semibold">
            Cuota mensual: {import.meta.env.VITE_CUOTA_MENSUAL || '10'}€/mes
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-gradient-to-br from-primary-600/30 via-primary-700/20 to-primary-800/30 backdrop-blur-lg rounded-2xl p-10 shadow-2xl border border-primary-500/20">
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6">
              ¡Registro exitoso! Procesando pago...
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-x-12 gap-y-6">
            {/* Columna Izquierda - Datos Personales */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4 border-b border-primary-500/30 pb-2">
                Datos Personales
              </h3>

              {/* Username */}
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input"
                  placeholder="usuario123"
                  required
                />
              </div>

              {/* Nombre */}
              <div>
                <label className="label">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              {/* Apellidos */}
              <div>
                <label className="label">Apellidos</label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="label">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input"
                  minLength={8}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label">Confirmar Contraseña</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input"
                  minLength={8}
                  required
                />
              </div>
            </div>

            {/* Columna Derecha - Contacto y Documentación */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4 border-b border-primary-500/30 pb-2">
                Contacto y Documentación
              </h3>

              {/* Teléfono */}
              <div>
                <label className="label">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="input"
                  placeholder="600123456"
                  required
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="label">Fecha de Nacimiento</label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              {/* DNI Texto */}
              <div>
                <label className="label">DNI / NIE</label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  className="input"
                  placeholder="12345678A"
                  maxLength={9}
                  required
                />
              </div>

              {/* DNI Archivos */}
              <div>
                <label className="label mb-3">Cargar DNI (ambas caras)</label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Cara A */}
                  <div>
                    <label 
                      htmlFor="cara_a" 
                      className="btn btn-secondary w-full cursor-pointer text-center block"
                    >
                      {formData.dni_cara_a ? '✓ Cara A' : 'Cara A'}
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
                      <p className="text-green-400 text-xs mt-1 text-center">
                        {formData.dni_cara_a.name}
                      </p>
                    )}
                  </div>

                  {/* Cara B */}
                  <div>
                    <label 
                      htmlFor="cara_b" 
                      className="btn btn-secondary w-full cursor-pointer text-center block"
                    >
                      {formData.dni_cara_b ? '✓ Cara B' : 'Cara B'}
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
                      <p className="text-green-400 text-xs mt-1 text-center">
                        {formData.dni_cara_b.name}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-gray-400 text-xs mt-2">
                  * Es obligatorio cargar ambas caras del DNI para el registro como socio
                </p>
              </div>

              {/* Información de pago */}
              <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                <p className="text-gray-300 text-sm">
                  <span className="font-semibold text-white">💳 Pago seguro:</span> Después de completar 
                  el registro, serás redirigido a Stripe para configurar tu método de pago de forma segura.
                </p>
              </div>
            </div>

            {/* Submit Button - Full Width */}
            <div className="md:col-span-2 pt-6">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full max-w-md mx-auto block"
              >
                {loading ? 'Procesando...' : 'Continuar al pago'}
              </Button>
            </div>
          </form>

          {/* Links */}
          <div className="mt-8 space-y-2 text-center">
            <p className="text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <a href={NAV_ROUTES.LOGIN} className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Inicia sesión aquí
              </a>
            </p>
            <p className="text-gray-400">
              ¿Solo quieres registrarte como usuario básico?{' '}
              <a href={NAV_ROUTES.REGISTER} className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Registro gratuito
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterSocio;
