import type { MenuItem } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id);

export const menuItems: MenuItem[] = [
  // Burgers
  {
    id: 1,
    name: 'Veg Tikki Burger',
    description: 'Classic Indian street food flavors in a burger.',
    price: 149,
    image: getImage('veg-tikki-burger')?.imageUrl || '',
    imageHint: getImage('veg-tikki-burger')?.imageHint || ''
  },
  {
    id: 2,
    name: 'Paneer Burger',
    description: 'A succulent paneer patty grilled to perfection.',
    price: 179,
    image: getImage('paneer-burger')?.imageUrl || '',
    imageHint: getImage('paneer-burger')?.imageHint || ''
  },
  {
    id: 3,
    name: 'Chicken Zinger Burger',
    description: 'Crispy, spicy chicken fillet that packs a punch.',
    price: 179,
    image: getImage('chicken-zinger-burger')?.imageUrl || '',
    imageHint: getImage('chicken-zinger-burger')?.imageHint || ''
  },
  {
    id: 4,
    name: 'Chicken Crispy Burger',
    description: 'Golden-fried crispy chicken patty with a satisfying crunch.',
    price: 179,
    image: getImage('chicken-crispy-burger')?.imageUrl || '',
    imageHint: getImage('chicken-crispy-burger')?.imageHint || ''
  },
  {
    id: 5,
    name: 'Chicken Smash Grill Burger',
    description: 'Juicy smashed and grilled chicken for max flavor.',
    price: 179,
    image: getImage('chicken-smash-grill-burger')?.imageUrl || '',
    imageHint: getImage('chicken-smash-grill-burger')?.imageHint || ''
  },
  {
    id: 6,
    name: 'Cheese Chicken Burger',
    description: 'A delicious chicken burger with a slice of melted cheese.',
    price: 179,
    image: getImage('cheese-chicken-burger')?.imageUrl || '',
    imageHint: getImage('cheese-chicken-burger')?.imageHint || ''
  },
  {
    id: 7,
    name: 'Chicken Peri Peri Burger',
    description: 'Spicy and tangy peri peri marinated chicken burger.',
    price: 179,
    image: getImage('chicken-peri-peri-burger')?.imageUrl || '',
    imageHint: getImage('chicken-peri-peri-burger')?.imageHint || ''
  },
  // Fries
  {
    id: 8,
    name: 'Classic Fries',
    description: 'Perfectly salted, golden and crispy french fries.',
    price: 79,
    image: getImage('classic-fries')?.imageUrl || '',
    imageHint: getImage('classic-fries')?.imageHint || ''
  },
  {
    id: 9,
    name: 'Peri Peri Fries',
    description: 'Classic fries tossed in a spicy peri peri seasoning.',
    price: 99,
    image: getImage('peri-peri-fries')?.imageUrl || '',
    imageHint: getImage('peri-peri-fries')?.imageHint || ''
  },
  {
    id: 10,
    name: 'Cheesy Fries',
    description: 'Golden fries smothered in rich, melted cheese.',
    price: 129,
    image: getImage('cheesy-fries')?.imageUrl || '',
    imageHint: getImage('cheesy-fries')?.imageHint || ''
  },
  {
    id: 11,
    name: 'Saucy Fries',
    description: 'Crispy fries drizzled with our special house sauces.',
    price: 149,
    image: getImage('saucy-fries')?.imageUrl || '',
    imageHint: getImage('saucy-fries')?.imageHint || ''
  },
  // Drinks
  {
    id: 12,
    name: 'Water (500ml)',
    description: 'A refreshing bottle of chilled mineral water.',
    price: 10,
    image: getImage('water-bottle')?.imageUrl || '',
    imageHint: getImage('water-bottle')?.imageHint || ''
  },
  {
    id: 13,
    name: 'Soft Drinks (200ml)',
    description: 'Choose from a selection of popular sodas.',
    price: 20,
    image: getImage('soft-drink')?.imageUrl || '',
    imageHint: getImage('soft-drink')?.imageHint || ''
  },
  {
    id: 14,
    name: 'Mojito',
    description: 'A classic and refreshing mix of mint and lime.',
    price: 80,
    image: getImage('mojito')?.imageUrl || '',
    imageHint: getImage('mojito')?.imageHint || ''
  },
  // Sides
  {
    id: 15,
    name: 'Bread',
    description: 'A side of warm, soft bread.',
    price: 25,
    image: getImage('bread')?.imageUrl || '',
    imageHint: getImage('bread')?.imageHint || ''
  },
  {
    id: 16,
    name: 'Falafel',
    description: 'Crispy, flavorful chickpea fritters.',
    price: 79,
    image: getImage('falafel')?.imageUrl || '',
    imageHint: getImage('falafel')?.imageHint || ''
  },
  {
    id: 17,
    name: 'Extra Chicken',
    description: 'Add a side of our juicy grilled chicken.',
    price: 99,
    image: getImage('extra-chicken')?.imageUrl || '',
    imageHint: getImage('extra-chicken')?.imageHint || ''
  }
];
