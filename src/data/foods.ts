// Common foods per 100 g (cooked where noted). Approximate values compiled from the Brazilian TACO table
// (NEPA/UNICAMP) and USDA FoodData Central. Labels of branded products vary — check yours.
import type { Food } from '../core/types';

const F = (
  id: string, pt: string, en: string, es: string, cat: Food['cat'],
  kcal: number, p: number, c: number, f: number,
  unit?: [number, string, string, string],
): Food => ({ id, pt, en, es, cat, kcal, p, c, f, ...(unit ? { unit: { g: unit[0], pt: unit[1], en: unit[2], es: unit[3] } } : {}) });

export const FOODS: Food[] = [
  // Proteins
  F('chicken', 'Peito de frango grelhado', 'Grilled chicken breast', 'Pechuga de pollo a la plancha', 'protein', 159, 32, 0, 2.5, [100, 'filé médio', 'medium fillet', 'filete mediano']),
  F('beef_lean', 'Patinho grelhado', 'Lean beef (top round), grilled', 'Carne magra a la plancha', 'protein', 219, 35.9, 0, 7.3),
  F('ground_beef', 'Carne moída (patinho) refogada', 'Lean ground beef, cooked', 'Carne picada magra', 'protein', 212, 35.9, 0, 6.7),
  F('tilapia', 'Tilápia grelhada', 'Tilapia, grilled', 'Tilapia a la plancha', 'protein', 128, 26, 0, 2.7),
  F('salmon', 'Salmão grelhado', 'Salmon, grilled', 'Salmón a la plancha', 'protein', 208, 22, 0, 13),
  F('tuna', 'Atum em água (lata)', 'Canned tuna in water', 'Atún al natural', 'protein', 116, 26, 0, 1, [120, 'lata drenada', 'drained can', 'lata escurrida']),
  F('egg', 'Ovo inteiro cozido', 'Whole egg, boiled', 'Huevo entero cocido', 'protein', 146, 13.3, 0.6, 9.5, [50, 'unidade', 'egg', 'unidad']),
  F('egg_white', 'Clara de ovo', 'Egg white', 'Clara de huevo', 'protein', 52, 10.9, 0.7, 0.2, [33, 'clara', 'white', 'clara']),
  F('whey', 'Whey protein (concentrado)', 'Whey protein concentrate', 'Proteína de suero', 'protein', 400, 78, 8, 6, [30, 'scoop', 'scoop', 'scoop']),
  F('pork_loin', 'Lombo suíno assado', 'Pork loin, roasted', 'Lomo de cerdo asado', 'protein', 210, 35.7, 0, 6.4),
  F('turkey', 'Peito de peru', 'Turkey breast', 'Pechuga de pavo', 'protein', 135, 29, 0, 1.7),
  F('tofu', 'Tofu firme', 'Firm tofu', 'Tofu firme', 'protein', 144, 15.8, 2.8, 8.7),
  F('shrimp', 'Camarão cozido', 'Shrimp, cooked', 'Camarón cocido', 'protein', 99, 24, 0.2, 0.3),
  // Dairy
  F('milk_skim', 'Leite desnatado', 'Skim milk', 'Leche desnatada', 'dairy', 35, 3.4, 4.9, 0.1, [200, 'copo (200 ml)', 'glass (200 ml)', 'vaso (200 ml)']),
  F('milk_whole', 'Leite integral', 'Whole milk', 'Leche entera', 'dairy', 61, 3.2, 4.7, 3.3, [200, 'copo (200 ml)', 'glass (200 ml)', 'vaso (200 ml)']),
  F('greek_yogurt', 'Iogurte grego natural (light)', 'Greek yogurt, plain nonfat', 'Yogur griego natural', 'dairy', 59, 10, 3.6, 0.4, [170, 'pote', 'cup', 'envase']),
  F('cottage', 'Queijo cottage', 'Cottage cheese', 'Requesón', 'dairy', 98, 11, 3.4, 4.3),
  F('cheese_mozz', 'Queijo muçarela', 'Mozzarella cheese', 'Queso mozzarella', 'dairy', 330, 22.6, 3, 25.2, [20, 'fatia', 'slice', 'loncha']),
  F('cheese_white', 'Queijo minas frescal', 'Fresh white cheese', 'Queso fresco', 'dairy', 264, 17.4, 3.2, 20.2, [30, 'fatia', 'slice', 'loncha']),
  // Carbs
  F('rice_white', 'Arroz branco cozido', 'White rice, cooked', 'Arroz blanco cocido', 'carb', 128, 2.5, 28.1, 0.2, [150, 'escumadeira cheia', 'cup', 'taza']),
  F('rice_brown', 'Arroz integral cozido', 'Brown rice, cooked', 'Arroz integral cocido', 'carb', 124, 2.6, 25.8, 1, [150, 'escumadeira cheia', 'cup', 'taza']),
  F('beans', 'Feijão carioca cozido', 'Pinto beans, cooked', 'Frijoles pintos cocidos', 'carb', 76, 4.8, 13.6, 0.5, [86, 'concha', 'ladle', 'cucharón']),
  F('black_beans', 'Feijão preto cozido', 'Black beans, cooked', 'Frijoles negros cocidos', 'carb', 77, 4.5, 14, 0.5, [86, 'concha', 'ladle', 'cucharón']),
  F('lentils', 'Lentilha cozida', 'Lentils, cooked', 'Lentejas cocidas', 'carb', 93, 6.3, 16.3, 0.5),
  F('pasta', 'Macarrão cozido', 'Pasta, cooked', 'Pasta cocida', 'carb', 158, 5.8, 30.9, 0.9),
  F('potato', 'Batata inglesa cozida', 'Potato, boiled', 'Papa cocida', 'carb', 52, 1.2, 11.9, 0),
  F('sweet_potato', 'Batata-doce cozida', 'Sweet potato, boiled', 'Batata cocida', 'carb', 77, 0.6, 18.4, 0.1),
  F('cassava', 'Mandioca cozida', 'Cassava, boiled', 'Yuca cocida', 'carb', 125, 0.6, 30.1, 0.3),
  F('oats', 'Aveia em flocos', 'Rolled oats', 'Avena en hojuelas', 'carb', 394, 13.9, 66.6, 8.5, [30, '3 colheres de sopa', '1/3 cup', '3 cucharadas']),
  F('bread', 'Pão francês', 'French roll', 'Pan francés', 'carb', 300, 8, 58.6, 3.1, [50, 'unidade', 'roll', 'unidad']),
  F('bread_whole', 'Pão de forma integral', 'Whole wheat bread', 'Pan integral', 'carb', 253, 9.4, 49.9, 3.7, [25, 'fatia', 'slice', 'rebanada']),
  F('tapioca', 'Tapioca (goma hidratada)', 'Tapioca starch (hydrated)', 'Tapioca', 'carb', 240, 0, 59, 0, [50, 'tapioca média', 'crepe', 'crepa']),
  F('couscous', 'Cuscuz de milho cozido', 'Corn couscous, cooked', 'Cuscús de maíz', 'carb', 113, 2.2, 25.3, 0.7),
  F('corn', 'Milho verde cozido', 'Sweet corn, cooked', 'Maíz cocido', 'carb', 98, 3.2, 17.1, 2.4),
  F('granola', 'Granola', 'Granola', 'Granola', 'carb', 421, 10, 66, 13),
  F('rice_cake', 'Biscoito de arroz', 'Rice cake', 'Galleta de arroz', 'carb', 387, 8, 81, 3, [9, 'unidade', 'cake', 'unidad']),
  // Fruits
  F('banana', 'Banana prata', 'Banana', 'Plátano', 'fruit', 98, 1.3, 26, 0.1, [70, 'unidade', 'banana', 'unidad']),
  F('apple', 'Maçã', 'Apple', 'Manzana', 'fruit', 56, 0.3, 15.2, 0, [130, 'unidade', 'apple', 'unidad']),
  F('orange', 'Laranja', 'Orange', 'Naranja', 'fruit', 37, 1, 8.9, 0.1, [180, 'unidade', 'orange', 'unidad']),
  F('papaya', 'Mamão papaia', 'Papaya', 'Papaya', 'fruit', 40, 0.5, 10.4, 0.1),
  F('mango', 'Manga', 'Mango', 'Mango', 'fruit', 64, 0.4, 16.7, 0.3),
  F('strawberry', 'Morango', 'Strawberry', 'Fresa', 'fruit', 30, 0.9, 6.8, 0.3),
  F('pineapple', 'Abacaxi', 'Pineapple', 'Piña', 'fruit', 48, 0.9, 12.3, 0.1),
  F('grapes', 'Uva', 'Grapes', 'Uvas', 'fruit', 53, 0.7, 13.6, 0.2),
  F('acai', 'Açaí (polpa, sem açúcar)', 'Açaí pulp, unsweetened', 'Pulpa de açaí', 'fruit', 58, 0.8, 6.2, 3.9),
  F('dates', 'Tâmara seca', 'Dates, dried', 'Dátiles', 'fruit', 282, 2.5, 75, 0.4),
  // Vegetables
  F('broccoli', 'Brócolis cozido', 'Broccoli, cooked', 'Brócoli cocido', 'veg', 25, 2.1, 4.4, 0.5),
  F('salad', 'Salada de folhas', 'Leafy salad', 'Ensalada verde', 'veg', 15, 1.3, 2.6, 0.2),
  F('tomato', 'Tomate', 'Tomato', 'Tomate', 'veg', 15, 1.1, 3.1, 0.2),
  F('carrot', 'Cenoura crua', 'Carrot, raw', 'Zanahoria', 'veg', 34, 1.3, 7.7, 0.2),
  F('zucchini', 'Abobrinha cozida', 'Zucchini, cooked', 'Calabacín cocido', 'veg', 15, 1.1, 3, 0.2),
  F('spinach', 'Espinafre refogado', 'Spinach, sautéed', 'Espinaca salteada', 'veg', 67, 2.7, 4.2, 5.4),
  // Fats
  F('olive_oil', 'Azeite de oliva', 'Olive oil', 'Aceite de oliva', 'fat', 884, 0, 0, 100, [8, 'colher de sopa', 'tablespoon', 'cucharada']),
  F('peanut_butter', 'Pasta de amendoim', 'Peanut butter', 'Mantequilla de maní', 'fat', 588, 25, 20, 50, [15, 'colher de sopa', 'tablespoon', 'cucharada']),
  F('avocado', 'Abacate', 'Avocado', 'Aguacate', 'fat', 96, 1.2, 6, 8.4),
  F('nuts', 'Castanha-de-caju', 'Cashew nuts', 'Anacardos', 'fat', 570, 18.5, 29.1, 46.3, [20, 'punhado', 'handful', 'puñado']),
  F('brazil_nut', 'Castanha-do-pará', 'Brazil nuts', 'Nueces de Brasil', 'fat', 643, 14.5, 15.1, 63.5, [5, 'unidade', 'nut', 'unidad']),
  F('almonds', 'Amêndoas', 'Almonds', 'Almendras', 'fat', 579, 21, 22, 50, [20, 'punhado', 'handful', 'puñado']),
  F('chia', 'Chia', 'Chia seeds', 'Semillas de chía', 'fat', 486, 16.5, 42, 30.7, [12, 'colher de sopa', 'tablespoon', 'cucharada']),
  F('butter', 'Manteiga', 'Butter', 'Mantequilla', 'fat', 726, 0.4, 0, 82.4, [10, 'colher de chá cheia', 'pat', 'porción']),
  F('dark_choc', 'Chocolate 70%', 'Dark chocolate 70%', 'Chocolate 70%', 'fat', 579, 7.8, 46, 41, [10, 'quadradinho', 'square', 'cuadradito']),
];

export const FOOD_BY_ID: Record<string, Food | undefined> = Object.fromEntries(FOODS.map((f) => [f.id, f]));
