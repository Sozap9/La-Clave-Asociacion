import { useState } from 'react';
import Button from '../components/common/Button';
import { NAV_ROUTES } from '../utils/constants';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    fecha_nacimiento: '',
    dni: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      // Preparar datos SIN confirmPassword
      const { confirmPassword, ...dataToSend } = formData;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register/basic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Guardar tokens si vienen
        if (data.data.accessToken) {
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
        }
        setTimeout(() => {
          window.location.href = NAV_ROUTES.HOME;
        }, 2000);
      } else {
        setError(data.message || 'Error al registrarse');
      }
    } catch (err) {
      console.error('Error en registro:', err);
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 relative overflow-hidden">
      {/* Fondo */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black z-10" />
        <img
          src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80"
          alt="Background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      {/* Contenido */}
      <div className="relative z-20 container-custom max-w-4xl">
        
        {/* Texto Explicativo */}
        <div className="text-center mb-12">
          <p className="text-gray-300 text-lg leading-relaxed max-w-3xl mx-auto">
            Únete a La Clave y disfruta de eventos exclusivos, descuentos y mucho más.
          </p>
          <p className="text-gray-400 mt-4 leading-relaxed max-w-3xl mx-auto">
            Regístrate como usuario básico de forma gratuita. Si quieres acceder a beneficios exclusivos, 
            podrás mejorar tu membresía a socio más adelante.
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-gradient-to-br from-primary-600/30 via-primary-700/20 to-primary-800/30 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-primary-500/20 max-w-xl mx-auto">
          
          <h2 className="text-3xl font-bold text-white text-center mb-8">Registro</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6">
              ¡Registro exitoso! Redirigiendo...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-gray-300 text-right">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input col-span-2"
                placeholder="usuario123"
                required
              />
            </div>

            {/* Nombre */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-gray-300 text-right">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="input col-span-2"
                required
              />
            </div>

            {/* Apellidos */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-gray-300 text-right">Apellidos</label>
              <input
                type="text"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                className="input col-span-2"
                required
              />
            </div>

            {/* Email */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-gray-300 text-right">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input col-span-2"
                required
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-gray-300 text-right">Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input col-span-2"
                minLength={8}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-gray-300 text-right">Confirmar</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input col-span-2"
                minLength={8}
                required
              />
            </div>

            {/* Teléfono */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-gray-300 text-right">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="input col-span-2"
                placeholder="600123456"
                required
              />
            </div>

            {/* Fecha Nacimiento */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-gray-300 text-right">Fecha Nac.</label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                className="input col-span-2"
                required
              />
            </div>

            {/* DNI (solo texto) */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-gray-300 text-right">DNI/NIE</label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                className="input col-span-2"
                placeholder="12345678A"
                maxLength={9}
                required
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Registrando...' : 'Registrarse'}
              </Button>
            </div>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-2 text-center">
            <p className="text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <a href={NAV_ROUTES.LOGIN} className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Inicia sesión aquí
              </a>
            </p>
            <p className="text-gray-400">
              ¿Quieres ser socio desde el inicio?{' '}
              <a href={NAV_ROUTES.REGISTER_SOCIO} className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Regístrate como socio
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;