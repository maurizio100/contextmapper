import type { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors ${className}`}
      {...rest}
    />
  );
}
