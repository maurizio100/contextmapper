import type { ButtonHTMLAttributes } from 'react';

export default function ModeActiveButton({
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors ${className}`}
      {...rest}
    />
  );
}
