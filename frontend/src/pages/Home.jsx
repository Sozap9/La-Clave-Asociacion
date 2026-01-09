import HeroSection from './home/HeroSection';
import InfoSection from './home/InfoSection';
import FeaturedEventsCarousel from '../components/events/FeaturedEventsCarousel';

import registro from '../assets/registro.png';
import socios from '../assets/socios.png';

const Home = () => {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Sección 1 */}
      <InfoSection
        title="Nuestra Comunidad"
        description="Lorem ipsum dolor sit amet consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
        imageSrc={registro}
        buttonText="Regístrate para ver nuestros eventos"
        buttonHref="/registro"
        reverse={false}
      />

      {/* Sección 2 */}
      <InfoSection
        title="Eventos Exclusivos"
        description="Lorem ipsum dolor sit amet consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
        imageSrc={socios}
        buttonText="Hazte socio"
        buttonHref="/registro"
        reverse={true}
      />

      {/* Carrusel de Eventos Destacados */}
      <FeaturedEventsCarousel />
    </>
  );
};

export default Home;
