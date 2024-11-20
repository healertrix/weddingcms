import { ButtonHTMLAttributes } from 'react';
import { IconType } from 'react-icons';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  icon?: IconType;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  icon: Icon,
  className = '', 
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors';
  const variants = {
    primary: 'bg-[#8B4513] text-white hover:bg-[#723A0F]',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
} 