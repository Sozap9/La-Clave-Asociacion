import { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle, XCircle, Search, Camera, CameraOff } from 'lucide-react';
import Button from '../../components/common/Button';
import { Html5Qrcode } from 'html5-qrcode';

const API_URL = import.meta.env.VITE_API_URL;

const AdminVerifyQR = () => {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  // Limpiar escáner al desmontar
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setScannerError('');
    setScannerActive(true);

    // Esperar a que el div esté en el DOM
    setTimeout(async () => {
      try {
        html5QrRef.current = new Html5Qrcode('qr-reader');

        // Guard para evitar que el callback se dispare múltiples veces
        let yaEscaneado = false;

        const onQRSuccess = (decodedText) => {
          if (yaEscaneado) return;
          yaEscaneado = true;

          // Extraer el código: el QR puede ser JSON o texto plano
          let codigoExtraido = decodedText.trim();
          try {
            const parsed = JSON.parse(decodedText);
            if (parsed.codigo) codigoExtraido = parsed.codigo.trim();
          } catch {
            // No es JSON, usar el texto directamente
          }

          // Detener el escáner de forma diferida para no interrumpir el callback
          setTimeout(() => stopScanner(), 0);

          setCodigo(codigoExtraido);
          handleVerifyCode(codigoExtraido);
        };

        const scanConfig = { fps: 10, qrbox: { width: 250, height: 250 } };

        // Intentar con cámara trasera (móviles).
        // En webcams de PC, 'environment' puede no estar disponible — fallback a primera cámara disponible.
        try {
          await html5QrRef.current.start(
            { facingMode: 'environment' },
            scanConfig,
            onQRSuccess,
            () => {} // Ignorar errores de frame individuales
          );
        } catch {
          // Fallback: listar cámaras y usar la primera disponible (webcam de PC)
          const cameras = await Html5Qrcode.getCameras();
          if (!cameras || cameras.length === 0) {
            throw new Error('No se encontró ninguna cámara disponible');
          }
          await html5QrRef.current.start(
            cameras[0].id,
            scanConfig,
            onQRSuccess,
            () => {}
          );
        }
      } catch (err) {
        setScannerError('No se pudo acceder a la cámara. Verifica los permisos.');
        setScannerActive(false);
        console.error('Error iniciando escáner:', err);
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
      } catch {
        // Ignorar errores al parar
      }
      html5QrRef.current = null;
    }
    setScannerActive(false);
  };

  const handleVerifyCode = async (codigoAVerificar) => {
    const cod = codigoAVerificar || codigo;
    if (!cod.trim()) {
      setError('Por favor ingresa un código de reserva');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/bookings/verify-qr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ codigo_reserva: cod.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          booking: data.data || data.booking,
          message: data.message || 'Check-in realizado exitosamente'
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

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerifyCode();
  };

  const handleReset = () => {
    setCodigo('');
    setResult(null);
    setError('');
  };

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-block p-4 bg-primary-500/20 rounded-full mb-4">
          <QrCode size={48} className="text-primary-300" />
        </div>
        <h1 className="text-gradient mb-2 text-2xl md:text-4xl">Verificar QR / Check-in</h1>
        <p className="text-gray-400 text-sm md:text-lg">Escanea o ingresa el código de reserva para validar la entrada</p>
      </div>

      <div className="max-w-2xl mx-auto">

        {/* Botón escáner de cámara */}
        <div className="mb-4 flex justify-center">
          {!scannerActive ? (
            <button
              type="button"
              onClick={startScanner}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              <Camera size={20} />
              Escanear
            </button>
          ) : (
            <button
              type="button"
              onClick={stopScanner}
              className="flex items-center gap-2 px-6 py-3 border border-red-500 text-red-400 hover:bg-red-500/10 font-semibold rounded-lg transition-colors duration-200"
            >
              <CameraOff size={20} />
              Cerrar cámara
            </button>
          )}
        </div>

        {/* Visor de cámara */}
        {scannerActive && (
          <div className="mb-6 bg-[#1a1a1a] border border-[#262626] rounded-xl p-4">
            <p className="text-gray-400 text-sm text-center mb-3">
              Apunta la cámara al código QR de la entrada
            </p>
            <div id="qr-reader" ref={scannerRef} className="w-full rounded-lg overflow-hidden" />
          </div>
        )}

        {scannerError && (
          <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-yellow-400 text-sm text-center">
            {scannerError}
          </div>
        )}

        {/* Formulario manual */}
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 sm:p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">
                O introduce el código manualmente
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="Ej: LCV-202604-DQFD3G"
                  className="w-full bg-[#262626] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none transition-colors font-mono text-lg"
                  autoFocus
                  disabled={loading}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

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
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 mb-6 flex items-start gap-4">
            <XCircle className="text-red-400 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Error de Verificación</h3>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Resultado exitoso */}
        {result?.success && result.booking && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-6">
              <CheckCircle className="text-green-400 flex-shrink-0" size={32} />
              <div>
                <h3 className="text-green-400 font-semibold text-xl mb-1">
                  ¡Check-in Exitoso!
                </h3>
                <p className="text-green-300">{result.message}</p>
              </div>
            </div>

            <div className="bg-[#0d0d0d] rounded-lg p-6 space-y-4 border border-[#1a1a1a]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Código de Reserva</p>
                  <p className="text-white font-mono font-semibold">
                    {result.booking.codigo_reserva}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Estado</p>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    asistida
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
                  <p className="text-gray-400 text-sm mb-1">Socio</p>
                  <p className="text-white">
                    {result.booking.socio_nombre && result.booking.socio_apellidos
                      ? `${result.booking.socio_nombre} ${result.booking.socio_apellidos}`
                      : result.booking.nombre && result.booking.apellidos
                      ? `${result.booking.nombre} ${result.booking.apellidos}`
                      : result.booking.email || 'N/A'}
                  </p>
                </div>
                {result.booking.numero_socio && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Número de Socio</p>
                    <p className="text-primary-300 font-semibold">
                      {result.booking.numero_socio}
                    </p>
                  </div>
                )}
              </div>

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
    </div>
  );
};

export default AdminVerifyQR;