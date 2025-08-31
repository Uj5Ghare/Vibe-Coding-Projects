import React from 'react';

interface IconProps {
  className?: string;
}

export const BroomIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19.4 11.6 18.2 2.4a1 1 0 0 0-1-.8H6.8a1 1 0 0 0-1 .8L4.6 11.6" />
      <path d="M2 11.6h20" />
      <path d="M12 11.6V22" />
    </svg>
  );
};
