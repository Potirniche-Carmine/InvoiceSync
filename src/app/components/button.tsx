import React from 'react';
import { useRouter } from 'next/navigation';

interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  redirectTo?: string; // Add a redirectTo prop
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  type = 'button',
  onClick,
  redirectTo,
  children,
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (redirectTo) {
      router.push(redirectTo); // Redirect to the specified page
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      className={`w-full bg-blue text-white py-2 px-4 rounded-md hover:bg-red`}
    >
      {children}
    </button>
  );
};

export default Button;
