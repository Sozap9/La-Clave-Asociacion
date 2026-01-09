import Button from '../../components/common/Button';
import main from '../../assets/main.png';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Imagen de fondo con overlay más oscuro */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black z-10" />
        <img
          src={main}
          alt="Club background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      {/* Líneas decorativas superiores */}
      <div className="absolute top-20 right-10 md:right-32 z-10 opacity-40">
        <div className="flex gap-3 transform rotate-12">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="w-1 bg-white/40"
              style={{ 
                height: `${120 + i * 15}px`,
                animationDelay: `${i * 0.1}s` 
              }}
            />
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-20 container-custom text-center px-6 py-20">
        {/* Logo o nombre del club */}
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

          {/* Botón principal */}
          <div className="pt-4">
            <Button 
              variant="primary"
              to="/estatutos"
              className="text-base px-10 py-4 rounded-full hover:shadow-2xl hover:shadow-primary/20"
            >
              Revisa nuestra normativa
            </Button>
          </div>
        </div>
      </div>


    </section>
  );
};

export default HeroSection;