import React, { useState } from 'react';

interface IngredientInputProps {
  onAddIngredient: (ingredient: string) => void;
}

export const IngredientInput: React.FC<IngredientInputProps> = ({ onAddIngredient }) => {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (value.trim()) {
      onAddIngredient(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex-grow">
      <label htmlFor="ingredient-input" className="block text-sm font-medium text-[#2C3E50] mb-2">Add an Ingredient</label>
      <div className="relative w-full">
        <input
          id="ingredient-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Chicken, Onions, Bell Peppers"
          className="w-full h-14 px-4 pr-28 text-gray-700 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#F39C12] focus:border-[#F39C12] transition duration-200"
        />
        <button
          onClick={handleAdd}
          className="absolute inset-y-0 right-0 m-2 px-5 flex items-center bg-[#3498DB] text-white font-semibold rounded-lg hover:bg-[#2980B9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3498DB] transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
};