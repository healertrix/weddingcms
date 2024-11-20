import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export default function Input({ error, className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 
        ${error 
          ? 'border-red-500 focus:ring-red-500' 
          : 'border-gray-300 focus:ring-[#8B4513]'} 
        ${className}`}
      {...props}
    />
  );
} 