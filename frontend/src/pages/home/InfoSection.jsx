import Button from '../../components/common/Button';

const InfoSection = ({ title, description, imageSrc, buttonText, buttonHref, reverse = false }) => {
  return (
    <section className="py-24 bg-black">
      <div className="container-custom px-6">
        <div className="max-w-5xl mx-auto">
          
          {/* IMAGEN ARRIBA */}
          <div className="group mb-12">
            <div className="relative overflow-hidden">
              <img
                src={imageSrc}
                alt={title}
                className="w-full h-[450px] md:h-[550px] object-cover grayscale group-hover:grayscale-0 
                          transition-all duration-700"
              />
              {/* Overlay sutil */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/0 transition-all duration-700" />
            </div>
          </div>

          {/* TEXTO DESCRIPTIVO */}
          <div className="text-center space-y-6 mb-10">
            <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light max-w-4xl mx-auto">
              {description}
            </p>
            
            <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light max-w-4xl mx-auto">
              Lorem ipsum dolor sit amet consectetur adipiscing elit placerat elementum, lacus pellentesque 
              ridiculus porta nisi nulla iaculis posuere inceptos magnis, curae pretium sed odio velit ac vulputate 
              mauris. Sagittis rhoncus nam porta natoque id parturient eleifend venenatis at, montes interdum 
              phasellus hac risus ac litora convallis.
            </p>

            <p className="text-gray-300 text-base md:text-lg leading-relaxed font-light max-w-4xl mx-auto">
              Lorem ipsum dolor sit amet consectetur adipiscing elit placerat elementum, lacus pellentesque 
              ridiculus porta nisi nulla iaculis posuere inceptos magnis, curae pretium sed odio velit ac vulputate 
              mauris. Sagittis rhoncus nam porta natoque id parturient eleifend venenatis at, montes interdum 
              phasellus hac risus ac litora convallis, ante fermentum commodo lacus metus pharetra tortor congue.
            </p>
          </div>

          {/* BOTÓN ABAJO */}
          {buttonText && (
            <div className="text-center">
              <Button
                variant="primary"
                to={buttonHref}
                className="rounded-full px-12 py-4 text-base"
              >
                {buttonText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default InfoSection;