import React from 'react';
import { TrashIcon } from './icons/TrashIcon';

interface IngredientListProps {
  ingredients: string[];
  onRemoveIngredient: (ingredient: string) => void;
}

export const IngredientList: React.FC<IngredientListProps> = ({ ingredients, onRemoveIngredient }) => {
  if (ingredients.length === 0) {
    return (
        <div className="text-center py-6 px-4 bg-[#ECF0F1]/60 text-[#7F8C8D] rounded-xl border-2 border-dashed border-gray-300">
            Your ingredient list is looking a bit empty. Add some items to get started!
        </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-[#ECF0F1]/60 rounded-xl min-h-[60px]">
      {ingredients.map(ingredient => (
        <div
          key={ingredient}
          className="flex items-center bg-white text-[#2C3E50] text-base font-semibold px-4 py-2 rounded-full shadow-md animate-pop-in border border-gray-200"
        >
          <span>{ingredient}</span>
          <button
            onClick={() => onRemoveIngredient(ingredient)}
            className="ml-2.5 text-gray-400 hover:text-red-500 focus:outline-none transition-colors duration-200"
            aria-label={`Remove ${ingredient}`}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
};