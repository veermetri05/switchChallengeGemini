import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ShapeStyle } from '../types';
import { ShapeIcon } from './ShapeIcon';

interface ShapeRowProps {
  shapes: ShapeStyle[];
  label?: string;
}

export const ShapeRow: React.FC<ShapeRowProps> = ({ shapes }) => (
  <div className="flex flex-col items-center w-full">
    <div className="flex justify-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200 w-full max-w-[280px]">
      {shapes.map((shape, idx) => (
        <div key={idx} className={`relative flex items-center justify-center w-10 h-10 rounded-md border ${shape.bg} ${shape.border} ${shape.color}`}>
          <ShapeIcon type={shape.id} />
          <span className="absolute -bottom-5 text-[10px] font-bold text-slate-400">{idx + 1}</span>
        </div>
      ))}
    </div>
  </div>
);

interface OperatorBoxProps {
  code: number[];
  type: 'M' | 'F';
}

export const OperatorBox: React.FC<OperatorBoxProps> = ({ code, type }) => {
  return (
    <div className={`w-full max-w-[280px] h-14 border-2 rounded-lg flex items-center justify-center ${type === 'M' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500'}`}>
      <span className="text-2xl font-mono font-black tracking-widest">{code.join('')}</span>
    </div>
  );
};

export const Arrow: React.FC = () => (
  <div className="flex justify-center py-1">
    <div className="text-slate-300"><ChevronRight className="w-5 h-5 rotate-90" /></div>
  </div>
);
