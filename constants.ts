import { ShapeStyle, LevelConfig } from './types';

export const SHAPES: ShapeStyle[] = [
  { id: 'circle', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-500' },
  { id: 'square', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-500' },
  { id: 'triangle', color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-500' },
  { id: 'diamond', color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-500' },
  { id: 'star', color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-500' },
  { id: 'hexagon', color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-500' },
];

export const LEVELS: LevelConfig[] = [
  { id: 1, structure: ['M'], points: 100, label: 'Basic Single Switch' },
  { id: 2, structure: ['F', 'M'], points: 200, label: 'Fixed -> Mystery' },
  { id: 3, structure: ['M', 'F'], points: 200, label: 'Mystery -> Fixed' },
  { id: 4, structure: ['F', 'M', 'F'], points: 300, label: 'Fixed -> Mystery -> Fixed' },
  { id: 5, structure: ['F', 'F', 'M'], points: 350, label: 'Double Fixed -> Mystery' },
  { id: 6, structure: ['M', 'F', 'F'], points: 350, label: 'Mystery -> Double Fixed' },
  { id: 7, structure: ['M', 'M'], points: 500, label: 'Double Mystery' }, 
  { id: 8, structure: ['F', 'M', 'M'], points: 600, label: 'Fixed -> Double Mystery' }, 
  { id: 9, structure: ['M', 'M', 'F'], points: 600, label: 'Double Mystery -> Fixed' }, 
  { id: 10, structure: ['F', 'M', 'M', 'F'], points: 800, label: 'Hard Core Chain' }, 
  { id: 11, structure: ['F', 'M', 'F', 'M'], points: 1000, label: 'Expert Mixed' }, 
];
