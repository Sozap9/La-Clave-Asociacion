import Button from '../components/common/Button';
import KeyLogo from '../components/common/KeyLogo';
import { LaClaveWordmark } from '../components/common/BrandWordmark';
import main from '../assets/main.png';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-black">
      {/* Al menos una pantalla menos el navbar (h-20); crece si no cabe */}
      <section className="relative min-h-[calc(100svh-5rem)] py-12 md:py-16 flex items-center justify-center overflow-hidden">
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/20 to-black z-10" />
          <img
            src={main}
            alt=""
            className="w-full h-full object-cover opacity-20 grayscale"
          />
        </div>

        <div className="relative z-20 w-full max-w-4xl mx-auto px-5 sm:px-6 text-center">
          {/* Logo */}
          <div className="flex justify-center text-white animate-fade-in">
            <KeyLogo className="h-14 sm:h-16 md:h-20 w-auto" />
          </div>

          {/* Nombre con las letras del cartel (SVG); el texto oculto es para lectores de pantalla */}
          <h1 className="animate-fade-in mt-6 md:mt-8 flex justify-center text-white">
            <span className="sr-only">LaClave981</span>
            <LaClaveWordmark decorative className="h-9 sm:h-14 md:h-[4.5rem] lg:h-20 w-auto max-w-full" />
          </h1>

          {/* Subtítulo con líneas doradas, como en el cartel */}
          <div className="animate-fade-in mt-5 md:mt-7 flex items-center justify-center gap-3 sm:gap-4">
            <span className="h-px w-6 sm:w-12 md:w-16 bg-gradient-to-r from-transparent to-primary-500" />
            <p className="font-label font-medium text-gray-400 uppercase tracking-[0.3em] sm:tracking-[0.4em] text-sm sm:text-base md:text-lg">
              {t('home.subtitle')}
            </p>
            <span className="h-px w-6 sm:w-12 md:w-16 bg-gradient-to-l from-transparent to-primary-500" />
          </div>

          {/* Descripción */}
          <p className="font-poster animate-slide-up mt-10 md:mt-12 max-w-3xl mx-auto text-gray-200 font-normal text-[15px] sm:text-base md:text-lg lg:text-xl leading-relaxed">
            {t('home.description')}
          </p>

          {/* Únete */}
          <p className="font-poster animate-slide-up mt-6 md:mt-8 max-w-2xl mx-auto text-gray-400 font-normal text-[13px] sm:text-sm md:text-base leading-relaxed">
            {t('home.unete.text')}
          </p>

          {/* Botón */}
          <div className="animate-slide-up mt-10 md:mt-12 flex justify-center">
            <Button
              variant="primary"
              to="/registro"
              className="rounded-full px-8 py-3 md:px-12 md:py-4 lg:px-14 lg:py-5 text-sm md:text-base lg:text-lg"
            >
              {t('home.socios.button')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
