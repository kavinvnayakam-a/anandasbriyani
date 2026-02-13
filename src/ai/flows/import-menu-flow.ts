'use server';
/**
 * @fileOverview AI flow for importing menu items from unstructured text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ImportMenuInputSchema = z.object({
  text: z.string().describe('The unstructured menu text to parse.'),
});

const MenuItemSchema = z.object({
  name: z.string().describe('The name of the menu item.'),
  price: z.number().describe('The price of the item in INR.'),
  category: z.string().describe('The category (e.g., Starters, Main Course, Beverages).'),
  description: z.string().describe('A short, appetizing description of the item.'),
});

const ImportMenuOutputSchema = z.object({
  items: z.array(MenuItemSchema).describe('The list of structured menu items extracted from the text.'),
});

export type ImportMenuOutput = z.infer<typeof ImportMenuOutputSchema>;

const prompt = ai.definePrompt({
  name: 'importMenuPrompt',
  input: { schema: ImportMenuInputSchema },
  output: { schema: ImportMenuOutputSchema },
  prompt: `You are an expert menu digitizer for "Dasara Fine Dine". 
  
  Your task is to take unstructured text (like a photo transcript or a handwritten list) and convert it into a structured JSON list of menu items.
  
  Instructions:
  1. Extract the name, price, category, and a brief description for each item.
  2. If the category is not explicitly mentioned for an item, infer it based on the item name (e.g., "Biryani" belongs in "Biryani & Rice").
  3. Ensure prices are numbers.
  4. If multiple items are found, include them all in the output array.
  
  Text to parse:
  {{{text}}}`,
});

export async function importMenu(text: string): Promise<ImportMenuOutput> {
  const result = await importMenuFlow({ text });
  return result;
}

const importMenuFlow = ai.defineFlow(
  {
    name: 'importMenuFlow',
    inputSchema: ImportMenuInputSchema,
    outputSchema: ImportMenuOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to parse the menu text.');
    }
    return output;
  }
);
