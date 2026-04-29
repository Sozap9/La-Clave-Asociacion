import { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, CheckCircle, ArrowLeft, KeyRound } from 'lucide-react';
import Button from '../components/common/Button';

const API_URL = import.meta.env.VITE_API_URL;

// ─── Paso 1: Solicitar email ──────────────────────────────────────────────────
const ForgotStep = ({ onSuccess }) => {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(email);
      } else {
        setError(data.message || 'Error al enviar el email');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 border border-primary-500/30 mb-4">
          <Mail size={28} className="text-primary-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Recuperar contraseña</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-5 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="tu@email.com"
            required
            autoFocus
          />
        </div>

        <Button type="submit" variant="primary" disabled={loading} className="w-full">
          {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <a href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft size={14} />
          Volver al inicio de sesión
        </a>
      </div>
    </>
  );
};

// ─── Confirmación de email enviado ───────────────────────────────────────────
const EmailSentStep = ({ email }) => (
  <>
    <div className="mb-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 mb-4">
        <CheckCircle size={28} className="text-green-400" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Email enviado</h2>
      <p className="text-gray-400 text-sm leading-relaxed">
        Si <span className="text-white font-medium">{email}</span> está registrado,
        recibirás un enlace para restablecer tu contraseña en los próximos minutos.
      </p>
    </div>

    <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 mb-6 text-sm text-gray-400 space-y-2">
      <p>• Revisa también la carpeta de spam.</p>
      <p>• El enlace expira en <span className="text-white">1 hora</span>.</p>
      <p>• Si no recibes nada, verifica que el email sea correcto.</p>
    </div>

    <div className="text-center">
      <a href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft size={14} />
        Volver al inicio de sesión
      </a>
    </div>
  </>
);

// ─── Paso 2: Nueva contraseña (llega con ?token=xxx en la URL) ────────────────
const ResetStep = ({ token }) => {
  const [password, setPassword]         = useState('');
  const [confirm, setConfirm]           = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState(false);

  // Validaciones en tiempo real
  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    match:     password.length > 0 && password === confirm,
  };
  const allValid = Object.values(checks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allValid) {
      setError('Por favor cumple todos los requisitos de contraseña.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Error al cambiar la contraseña');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 mb-4">
            <CheckCircle size={28} className="text-green-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Contraseña actualizada</h2>
          <p className="text-gray-400 text-sm">
            Tu contraseña se ha cambiado correctamente. Ya puedes iniciar sesión.
          </p>
        </div>
        <a href="/login">
          <Button variant="primary" className="w-full">Ir al inicio de sesión</Button>
        </a>
      </>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 border border-primary-500/30 mb-4">
          <KeyRound size={28} className="text-primary-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Nueva contraseña</h2>
        <p className="text-gray-400 text-sm">Elige una contraseña segura para tu cuenta.</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-5 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nueva contraseña */}
        <div>
          <label className="label">Nueva contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pr-11"
              placeholder="Mínimo 8 caracteres"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div>
          <label className="label">Confirmar contraseña</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input pr-11"
              placeholder="Repite la contraseña"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Checklist de requisitos */}
        {password.length > 0 && (
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 space-y-2">
            {[
              { key: 'length',    label: 'Mínimo 8 caracteres' },
              { key: 'uppercase', label: 'Al menos una mayúscula' },
              { key: 'lowercase', label: 'Al menos una minúscula' },
              { key: 'number',    label: 'Al menos un número' },
              { key: 'match',     label: 'Las contraseñas coinciden' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className={checks[key] ? 'text-green-400' : 'text-gray-600'}>
                  {checks[key] ? '✓' : '○'}
                </span>
                <span className={checks[key] ? 'text-gray-300' : 'text-gray-500'}>{label}</span>
              </div>
            ))}
          </div>
        )}

        <Button type="submit" variant="primary" disabled={loading || !allValid} className="w-full">
          {loading ? 'Guardando...' : 'Cambiar contraseña'}
        </Button>
      </form>
    </>
  );
};

// ─── Token inválido / expirado ────────────────────────────────────────────────
const InvalidToken = () => (
  <>
    <div className="mb-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 mb-4">
        <Lock size={28} className="text-red-400" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Enlace inválido</h2>
      <p className="text-gray-400 text-sm leading-relaxed">
        Este enlace de recuperación no es válido o ha expirado. Los enlaces tienen una validez de 1 hora.
      </p>
    </div>
    <a href="/recuperar-password">
      <Button variant="primary" className="w-full">Solicitar nuevo enlace</Button>
    </a>
    <div className="mt-4 text-center">
      <a href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft size={14} />
        Volver al inicio de sesión
      </a>
    </div>
  </>
);

// ─── Componente principal ─────────────────────────────────────────────────────
const RecuperarPassword = () => {
  const [step, setStep]         = useState('forgot'); // forgot | sent | reset | invalid
  const [sentEmail, setSentEmail] = useState('');

  // Detectar si venimos con ?token=xxx en la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');

    if (token) {
      // Verificar rápidamente que el token no está vacío
      if (token.length < 10) {
        setStep('invalid');
      } else {
        setStep('reset');
      }
    }
  }, []);

  const handleForgotSuccess = (email) => {
    setSentEmail(email);
    setStep('sent');
  };

  const token = new URLSearchParams(window.location.search).get('token');

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 relative overflow-hidden">
      {/* Fondo */}
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
          {step === 'forgot'  && <ForgotStep onSuccess={handleForgotSuccess} />}
          {step === 'sent'    && <EmailSentStep email={sentEmail} />}
          {step === 'reset'   && <ResetStep token={token} />}
          {step === 'invalid' && <InvalidToken />}
        </div>
      </div>
    </div>
  );
};

export default RecuperarPassword;