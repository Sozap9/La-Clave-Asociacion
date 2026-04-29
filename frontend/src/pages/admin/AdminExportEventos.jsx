import { useState } from "react";
import Alert from "../../components/common/Alert";
import { exportEventos } from "../../api/adminApi";
import { Download, Calendar } from "lucide-react";

const AdminExportEventos = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleExport = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await exportEventos();
      if (result.success) {
        setSuccess("PDF de eventos descargado correctamente");
      } else {
        setError(result.message || "No se pudo generar el PDF de eventos");
      }
    } catch (err) {
      console.error("Error exportando eventos:", err);
      setError(
        "Error al descargar el PDF de eventos. Por favor, intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-2xl md:text-4xl">Exportar Eventos</h1>
      </div>

      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess("")} />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError("")}
          persistent
        />
      )}

      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 transition-all">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-primary-500/20 p-3 rounded-lg">
            <Calendar className="w-8 h-8 text-primary-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-white mb-2">
              Lista de Eventos
            </h3>
            <p className="text-gray-400">
              Exporta todos los eventos con fechas, aforo y estadísticas
            </p>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              Generando PDF...
            </>
          ) : (
            <>
              <Download className="w-6 h-6" />
              Descargar PDF de eventos
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminExportEventos;