import { useState } from 'react';
import { QrCode, CheckCircle, XCircle, Search } from 'lucide-react';
import Button from '../../components/common/Button';

const AdminVerifyQR = () => {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!codigo.trim()) {
      setError('Por favor ingresa un código de reserva');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/bookings/verify-qr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ codigo_reserva: codigo })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          success: true,
          booking: data.data || data.booking,
          message: data.message || '✅ Check-in realizado exitosamente'
        });
        setCodigo('');
      } else {
        setError(data.message || 'Código de reserva inválido o ya utilizado');
        setResult({ success: false });
      }
    } catch (err) {
      console.error('Error en verificación:', err);
      setError('Error de conexión con el servidor');
      setResult({ success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCodigo('');
    setResult(null);
    setError('');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-block p-4 bg-primary-500/20 rounded-full mb-4">
          <QrCode size={48} className="text-primary-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Verificar QR / Check-in</h1>
        <p className="text-gray-400">Escanea o ingresa el código de reserva para validar la entrada</p>
      </div>

      {/* Formulario de verificación */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-6">
          <form onSubmit={handleVerify} className="space-y-6">
            {/* Input de código */}
            <div>
              <label className="block text-white font-medium mb-2">
                Código de Reserva
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="Ej: BOOK-ABC123"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none font-mono text-lg"
                  autoFocus
                  disabled={loading}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
              <p className="text-gray-500 text-sm mt-2">
                Ingresa el código manualmente o usa un lector QR
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !codigo.trim()}
                className="flex-1"
              >
                {loading ? 'Verificando...' : 'Verificar y hacer Check-in'}
              </Button>
              {(result || error) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="px-6"
                >
                  Nuevo
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-6 mb-6 flex items-start gap-4">
            <XCircle className="text-red-400 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Error de Verificación</h3>
              <p className="text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Resultado exitoso */}
        {result?.success && result.booking && (
          <div className="bg-green-500/20 border border-green-500 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-6">
              <CheckCircle className="text-green-400 flex-shrink-0" size={32} />
              <div>
                <h3 className="text-green-400 font-semibold text-xl mb-1">
                  ¡Check-in Exitoso!
                </h3>
                <p className="text-green-200">{result.message}</p>
              </div>
            </div>

            {/* Detalles de la reserva */}
            <div className="bg-gray-900/50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Código de Reserva</p>
                  <p className="text-white font-mono font-semibold">
                    {result.booking.codigo_reserva}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Estado</p>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                    {result.booking.estado}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Evento</p>
                <p className="text-white text-lg font-semibold">
                  {result.booking.evento_titulo || 'Evento sin título'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Usuario</p>
                  <p className="text-white">
                    {result.booking.nombre && result.booking.apellidos
                      ? `${result.booking.nombre} ${result.booking.apellidos}`
                      : result.booking.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Número de Entradas</p>
                  <p className="text-white text-xl font-bold">
                    {result.booking.numero_entradas || 1}
                  </p>
                </div>
              </div>

              {result.booking.numero_socio && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">Número de Socio</p>
                  <p className="text-primary-400 font-semibold">
                    {result.booking.numero_socio}
                  </p>
                </div>
              )}

              {result.booking.fecha_asistencia && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">Hora de Check-in</p>
                  <p className="text-white">
                    {new Date(result.booking.fecha_asistencia).toLocaleString('es-ES')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">💡 Instrucciones</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary-400 font-bold">1.</span>
              <span>Pide al usuario que muestre su código QR o su código de reserva</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-400 font-bold">2.</span>
              <span>Escanea el QR con un lector o ingresa el código manualmente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-400 font-bold">3.</span>
              <span>El sistema validará la reserva y marcará la asistencia automáticamente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-400 font-bold">4.</span>
              <span>Verifica el número de entradas antes de permitir el acceso</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="max-w-2xl mx-auto mt-6 grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">Check-ins hoy</p>
          <p className="text-white text-2xl font-bold">-</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">Reservas confirmadas</p>
          <p className="text-white text-2xl font-bold">-</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm mb-1">Entradas totales</p>
          <p className="text-white text-2xl font-bold">-</p>
        </div>
      </div>
    </div>
  );
};

export default AdminVerifyQR;
