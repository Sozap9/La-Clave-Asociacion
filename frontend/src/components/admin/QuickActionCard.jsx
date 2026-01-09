import { useNavigate } from "react-router-dom";

const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  iconColor,
  path,
  onClick,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 hover:border-primary-500/50 active:border-primary-600 active:scale-[0.98] transition-all text-left w-full group"
    >
      <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon size={24} className="text-primary-300" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </button>
  );
};

export default QuickActionCard;