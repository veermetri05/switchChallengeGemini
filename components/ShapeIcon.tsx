import React from 'react';
import { ShapeType } from '../types';

interface ShapeIconProps {
  type: ShapeType;
  className?: string;
}

export const ShapeIcon: React.FC<ShapeIconProps> = ({ type, className = "w-full h-full p-1" }) => {
  const commonProps = { strokeWidth: 2.5, stroke: "currentColor", fill: "currentColor", fillOpacity: 0.2 };
  
  switch (type) {
    case 'circle': return <svg viewBox="0 0 24 24" className={className}><circle cx="12" cy="12" r="9" {...commonProps} /></svg>;
    case 'square': return <svg viewBox="0 0 24 24" className={className}><rect x="4" y="4" width="16" height="16" rx="2" {...commonProps} /></svg>;
    case 'triangle': return <svg viewBox="0 0 24 24" className={className}><path d="M12 3l9 18H3L12 3z" strokeLinejoin="round" {...commonProps} /></svg>;
    case 'diamond': return <svg viewBox="0 0 24 24" className={className}><path d="M12 2l10 10-10 10L2 12z" strokeLinejoin="round" {...commonProps} /></svg>;
    case 'star': return <svg viewBox="0 0 24 24" className={className}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" {...commonProps} /></svg>;
    case 'hexagon': return <svg viewBox="0 0 24 24" className={className}><path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z" strokeLinejoin="round" {...commonProps} /></svg>;
    default: return null;
  }
};
