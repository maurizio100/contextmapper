import type { ButtonHTMLAttributes } from 'react';

export default function SecondaryButton({
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors ${className}`}
      {...rest}
    />
  );
}
