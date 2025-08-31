import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-[#1ABC9C] to-[#16A085] shadow-lg">
      <div className="container mx-auto px-4 md:px-8 py-5 flex items-center">
        <LogoIcon className="w-10 h-10 text-white mr-4"/>
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{fontFamily: "'Pacifico', cursive"}}>
          AI Recipe Generator
        </h1>
      </div>
    </header>
  );
};