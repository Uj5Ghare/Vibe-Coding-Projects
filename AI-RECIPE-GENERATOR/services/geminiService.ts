
import { GoogleGenAI, Type } from "@google/genai";
import type { Recipe, Difficulty } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const recipeSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            recipeName: {
                type: Type.STRING,
                description: "The name of the recipe."
            },
            description: {
                type: Type.STRING,
                description: "A short, appetizing description of the dish."
            },
            difficulty: {
                type: Type.STRING,
                enum: ['Easy', 'Medium', 'Hard'],
                description: "The difficulty level to prepare the recipe."
            },
            ingredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of ingredients required for the recipe, including quantities."
            },
            instructions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Step-by-step instructions to prepare the recipe."
            },
        },
        required: ["recipeName", "description", "difficulty", "ingredients", "instructions"]
    }
};

export const generateRecipes = async (ingredients: string[], difficulty: Difficulty): Promise<Recipe[]> => {
    const ingredientsString = ingredients.join(', ');
    const prompt = `You are a creative chef. Based on the following ingredients: ${ingredientsString}, generate three distinct recipes with a difficulty level of '${difficulty}'. 
    You can assume common pantry staples like salt, pepper, oil, and water are available. Do not use any ingredients not on the list unless they are these common staples.
    Provide the output in a valid JSON format according to the provided schema.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const recipes = JSON.parse(jsonText) as Recipe[];

        if (!Array.isArray(recipes)) {
            throw new Error("API did not return a valid array of recipes.");
        }
        return recipes;

    } catch (error) {
        console.error("Error generating recipes:", error);
        throw new Error("Failed to communicate with the AI chef. Please try again.");
    }
};
