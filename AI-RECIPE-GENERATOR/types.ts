
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Recipe {
  recipeName: string;
  description: string;
  difficulty: Difficulty;
  ingredients: string[];
  instructions: string[];
}
