import { useState } from "react";
import Alert from "../../components/common/Alert";
import { exportEventos } from "../../api/adminApi";
import { Download, Calendar, Info } from "lucide-react";
import AdminCard from "../../components/admin/AdminCard.jsx";

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
        setSuccess("Exportación de eventos completada exitosamente");
      } else {
        setError(result.message || "Error en la exportación");
      }
    } catch (err) {
      console.error("Error exportando eventos:", err);
      setError(
        "Error al exportar eventos. Es posible que el endpoint no esté implementado aún."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-black min-h-screen">
      <div className="mb-8">
        <h1 className="text-gradient mb-2 text-4xl">Exportar Eventos CSV</h1>
        <p className="text-gray-400 text-lg">
          Descarga la lista de eventos con estadísticas
        </p>
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

      <AdminCard
        title="Lista de eventos"
        subtitle="Exporta todos los eventos con fechas, aforo y estadísticas"
        image={null}
        badges={[
          {
            text: "Exportación",
            color: "primary",
            icon: <Info size={14} />,
          },
        ]}
        fields={[
          {
            icon: <Calendar size={14} className="text-primary-300" />,
            label: "Formato",
            value: "CSV",
          },
          {
            icon: <Info size={14} className="text-primary-300" />,
            label: "Incluye",
            value: "Eventos + estadísticas",
          },
        ]}
        columns={2}
      >
        {/* Campos incluidos */}
        <div className="mt-6">
          <p className="text-white font-medium mb-3">Campos incluidos:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Título",
              "Fecha evento",
              "Ubicación",
              "Aforo máximo",
              "Entradas vendidas",
              "Estado",
              "Fecha alta",
            ].map((field) => (
              <span
                key={field}
                className="bg-[#262626] text-gray-300 px-3 py-1 rounded-full text-sm border border-[#333333]"
              >
                {field}
              </span>
            ))}
          </div>
        </div>

        {/* Botón exportar */}
        <div className="mt-8">
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                Descargar CSV de Eventos
              </>
            )}
          </button>
        </div>
      </AdminCard>
    </div>
  );
};

export default AdminExportEventos;
