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
      className="bg-neutral-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex items-center"
    >
      {icon && <div className="mr-4 text-3xl">{icon}</div>}
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="text-black">{description}</p>}
      </div>
    </a>
  );
};

export default Card;
