import React from 'react';

interface CardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  redirectTo: string;
}

const Card: React.FC<CardProps> = ({ title, description, icon, redirectTo }) => {
  return (
    <a
      href={redirectTo}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex items-center group"
    >
      <div className="relative"> {}
        {icon && (
          <div className="text-3xl text-blue-500 transition-colors group-hover:text-blue-700"> 
            {icon}
          </div>
        )}
      </div>
      <div className="ml-4"> 
        <h2 className="text-xl font-semibold text-gray-800 transition-colors group-hover:text-blue-700"> 
          {title}
        </h2>
        {description && (
          <p className="text-gray-600 transition-colors group-hover:text-blue-500">
            {description}
          </p>
        )}
      </div>
      <div className="ml-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-400 transition-colors group-hover:text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </a>
  );
};

export default Card;