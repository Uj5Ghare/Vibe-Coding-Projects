
import React from 'react';

interface IconProps {
  className?: string;
}

export const ChefHatIcon: React.FC<IconProps> = ({ className }) => {
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
      <path d="M15 2H9a1 1 0 0 0-1 1v1a4 4 0 0 0 8 0V3a1 1 0 0 0-1-1Z" />
      <path d="M6.18 11.5A2.2 2.2 0 0 1 4 10.8V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2.8a2.2 2.2 0 0 1-2.18 1.73.7.7 0 0 0-.62.92v.35a3.6 3.6 0 0 1-7.2 0v-.35a.7.7 0 0 0-.62-.92Z" />
    </svg>
  );
};
