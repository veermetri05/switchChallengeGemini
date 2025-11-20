import { SHAPES, LEVELS } from '../constants';
import { Puzzle, ShapeStyle, Layer } from '../types';

export const generateCode = (): number[] => {
  const array = [1, 2, 3, 4];
  // Fisher-Yates Shuffle to generate a random permutation
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const applyPermutation = (items: ShapeStyle[], code: number[]): ShapeStyle[] => {
  // The code represents positions. e.g. [4, 3, 2, 1] means:
  // 1st item of output is 4th item of input
  // 2nd item of output is 3rd item of input, etc.
  return code.map(positionIndex => items[positionIndex - 1]);
};

export const generateShapes = (count = 4): ShapeStyle[] => {
  const shuffled = [...SHAPES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const generatePuzzle = (levelIndex: number): Puzzle => {
  const safeIndex = Math.min(Math.max(0, levelIndex), LEVELS.length - 1);
  const levelConfig = LEVELS[safeIndex];
  const input = generateShapes();
  let currentShapes = input;
  let totalMystery = 0;

  const layers: Layer[] = levelConfig.structure.map(type => {
    const code = generateCode();
    // Apply transformation for next layer
    currentShapes = applyPermutation(currentShapes, code);
    
    let options: number[][] | null = null;
    
    if (type === 'M') {
      totalMystery++;
      options = [code];
      // Generate 3 unique decoys
      while (options.length < 4) {
        const decoy = generateCode();
        if (!options.some(o => o.join('') === decoy.join(''))) {
          options.push(decoy);
        }
      }
      // Shuffle options
      options = options.sort(() => 0.5 - Math.random());
    }
    
    return { 
      type, 
      code, 
      options, 
      isSolved: false, 
      userSelected: null 
    };
  });
  
  return {
    id: Date.now(),
    input,
    output: currentShapes,
    layers,
    totalMystery,
    levelConfig
  };
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
