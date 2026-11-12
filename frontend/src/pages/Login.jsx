import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { NAV_ROUTES } from '../utils/constants';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Motivo de la redirección (sesión caducada o token inválido)
  useEffect(() => {
    const authMessage = sessionStorage.getItem('authMessage');
    if (authMessage) {
      setError(authMessage);
      sessionStorage.removeItem('authMessage');
    }
  }, []);

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

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        if (!data.data?.accessToken) {
          console.error('ERROR: NO HAY TOKEN EN LA RESPUESTA');
          setError('Error: No se recibió token');
          return;
        }

        login(data.data.user, data.data.accessToken);

        const savedToken = localStorage.getItem('token');

        if (!savedToken) {
          console.error('ERROR: Token NO se guardó en localStorage');
          alert('Error: No se pudo guardar la sesión');
          return;
        }

        window.location.href = data.data.user.role === 'admin' ? NAV_ROUTES.ADMIN : NAV_ROUTES.DASHBOARD;
      } else {
        console.error('Login fallido:', data.message);
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('ERROR EN CATCH:', err);
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black z-10" />
        <img
          src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80"
          alt="Background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      <div className="relative z-20 w-full max-w-md">
        <div className="bg-gradient-to-br from-primary-600/30 via-primary-700/20 to-primary-800/30 backdrop-blur-lg rounded-2xl p-5 sm:p-8 shadow-2xl border border-primary-500/20">

          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">{t('login.title')}</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">{t('login.email')}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">{t('login.password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input w-full pr-11"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-primary-400 transition-colors"
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <a href="/recuperar-password" className="text-sm text-white hover:text-primary-400 transition-colors">
                {t('login.forgotPassword')}
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full"
            >
              {loading ? t('login.loading') : t('login.submit')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {t('login.noAccount')}{' '}
              <a href={NAV_ROUTES.REGISTER} className="text-white hover:text-primary-400 font-medium transition-colors">
                {t('login.registerLink')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;