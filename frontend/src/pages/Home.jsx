import Button from '../components/common/Button';
import FeaturedEventsCarousel from '../components/events/FeaturedEventsCarousel';
import main from '../assets/main.png';
import registro from '../assets/registro.png';
import socios from '../assets/socios.png';

const Home = () => {
  return (
    <div className="bg-black">
      
      {/* ==== SECCIÓN PRINCIPAL === */}

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/20 to-black z-10" />
          <img
            src={main}
            alt="Club background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>

        {/* Contenido principal */}
        <div className="relative z-20 container-custom text-center px-6 py-20">

          {/* Nombre del club */}
          <div className="mb-8">
            <h1 className="text-white mb-4 animate-fade-in uppercase tracking-[0.3em] font-light text-5xl md:text-7xl lg:text-8xl">
              La Clave
            </h1>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent mx-auto" />
          </div>
          
          {/* Descripción */}
          <div className="max-w-3xl mx-auto space-y-8">
            <p className="text-gray-300 text-base md:text-lg leading-relaxed animate-slide-up font-light px-4">
              Lorem ipsum dolor sit amet consectetur adipiscing elit placerat elementum, lacus pellentesque 
              ridiculus porta nisi nulla iaculis posuere inceptos magnis, curae pretium sed odio velit ac vulputate 
              mauris. Sagittis rhoncus nam porta natoque id parturient eleifend venenatis at, montes interdum 
              phasellus hac risus ac litora convallis, ante fermentum commodo lacus metus pharetra tortor congue.
            </p>
          </div>
        </div>
      </section>

      {/* ==== NUESTRA COMUNIDAD ==== */}

      <section className="py-24 bg-black">
        <div className="container-custom px-6">
          <div className="max-w-5xl mx-auto">
            
            {/* Imagen */}
            <div className="group mb-12">
              <div className="relative overflow-hidden">
                <img
                  src={registro}
                  alt="Nuestra Comunidad"
                  className="w-full h-[450px] md:h-[550px] object-cover grayscale group-hover:grayscale-0 transition-all duration-700"/>
              </div>
            </div>

            {/* Texto descriptivo */}
            <div className="text-center space-y-6 mb-10">
              <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light max-w-4xl mx-auto">
                Lorem ipsum dolor sit amet consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore 
                et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut 
                aliquip ex ea commodo consequat.
              </p>
              
              <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light max-w-4xl mx-auto">
                Lorem ipsum dolor sit amet consectetur adipiscing elit placerat elementum, lacus pellentesque 
                ridiculus porta nisi nulla iaculis posuere inceptos magnis, curae pretium sed odio velit ac vulputate 
                mauris. Sagittis rhoncus nam porta natoque id parturient eleifend venenatis at, montes interdum 
                phasellus hac risus ac litora convallis.
              </p>

              <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light max-w-4xl mx-auto">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est 
                laborum.
              </p>
            </div>

            {/* Botón */}
            <div className="text-center">
              <Button
                variant="primary"
                to="/estatutos"
                className="rounded-full px-12 py-4 text-base"
              >
                Revisa nuestra normativa
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ==== EVENTOS EXCLUSIVOS ==== */}

      <section className="py-24 bg-black">
        <div className="container-custom px-6">
          <div className="max-w-5xl mx-auto">
            
            {/* Imagen */}
            <div className="group mb-12">
              <div className="relative overflow-hidden">
                <img
                  src={socios}
                  alt="Eventos Exclusivos"
                  className="w-full h-[450px] md:h-[550px] object-cover grayscale group-hover:grayscale-0 transition-all duration-700"/>
              </div>
            </div>

            {/* Texto descriptivo */}
            <div className="text-center space-y-6 mb-10">
              <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light max-w-4xl mx-auto">
                Lorem ipsum dolor sit amet consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore 
                et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut 
                aliquip ex ea commodo consequat.
              </p>
              
              <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light max-w-4xl mx-auto">
                Lorem ipsum dolor sit amet consectetur adipiscing elit placerat elementum, lacus pellentesque 
                ridiculus porta nisi nulla iaculis posuere inceptos magnis, curae pretium sed odio velit ac vulputate 
                mauris. Sagittis rhoncus nam porta natoque id parturient eleifend venenatis at, montes interdum 
                phasellus hac risus ac litora convallis.
              </p>

              <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light max-w-4xl mx-auto">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est 
                laborum.
              </p>
            </div>

            {/* Botón */}
            <div className="text-center">
              <Button
                variant="primary"
                to="/registro"
                className="rounded-full px-12 py-4 text-base"
              >
                Regístrate o hazte socio
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ==== CARRUSEL DE EVENTOS DESTACADOS ==== */}

      <section className="py-24 bg-black">
        <div className="container-custom">
          <FeaturedEventsCarousel />
        </div>
      </section>

    </div>
  );
};

export default Home;