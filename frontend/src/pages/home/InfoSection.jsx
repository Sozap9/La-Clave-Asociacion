import Button from '../../components/common/Button';

const InfoSection = ({ title, description, imageSrc, buttonText, buttonHref, reverse = false }) => {
  return (
    <section className="py-20 bg-gray-950">
      <div className="container-custom">
        <div className={`grid md:grid-cols-2 gap-12 items-center ${reverse ? 'md:flex-row-reverse' : ''}`}>
          
          <div className={`${reverse ? 'md:order-2' : ''}`}>
            <div className="relative overflow-hidden rounded-lg shadow-2xl">
              <img
                src={imageSrc}
                alt={title}
                className="w-full h-96 object-cover grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </div>

          <div className={`${reverse ? 'md:order-1' : ''}`}>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              {description}
            </p>

            {buttonText && (
              <Button
                variant="primary"
                to={buttonHref}
              >
                {buttonText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;