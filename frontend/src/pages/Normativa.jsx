import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import KeyLogo from '../components/common/KeyLogo';
import { LaClaveWordmark, NormasWordmark } from '../components/common/BrandWordmark';
import {
  IconRuido,
  IconCandado,
  IconManos,
  IconPapelera,
  IconLlaveInglesa,
  IconGrupo,
  IconAviso,
} from '../components/normas/NormasIcons';

// Icono de cada norma, en el mismo orden que el cartel (1 → 7)
const NORMAS_ICONS = [
  IconRuido,
  IconCandado,
  IconManos,
  IconPapelera,
  IconLlaveInglesa,
  IconGrupo,
  IconAviso,
];

// Normas con el diseño del cartel del local (fuentes en index.css)

const POSTER_BG =
  'radial-gradient(120% 80% at 50% 0%, #1d1b1b 0%, #141313 55%, #0e0d0d 100%)';
const TEXT = '#ece9e6';

// Marco del cartel, dibujado a la medida
const PosterFrame = ({ width: w, height: h }) => {
  if (!w || !h) return null;

  const small = w < 640;
  const o = small ? 6 : 12; // margen del contorno exterior
  const c = small ? 14 : 26; // chaflán de las esquinas
  const b = small ? 30 : 70; // largo de los corchetes
  const ib = o + (small ? 6 : 10); // corchetes interiores
  const m = small ? 10 : 16; // posición de las mirillas
  const cr = small ? 7 : 10; // tamaño de las mirillas
  const line = 'rgba(255,255,255,.35)';
  const strong = 'rgba(255,255,255,.8)';
  const mid = h / 2;

  // Cuatro rayas diagonales junto a las etiquetas laterales
  const hatch = (x, y, dir) =>
    [0, 1, 2, 3].map((k) => (
      <line
        key={`${x}-${y}-${k}`}
        x1={x}
        y1={y + k * 7}
        x2={x + dir * 6}
        y2={y + k * 7 + 5}
        stroke={strong}
        strokeWidth="1.5"
      />
    ));

  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full"
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
    >
      {/* Contorno exterior achaflanado */}
      <path
        d={`M${o + c},${o} H${w - o - c} L${w - o},${o + c} V${h - o - c} L${w - o - c},${h - o} H${o + c} L${o},${h - o - c} V${o + c} Z`}
        fill="none"
        stroke={line}
      />
      {/* Corchetes de las esquinas */}
      <path d={`M${ib},${ib + b} V${ib + c * 0.7} L${ib + c * 0.7},${ib} H${ib + b}`} fill="none" stroke={strong} strokeWidth="2" />
      <path d={`M${w - ib},${ib + b} V${ib + c * 0.7} L${w - ib - c * 0.7},${ib} H${w - ib - b}`} fill="none" stroke={strong} strokeWidth="2" />
      <path d={`M${ib},${h - ib - b} V${h - ib}`} fill="none" stroke={strong} strokeWidth="2" />
      <path d={`M${w - ib},${h - ib - b} V${h - ib}`} fill="none" stroke={strong} strokeWidth="2" />
      {/* Mirillas en las cuatro esquinas */}
      {[
        [ib + m, ib + m],
        [w - ib - m, ib + m],
        [ib + m, h - ib - m],
        [w - ib - m, h - ib - m],
      ].map(([x, y]) => (
        <g key={`mira-${x}-${y}`}>
          <circle cx={x} cy={y} r={small ? 4 : 6} fill="none" stroke={line} />
          <line x1={x - cr} y1={y} x2={x + cr} y2={y} stroke={line} />
          <line x1={x} y1={y - cr} x2={x} y2={y + cr} stroke={line} />
        </g>
      ))}
      {/* Detalles laterales (solo en pantallas grandes) */}
      {!small && (
        <>
          {hatch(o - 3, mid - 125, 1)}
          {hatch(o - 3, mid + 98, 1)}
          {hatch(w - o + 3, mid - 125, -1)}
          {hatch(w - o + 3, mid + 98, -1)}
          {[mid - 170, mid + 140].map((y) => (
            <g key={`seg-${y}`}>
              <line x1={ib} y1={y} x2={ib} y2={y + 30} stroke={strong} strokeWidth="2" />
              <line x1={w - ib} y1={y} x2={w - ib} y2={y + 30} stroke={strong} strokeWidth="2" />
            </g>
          ))}
        </>
      )}
    </svg>
  );
};

// Octógono con el icono de la norma
const IconBadge = ({ Icon }) => (
  <div className="relative flex-shrink-0 w-12 h-12 sm:w-[60px] sm:h-[60px] flex items-center justify-center" style={{ color: TEXT }}>
    <svg viewBox="0 0 60 60" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <polygon
        points="18.5,2 41.5,2 58,18.5 58,41.5 41.5,58 18.5,58 2,41.5 2,18.5"
        fill="none"
        stroke="rgba(236,233,230,.85)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
    {Icon && <Icon className="relative w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" />}
  </div>
);

