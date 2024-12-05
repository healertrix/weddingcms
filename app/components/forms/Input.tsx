'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ error, className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 
        ${error 
          ? 'border-red-500 focus:ring-red-500' 
          : 'border-gray-300 focus:ring-[#8B4513]'} 
        ${className}`}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input; 