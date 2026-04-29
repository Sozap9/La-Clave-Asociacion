import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ─── Componente artículo ──────────────────────────────────────────────────────
const Articulo = ({ num, titulo, texto }) => (
  <div className="border-l-2 border-[#262626] hover:border-primary-500/50 pl-6 py-2 transition-colors duration-300">
    <p className="text-xs text-primary-400 font-mono mb-1 tracking-widest uppercase">
      Art. {num}
    </p>
    <h4 className="text-white text-base font-medium mb-2">{titulo}</h4>
    <p className="text-gray-400 text-sm leading-relaxed">{texto}</p>
  </div>
);

// ─── Capítulo controlado (acordeón) ──────────────────────────────────────────
const CapituloControlled = ({ capitulo, isOpen, onToggle }) => (
  <div className="border border-[#262626] rounded-xl overflow-hidden hover:border-primary-500/20 transition-colors duration-300">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-5 bg-[#0d0d0d] hover:bg-[#111] transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <FileText size={16} className="text-primary-400 shrink-0" />
        <span className="text-white font-medium text-sm md:text-base">
          {capitulo.titulo}
        </span>
      </div>
      {isOpen ? (
        <ChevronUp size={18} className="text-primary-400 shrink-0" />
      ) : (
        <ChevronDown size={18} className="text-gray-500 shrink-0" />
      )}
    </button>

    {isOpen && (
      <div className="px-6 py-6 bg-[#080808] space-y-6">
        {capitulo.articulos.map((art) => (
          <Articulo key={art.num} {...art} />
        ))}
      </div>
    )}
  </div>
);

// ─── Página principal ─────────────────────────────────────────────────────────
const Estatutos = () => {
  const { t } = useLanguage();

  // Los capítulos vienen de translations para soporte bilingüe
  const capitulos = t('estatutos.capitulos');

  const totalArticulos = capitulos.reduce((a, c) => a + c.articulos.length, 0);

  const [openStates, setOpenStates] = useState(
    capitulos.reduce((acc, c, i) => ({ ...acc, [i]: i === 0 }), {})
  );
  const allOpen = Object.values(openStates).every(Boolean);

  const toggleAll = () => {
    const next = !allOpen;
    setOpenStates(capitulos.reduce((acc, _, i) => ({ ...acc, [i]: next }), {}));
  };

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

      {/* ── Contenido ── */}
      <section className="py-16 bg-black">
        <div className="container-custom px-6">
          <div className="max-w-3xl mx-auto">

            {/* Controles */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#262626]">
              <p className="text-gray-500 text-sm">
                {capitulos.length} {t('estatutos.chapters')} · {totalArticulos} {t('estatutos.articles')}
              </p>
              <button
                onClick={toggleAll}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                {allOpen ? t('estatutos.collapse_all') : t('estatutos.expand_all')}
              </button>
            </div>

            {/* Acordeones */}
            <div className="space-y-3">
              {capitulos.map((cap, i) => (
                <CapituloControlled
                  key={i}
                  capitulo={cap}
                  isOpen={openStates[i]}
                  onToggle={() =>
                    setOpenStates((prev) => ({ ...prev, [i]: !prev[i] }))
                  }
                />
              ))}
            </div>

            {/* Nota final */}
            <div className="mt-12 p-6 bg-[#0d0d0d] border border-[#262626] rounded-xl text-center">
              <p className="text-gray-500 text-sm leading-relaxed">
                {t('estatutos.footer_note')}
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default Estatutos;