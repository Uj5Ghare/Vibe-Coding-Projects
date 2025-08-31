import React from 'react';
import type { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
}

const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => {
  const baseClasses = "px-3 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider";
  const colorClasses = {
    Easy: "bg-teal-100 text-teal-800",
    Medium: "bg-amber-100 text-amber-800",
    Hard: "bg-red-100 text-red-800",
  }[difficulty] || "bg-gray-100 text-gray-800";

  return <span className={`${baseClasses} ${colorClasses}`}>{difficulty}</span>;
};


export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 transform hover:shadow-2xl hover:-translate-y-2">
      <div className="p-8">
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-3xl font-bold text-[#2C3E50] pr-4">{recipe.recipeName}</h3>
            <DifficultyBadge difficulty={recipe.difficulty} />
        </div>
        <p className="text-[#7F8C8D] mb-8 text-lg">{recipe.description}</p>

        <div className="grid md:grid-cols-5 gap-x-8 gap-y-6">
            <div className="md:col-span-2">
                <h4 className="text-xl font-semibold text-[#16A085] mb-4 border-b-2 border-teal-100 pb-2">Ingredients</h4>
                <ul className="space-y-2.5 list-disc list-inside text-[#34495E]">
                    {recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="pl-1">{ingredient}</li>
                    ))}
                </ul>
            </div>
            <div className="md:col-span-3">
                <h4 className="text-xl font-semibold text-[#16A085] mb-4 border-b-2 border-teal-100 pb-2">Instructions</h4>
                <ol className="space-y-4 list-decimal list-inside text-[#34495E]">
                    {recipe.instructions.map((step, index) => (
                        <li key={index} className="pl-1 leading-relaxed">{step}</li>
                    ))}
                </ol>
            </div>
        </div>
      </div>
    </div>
  );
};