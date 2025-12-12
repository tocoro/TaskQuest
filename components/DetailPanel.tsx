import React from 'react';
import { TaskNode, Language } from '../types';
import { UI_TEXT } from '../constants';

interface DetailPanelProps {
  node: TaskNode | undefined;
  pawnAtNode: boolean;
  onGenerate: () => void;
  onComplete: () => void;
  onMove: () => void;
  isGenerating: boolean;
  canMove: boolean;
  language: Language;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ 
  node, 
  pawnAtNode, 
  onGenerate, 
  onComplete, 
  onMove,
  isGenerating,
  canMove,
  language
}) => {
  const text = UI_TEXT[language];

  if (!node) {
    return (
      <div className="fixed right-0 top-0 h-full w-80 bg-slate-900/95 border-l border-slate-700 text-white p-6 flex flex-col justify-center items-center backdrop-blur-md z-50">
        <p className="text-slate-500">Select a tile</p>
      </div>
    );
  }

  const isCompleted = node.status === 'completed';

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-slate-900/95 border-l border-slate-700 text-white p-6 flex flex-col backdrop-blur-md z-50 shadow-2xl transition-transform duration-300">
      <div className="flex-1 overflow-y-auto">
        <div className="mb-2 flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${node.status === 'completed' ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                {node.status}
            </span>
            <span className="text-slate-400 text-xs">{text.xp}: {node.difficulty * 20}</span>
        </div>
        
        <h2 className="text-2xl font-bold mb-4 font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          {node.title}
        </h2>
        
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-6">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">{text.brief}</h3>
          <p className="text-sm leading-relaxed text-slate-300">
            {node.description}
          </p>
        </div>

        {/* Action Section */}
        <div className="space-y-4">
          {!pawnAtNode && canMove && (
             <button
             onClick={onMove}
             className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
           >
             <span>{text.travel}</span>
             <kbd className="hidden sm:inline-block px-2 py-0.5 bg-blue-800 rounded text-xs">{text.enter}</kbd>
           </button>
          )}

          {!pawnAtNode && !canMove && node.status !== 'completed' && (
             <div className="p-3 border border-red-900/50 bg-red-900/20 text-red-300 text-xs rounded text-center">
                {text.tooFar}
             </div>
          )}

          {pawnAtNode && !isCompleted && (
            <button
              onClick={onComplete}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse hover:animate-none"
            >
              {text.complete}
            </button>
          )}
          
          {pawnAtNode && isCompleted && (
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className={`w-full py-3 border-2 border-dashed border-purple-500 hover:border-purple-400 hover:bg-purple-900/20 text-purple-300 rounded-md font-bold transition-all flex items-center justify-center gap-2 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isGenerating ? (
                <>
                   <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {text.scouting}
                </>
              ) : (
                <>
                  <span>{text.scout}</span>
                  <span className="text-xs opacity-60">{text.genAi}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-700">
        <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">{text.controls}</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-600">WASD</kbd>
            <span>{text.pan}</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-600">Arrows</kbd>
            <span>{text.focus}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
