import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <svg 
        className="animate-spin-slow -ml-1 mr-3 h-6 w-6 text-white" 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path d="M2 12C2 7.6 7.6 3 12 3v0a9 9 0 0 1 9 9Z" />
        <path d="M11 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0Z" />
        <path d="M12 21a9 9 0 0 0 9-9h-3.5a5.5 5.5 0 0 1-5.5 5.5v0a5.5 5.5 0 0 1-5.5-5.5H3a9 9 0 0 0 9 9Z" />
    </svg>
  );
};