// Etiqueta vertical de los laterales
const SideLabel = ({ side }) => (
  <div
    className={`hidden sm:flex absolute top-1/2 -translate-y-1/2 border border-white/40 rounded-full px-[5px] py-3 ${
      side === 'left' ? 'left-[14px] -translate-x-1/2' : 'right-[14px] translate-x-1/2'
    }`}
    style={{ background: '#141313' }}
    aria-hidden="true"
  >
    <span className="font-label font-medium text-[10px] tracking-[0.4em] text-white/70 [writing-mode:vertical-rl]">
      LACLAVE981
    </span>
  </div>
);

const Normativa = () => {
  const { t, language } = useLanguage();
  const normas = t('normativa.normas') || [];

  // Tamaño del cartel para el marco
  const posterRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = posterRef.current;
    if (!el) return undefined;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-black min-h-screen">
      <section className="pt-10 md:pt-16 pb-16 md:pb-24 px-3 sm:px-6">
        <article
          ref={posterRef}
          className="relative mx-auto max-w-[780px] rounded-[6px] px-6 sm:px-14 md:px-16 pt-10 sm:pt-12 pb-8 sm:pb-10"
          style={{ background: POSTER_BG }}
        >
          <PosterFrame width={size.width} height={size.height} />
          <SideLabel side="left" />
          <SideLabel side="right" />

          {/* Cabecera */}
          <header className="relative text-center" style={{ color: TEXT }}>
            <div className="flex justify-center">
              <KeyLogo className="h-16 sm:h-20 md:h-24 w-auto" />
            </div>
            <div className="mt-3 flex justify-center">
              <LaClaveWordmark className="h-4 sm:h-5 md:h-6 w-auto" />
            </div>
            {/* En castellano, las letras del cartel; en otros idiomas, texto */}
            <h1 className="mt-2 sm:mt-3 flex justify-center" style={{ color: TEXT }}>
              {language === 'es' ? (
                <>
                  <span className="sr-only">{t('normativa.normas_cartel_titulo')}</span>
                  <NormasWordmark decorative className="h-14 sm:h-20 md:h-24 w-auto max-w-full" />
                </>
              ) : (
                <span className="font-brand font-black uppercase leading-[0.95] text-[3.5rem] sm:text-[6.2rem] md:text-[7.6rem] tracking-[0.01em]">
                  {t('normativa.normas_cartel_titulo')}
                </span>
              )}
            </h1>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="h-px w-5 sm:w-14 bg-white/60" />
              <p className="font-label font-semibold uppercase whitespace-nowrap tracking-[0.2em] sm:tracking-[0.38em] text-[11px] sm:text-[17px] text-white/85">
                {t('normativa.normas_subtitulo')}
              </p>
              <span className="h-px w-5 sm:w-14 bg-white/60" />
            </div>
          </header>

          {/* Normas */}
          <ol className="relative mt-8 sm:mt-10">
            {normas.map((norma, i) => (
              <li
                key={norma.num}
                className={`flex items-center gap-3 sm:gap-5 py-3 sm:py-4 ${
                  i < normas.length - 1 ? 'border-b border-white/25' : ''
                }`}
              >
                <IconBadge Icon={NORMAS_ICONS[i]} />
                <span
                  className="font-num font-extrabold flex-shrink-0 w-8 sm:w-11 text-[2.2rem] sm:text-[3.4rem] leading-none"
                  style={{ color: TEXT }}
                >
                  {norma.num}.
                </span>
                <span className="self-stretch w-px bg-white/45 flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0 font-poster">
                  <h2
                    className="font-poster font-semibold text-[13.5px] sm:text-[17px] leading-snug tracking-normal"
                    style={{ color: '#f2efec' }}
                  >
                    {norma.titulo}
                  </h2>
                  <p className="font-poster text-white/75 text-[12px] sm:text-[15px] leading-snug mt-0.5 font-normal">
                    {norma.texto}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Cierre */}
          <footer className="relative mt-6 sm:mt-8 text-center">
            <div className="mx-auto max-w-[580px] border border-white/45 rounded-[14px] px-5 py-3">
              <p className="font-label font-medium uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[12px] sm:text-[15px] leading-snug text-white/90">
                {t('normativa.normas_cierre')}
              </p>
            </div>
            <div className="mt-3 inline-block border border-white/35 rounded-full px-5 py-1">
              <p className="font-label font-medium uppercase tracking-[0.35em] text-[11px] sm:text-[13px] text-white/75">
                www.laclave981.com
              </p>
            </div>
          </footer>
        </article>
      </section>
    </div>
  );
};

export default Normativa;
