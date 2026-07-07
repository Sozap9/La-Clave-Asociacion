import { useLanguage } from '../context/LanguageContext';

const Normativa = () => {
  const { t } = useLanguage();
  const normas = t('normativa.normas') || [];

  return (
    <div className="bg-black min-h-screen">

      {/* ── Normas de Régimen Interno ── */}
      <section className="section pt-24 md:pt-32">
        <div className="container-custom px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">

            {/* Cabecera del bloque */}
            <div className="text-center mb-10 md:mb-14">
              <h2 className="text-white mb-2">
                {t('normativa.normas_titulo')}
              </h2>
              <p className="text-primary-400 text-sm md:text-base uppercase tracking-[0.15em] font-medium">
                {t('normativa.normas_subtitulo')}
              </p>
            </div>

            {/* Lista de normas */}
            <div className="space-y-4 md:space-y-5">
              {normas.map((norma) => (
                <div
                  key={norma.num}
                  className="card p-5 md:p-6 flex gap-4 md:gap-5"
                >
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 md:w-11 md:h-11 rounded-full border border-primary-500/50 flex items-center justify-center text-primary-400 font-semibold text-sm md:text-base">
                      {norma.num}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white text-base md:text-lg mb-1.5">
                      {norma.titulo}
                    </h3>
                    <p className="text-gray-400 text-sm md:text-base leading-relaxed font-light">
                      {norma.texto}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cierre */}
            <div className="mt-10 md:mt-14 text-center">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent mx-auto mb-6" />
              <p className="text-gray-300 text-base md:text-lg font-light italic leading-relaxed max-w-xl mx-auto">
                {t('normativa.normas_cierre')}
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Normativa;