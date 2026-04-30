import { useLanguage } from '../context/LanguageContext';

const Estatutos = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-black min-h-screen">

      {/* ── Hero ── */}
      <section className="relative py-14 md:py-28 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black z-10" />
          <div className="absolute inset-0 bg-mesh" />
        </div>

        <div className="relative z-20 container-custom px-6 text-center">
          <h1 className="text-white mb-4 uppercase tracking-[0.15em] sm:tracking-[0.2em] font-light text-2xl sm:text-4xl md:text-5xl">
            {t('estatutos.title')}
          </h1>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent mx-auto mb-6" />
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-light">
            {t('estatutos.subtitle')}
          </p>
        </div>
      </section>

    </div>
  );
};

export default Estatutos;