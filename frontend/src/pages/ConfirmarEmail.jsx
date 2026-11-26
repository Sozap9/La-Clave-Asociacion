import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, XCircle } from 'lucide-react';
import Button from '../components/common/Button';

const API_URL = import.meta.env.VITE_API_URL;

// Enlace del correo para confirmar un cambio de email: funciona sin sesión
const ConfirmarEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [estado, setEstado] = useState('cargando');
  const [mensaje, setMensaje] = useState('');
  // En desarrollo React monta dos veces: el token solo se envía una
  const enviado = useRef(false);

  useEffect(() => {
    if (enviado.current) return;
    enviado.current = true;

    if (!token) {
      setEstado('error');
      setMensaje('El enlace no es válido o ha caducado');
      return;
    }

    fetch(`${API_URL}/auth/confirmar-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((response) => response.json())
      .then((data) => {
        setEstado(data.success ? 'ok' : 'error');
        setMensaje(data.message || '');
        // El usuario guardado en el navegador aún tiene el email anterior
        if (data.success) {
          try {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          } catch {
            // Sin acceso al almacenamiento no hay nada que limpiar
          }
        }
      })
      .catch(() => {
        setEstado('error');
        setMensaje('Error de conexión. Inténtalo de nuevo.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-primary-600/30 via-primary-700/20 to-primary-800/30 backdrop-blur-lg rounded-2xl p-5 sm:p-8 shadow-2xl border border-primary-500/20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 border border-primary-500/30 mb-4">
            {estado === 'ok' && <CheckCircle size={28} className="text-green-400" />}
            {estado === 'error' && <XCircle size={28} className="text-red-400" />}
            {estado === 'cargando' && <Mail size={28} className="text-primary-400" />}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            {estado === 'ok' && 'Email confirmado'}
            {estado === 'error' && 'No se pudo confirmar'}
            {estado === 'cargando' && 'Confirmando...'}
          </h2>

          {mensaje && <p className="text-gray-300 text-sm mb-6">{mensaje}</p>}

          {estado === 'ok' && (
            <a href="/login">
              <Button variant="primary" className="w-full">Iniciar sesión</Button>
            </a>
          )}
          {estado === 'error' && (
            <a href="/perfil">
              <Button variant="primary" className="w-full">Ir a mi perfil</Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmarEmail;
