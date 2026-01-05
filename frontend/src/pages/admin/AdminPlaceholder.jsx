const AdminPlaceholder = ({ title }) => {
  return (
    <div className="p-8">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">{title}</h1>
        <p className="text-gray-400 text-lg">Página en construcción...</p>
        <p className="text-gray-500 text-sm mt-2">Esta funcionalidad estará disponible próximamente</p>
      </div>
    </div>
  );
};

export default AdminPlaceholder;
