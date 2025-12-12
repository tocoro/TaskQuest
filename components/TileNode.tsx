import React from 'react';
import { TaskNode, Language } from '../types';
import { TILE_SIZE, UI_TEXT } from '../constants';

interface TileNodeProps {
  node: TaskNode;
  isFocused: boolean;
  isPawnHere: boolean;
  language: Language;
  onClick: (id: string) => void;
}

export const TileNode: React.FC<TileNodeProps> = ({ node, isFocused, isPawnHere, language, onClick }) => {
  const text = UI_TEXT[language];

  // Calculate distinct visual styles based on status
  const getStatusColor = () => {
    if (node.status === 'completed') return 'bg-emerald-900 border-emerald-500 text-emerald-100';
    if (node.status === 'locked') return 'bg-gray-800 border-gray-600 text-gray-500 opacity-70';
    if (node.type === 'boss') return 'bg-red-900 border-red-500 text-red-100';
    if (node.type === 'start') return 'bg-indigo-900 border-indigo-500 text-indigo-100';
    return 'bg-slate-800 border-slate-500 text-slate-200'; // available
  };

  const baseClasses = `absolute flex flex-col items-center justify-center p-2 border-2 rounded-lg shadow-lg transition-all duration-300 cursor-pointer select-none backdrop-blur-sm`;
  
  const focusClasses = isFocused 
    ? 'ring-4 ring-yellow-400 scale-110 z-20 shadow-[0_0_20px_rgba(250,204,21,0.5)]' 
    : 'z-10 hover:scale-105';

  const pawnClasses = isPawnHere 
    ? 'shadow-[0_0_30px_rgba(59,130,246,0.6)]' 
    : '';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(node.id);
      }}
      className={`${baseClasses} ${getStatusColor()} ${focusClasses} ${pawnClasses}`}
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
      }}
    >
      <div className="text-[10px] font-bold tracking-widest uppercase opacity-60 mb-1">
        {node.type === 'start' ? text.base : `${text.lvl} ${node.difficulty}`}
      </div>
      <div className="text-center font-bold text-xs leading-tight line-clamp-3">
        {node.title}
      </div>
      
      {node.status === 'completed' && (
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-black rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-white">
          ✓
        </div>
      )}
    </div>
  );
};
