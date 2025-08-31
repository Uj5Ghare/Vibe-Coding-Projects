import React from 'react';
import { ChefHatIcon } from './icons/ChefHatIcon';

export const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-16 px-6 bg-white rounded-3xl shadow-lg border border-gray-100">
      <div className="inline-block p-5 bg-gradient-to-br from-[#FDFBF7] to-gray-100 rounded-full mb-6">
         <div className="inline-block p-4 bg-white rounded-full shadow-inner">
            <ChefHatIcon className="w-12 h-12 text-[#F39C12]" />
         </div>
      </div>
      <h3 className="text-2xl font-bold text-[#2C3E50]">Ready for some culinary inspiration?</h3>
      <p className="text-[#7F8C8D] mt-3 max-w-md mx-auto">
        Your recipe book is waiting. Add your ingredients above and click "Generate Recipes" to discover your next delicious meal.
      </p>
    </div>
  );
};