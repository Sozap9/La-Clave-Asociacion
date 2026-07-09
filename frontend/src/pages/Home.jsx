import Button from '../components/common/Button';
import FeaturedEventsCarousel from '../components/events/FeaturedEventsCarousel';
import main from '../assets/main.png';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-black">

      {/* ==== Principal ==== */}

      <section className="relative min-h-[85vh] sm:min-h-screen flex items-center justify-center overflow-hidden">
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/20 to-black z-10" />
          <img
            src={main}
            alt="Club background"
            className="w-full h-full object-cover opacity-20 grayscale"
          />
        </div>

        {/* Contenido principal */}
        <div className="relative z-20 container-custom text-center px-4 sm:px-6 py-16 md:py-20">

          {/* Nombre del club */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-white mb-4 animate-fade-in uppercase tracking-[0.04em] sm:tracking-[0.08em] font-bold text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl">
              La Clave 981
            </h1>
            <div className="w-16 sm:w-20 md:w-24 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent mx-auto" />
          </div>

          {/* Descripción */}
          <div className="max-w-3xl lg:max-w-4xl mx-auto space-y-8">
            <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed animate-slide-up font-light px-2 sm:px-4 md:px-0">
              {t('home.description')}
            </p>
          </div>
        </div>
      </section>

      {/* ==== Únete ==== */}
      <section className="relative pt-10 sm:pt-14 md:pt-16 pb-16 sm:pb-20 md:pb-28 lg:pb-32 bg-black overflow-hidden">
        <div className="relative container-custom px-4 sm:px-6">
          <div className="max-w-3xl lg:max-w-4xl mx-auto text-center">

            {/* Línea decorativa — mismo estilo, más ancha, igual de fina */}
            <div className="w-24 sm:w-40 md:w-56 lg:w-72 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent mx-auto mb-8 sm:mb-10 md:mb-12" />

            {/* Texto descriptivo */}
            <div className="mb-8 sm:mb-10 md:mb-12">
              <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed font-light">
                {t('home.unete.text')}
              </p>
            </div>

            {/* Botón */}
            <div className="flex justify-center">
              <Button
                variant="primary"
                to="/registro"
                className="rounded-full px-8 py-3 md:px-12 md:py-4 lg:px-14 lg:py-5 text-sm md:text-base lg:text-lg"
              >
                {t('home.socios.button')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ==== CARRUSEL DE EVENTOS DESTACADOS ==== 

      <section className="py-12 md:py-24 bg-black">
        <div className="container-custom">
          <FeaturedEventsCarousel />
        </div>
      </section>
      */}

    </div>
  );
};

export default Home;