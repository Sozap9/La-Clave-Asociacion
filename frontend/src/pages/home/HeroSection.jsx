import Button from '../../components/common/Button';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-gray-950 z-10" />
        <img
          src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80"
          alt="Club background"
          className="w-full h-full object-cover opacity-40"
        />
      </div>

      <div className="relative z-20 container-custom text-center px-6">
        <h1 className="text-white mb-8 animate-fade-in uppercase tracking-wider">
          La Clave
        </h1>
        
        <div className="max-w-4xl mx-auto space-y-6">
          <p className="text-gray-300 text-lg md:text-xl leading-relaxed animate-slide-up">
            Vive experiencias únicas en el corazón de la noche. Música, eventos exclusivos 
            y una comunidad apasionada te esperan. Únete a La Clave y descubre lo que significa 
            formar parte de algo especial.
          </p>

          <div className="pt-6">
            <Button 
              variant="primary"
              to="/estatutos"
              className="text-lg px-8 py-4"
            >
              Revisa nuestra normativa
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute top-20 right-10 md:right-20 z-10 opacity-30">
        <div className="flex gap-4 transform rotate-12">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1 h-32 bg-white/30" />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;