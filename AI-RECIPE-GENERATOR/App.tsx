import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { IngredientInput } from './components/IngredientInput';
import { IngredientList } from './components/IngredientList';
import { RecipeCard } from './components/RecipeCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { EmptyState } from './components/EmptyState';
import { generateRecipes } from './services/geminiService';
import type { Recipe, Difficulty } from './types';
import { ChefHatIcon } from './components/icons/ChefHatIcon';
import { SparkleIcon } from './components/icons/SparkleIcon';
import { BroomIcon } from './components/icons/BroomIcon';

const App: React.FC = () => {
  const [ingredients, setIngredients] = useState<string[]>(['Tomatoes', 'Chicken Breast', 'Garlic']);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [allIngredients, setAllIngredients] = useState<string[]>([]);

  const handleAddIngredient = (ingredient: string) => {
    if (ingredient && !ingredients.map(i => i.toLowerCase()).includes(ingredient.toLowerCase())) {
      setIngredients(prev => [...prev, ingredient]);
    }
  };

  const handleRemoveIngredient = (ingredientToRemove: string) => {
    setIngredients(prev => prev.filter(ingredient => ingredient !== ingredientToRemove));
  };

  const handleClearAllIngredients = () => {
    // Removed window.confirm to ensure functionality in all environments.
    setIngredients([]);
  };

  const handleSuggestIngredient = useCallback(async () => {
    setIsSuggesting(true);
    setError(null);
    try {
      let ingredientsToSample = allIngredients;
      if (ingredientsToSample.length === 0) {
        const response = await fetch('https://www.themealdb.com/api/json/v1/1/list.php?i=list');
        if (!response.ok) {
          throw new Error('Failed to fetch ingredient list from API.');
        }
        const data = await response.json();
        const apiIngredients: string[] = data.meals.map((meal: any) => meal.strIngredient);
        setAllIngredients(apiIngredients);
        ingredientsToSample = apiIngredients;
      }

      const currentIngredientsLower = ingredients.map(i => i.toLowerCase());

      if (currentIngredientsLower.length >= ingredientsToSample.length) {
        setError("You've added all available ingredients from our suggestions!");
        return;
      }

      let suggestion: string | undefined;
      let attempts = 0;
      const maxAttempts = ingredientsToSample.length * 2;

      do {
        const randomIndex = Math.floor(Math.random() * ingredientsToSample.length);
        suggestion = ingredientsToSample[randomIndex];
        attempts++;
      } while (suggestion && currentIngredientsLower.includes(suggestion.toLowerCase()) && attempts < maxAttempts);

      if (suggestion && !currentIngredientsLower.includes(suggestion.toLowerCase())) {
        handleAddIngredient(suggestion);
      } else {
        setError("Couldn't find a new ingredient to suggest. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? `Failed to suggest ingredient: ${err.message}` : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsSuggesting(false);
    }
  }, [ingredients, allIngredients]);

  const handleGenerateRecipes = useCallback(async () => {
    if (ingredients.length === 0) {
      setError('Please add at least one ingredient.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecipes([]);

    try {
      const generated = await generateRecipes(ingredients, difficulty);
      setRecipes(generated);
    } catch (err) {
      setError(err instanceof Error ? `Failed to generate recipes: ${err.message}` : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [ingredients, difficulty]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#34495E] font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100">
          <h2 className="text-3xl font-bold text-[#2C3E50] mb-2">Your Culinary Canvas</h2>
          <p className="text-[#7F8C8D] mb-8">Add ingredients to discover what masterpiece you can create today.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
             <div className="md:col-span-2">
                 <IngredientInput onAddIngredient={handleAddIngredient} />
            </div>
            <div className="w-full">
              <label htmlFor="difficulty" className="block text-sm font-medium text-[#2C3E50] mb-2">Difficulty</label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#F39C12] focus:border-[#F39C12] transition duration-200"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={handleSuggestIngredient}
                disabled={isSuggesting}
                className="inline-flex items-center justify-center w-full sm:w-auto h-12 px-5 bg-[#1ABC9C] text-white font-semibold rounded-xl shadow-sm hover:bg-[#16A085] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1ABC9C] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                aria-label="Suggest a random ingredient"
              >
                {isSuggesting ? (
                  <>
                    <LoadingSpinner />
                    <span>Suggesting...</span>
                  </>
                ) : (
                  <>
                    <SparkleIcon className="w-5 h-5 mr-2" />
                    Suggest Ingredient
                  </>
                )}
              </button>
              {ingredients.length > 0 && (
                <button
                  onClick={handleClearAllIngredients}
                  className="inline-flex items-center justify-center w-full sm:w-auto h-12 px-5 bg-red-500 text-white font-semibold rounded-xl shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105"
                  aria-label="Clear all ingredients"
                >
                  <BroomIcon className="w-5 h-5 mr-2" />
                  Clear All
                </button>
              )}
            </div>

          <IngredientList ingredients={ingredients} onRemoveIngredient={handleRemoveIngredient} />

          <div className="mt-8 text-center">
            <button
              onClick={handleGenerateRecipes}
              disabled={isLoading || ingredients.length === 0}
              className="inline-flex items-center justify-center w-full md:w-auto px-12 py-4 bg-gradient-to-r from-[#F39C12] to-[#E67E22] text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F39C12] disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span>Creating Magic...</span>
                </>
              ) : (
                <>
                  <ChefHatIcon className="w-6 h-6 mr-3" />
                  Generate Recipes
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          {error && <div className="text-center p-4 bg-red-100 text-red-700 rounded-xl shadow-md">{error}</div>}
          
          {recipes.length === 0 && !isLoading && !error && (
            <EmptyState />
          )}

          <div className="space-y-8">
            {recipes.map((recipe, index) => (
              <RecipeCard key={index} recipe={recipe} />
            ))}
          </div>
        </div>
      </main>
       <footer className="text-center py-8 mt-8 text-gray-500 text-sm">
        <p>Powered by the Gemini API. Happy Cooking!</p>
      </footer>
    </div>
  );
};

export default App;