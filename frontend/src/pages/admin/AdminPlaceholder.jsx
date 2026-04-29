const AdminPlaceholder = ({ title }) => {
  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-12 text-center">
        <h1 className="text-gradient mb-2 text-2xl md:text-4xl mb-4">{title}</h1>
        <p className="text-gray-400 text-sm md:text-lg">Página en construcción...</p>
        <p className="text-gray-500 text-sm mt-2">Esta funcionalidad estará disponible próximamente</p>
      </div>
    </div>
  );
};

export default AdminPlaceholder;