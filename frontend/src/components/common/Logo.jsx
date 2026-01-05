import { Link } from 'react-router-dom';
import { NAV_ROUTES } from '../../utils/constants';

const Logo = ({ className = '' }) => {
  return (
    <Link to={NAV_ROUTES.HOME} className={`flex items-center gap-2 ${className}`}>
      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-glow">
        <span className="text-white font-bold text-xl">LC</span>
      </div>
      <span className="text-2xl font-display text-white hidden sm:block">
        La Clave
      </span>
    </Link>
  );
};

export default Logo;