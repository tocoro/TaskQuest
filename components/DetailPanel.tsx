import React, { useState, useEffect } from 'react';
import { TaskNode, Language } from '../types';
import { UI_TEXT } from '../constants';

interface DetailPanelProps {
  node: TaskNode | undefined;
  pawnAtNode: boolean;
  onGenerate: () => void;
  onComplete: () => void;
  onMove: () => void;
  onUpdateNode: (id: string, updates: Partial<TaskNode>) => void;
  onDeleteNode: (id: string) => void;
  onCreateBranches: (parentId: string, branches: string[]) => void;
  isGenerating: boolean;
  canMove: boolean;
  language: Language;
  isGmMode: boolean;
  flags: Record<string, boolean>;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ 
  node, 
  pawnAtNode, 
  onGenerate, 
  onComplete, 
  onMove,
  onUpdateNode,
  onDeleteNode,
  onCreateBranches,
  isGenerating,
  canMove,
  language,
  isGmMode,
  flags
}) => {
  const text = UI_TEXT[language];

  // Local state for basic editing
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDifficulty, setEditDifficulty] = useState(1);
  const [editType, setEditType] = useState<TaskNode['type']>('task');

  // Local state for logic editing
  const [editReqFlag, setEditReqFlag] = useState('');
  const [editOnCompleteFlag, setEditOnCompleteFlag] = useState('');
  const [editCondFlag, setEditCondFlag] = useState('');
  const [editCondTitle, setEditCondTitle] = useState('');
  const [editCondDesc, setEditCondDesc] = useState('');

  // Local state for branching
  const [branch1, setBranch1] = useState('');
  const [branch2, setBranch2] = useState('');
  const [branch3, setBranch3] = useState('');

  // Sync local state when node changes
  useEffect(() => {
    if (node) {
      setEditTitle(node.title);
      setEditDesc(node.description);
      setEditDifficulty(node.difficulty);
      setEditType(node.type);
      setEditReqFlag(node.requiredFlag || '');
      setEditOnCompleteFlag(node.onCompleteFlag || '');
      setEditCondFlag(node.conditionFlag || '');
      setEditCondTitle(node.conditionTitle || '');
      setEditCondDesc(node.conditionDesc || '');
      setBranch1('');
      setBranch2('');
      setBranch3('');
    }
  }, [node]);

  if (!node) {
    return (
      <div className={`fixed right-0 top-0 h-full w-80 border-l p-6 flex flex-col justify-center items-center backdrop-blur-md z-50 transition-colors duration-500 ${isGmMode ? 'bg-slate-900/95 border-red-900/50' : 'bg-slate-900/95 border-slate-700'}`}>
        <p className={isGmMode ? "text-red-400/50" : "text-slate-500"}>Select a tile</p>
      </div>
    );
  }

  const handleSave = () => {
    onUpdateNode(node.id, {
        title: editTitle,
        description: editDesc,
        difficulty: editDifficulty,
        type: editType,
        requiredFlag: editReqFlag,
        onCompleteFlag: editOnCompleteFlag,
        conditionFlag: editCondFlag,
        conditionTitle: editCondTitle,
        conditionDesc: editCondDesc
    });
  };

  const handleDelete = () => {
      if(window.confirm("Delete this node?")) {
          onDeleteNode(node.id);
      }
  };

  const handleCreateBranches = () => {
      const branches = [branch1, branch2, branch3].filter(b => b.trim() !== '');
      if (branches.length > 0) {
          onCreateBranches(node.id, branches);
          setBranch1('');
          setBranch2('');
          setBranch3('');
      }
  };

  const isCompleted = node.status === 'completed';
  
  // Conditional rendering check
  const showConditionalContent = node.conditionFlag && flags[node.conditionFlag];
  const displayTitle = showConditionalContent ? (node.conditionTitle || node.title) : node.title;
  const displayDesc = showConditionalContent ? (node.conditionDesc || node.description) : node.description;
  const isLocked = node.requiredFlag && !flags[node.requiredFlag];

  // --- GM MODE: EDIT VIEW ---
  if (isGmMode) {
      return (
        <div className="fixed right-0 top-0 h-full w-80 bg-slate-900/95 border-l border-red-900/50 text-white p-6 flex flex-col backdrop-blur-md z-50 shadow-2xl transition-transform duration-300">
            <div className="flex-1 overflow-y-auto space-y-6 pb-20">
                <div className="flex items-center justify-between border-b border-red-900/30 pb-2">
                    <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-red-900 text-red-200 border border-red-700">
                        {text.editNode}
                    </span>
                    <span className="text-slate-500 text-[10px] font-mono">{node.id.slice(-6)}</span>
                </div>

                {/* BASIC INFO */}
                <div className="space-y-3">
                    <div>
                        <label className="block text-[10px] uppercase text-slate-500 mb-1">Node Type</label>
                        <select value={editType} onChange={(e) => setEditType(e.target.value as any)} className="w-full bg-slate-950 border border-red-900/50 rounded p-2 text-sm focus:border-red-500 focus:outline-none">
                            <option value="task">Task</option>
                            <option value="blank">Blank (Connector)</option>
                            <option value="boss">Boss</option>
                            <option value="start">Start</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase text-slate-500 mb-1">{text.taskTitle}</label>
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-slate-950 border border-red-900/50 rounded p-2 text-sm focus:border-red-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-slate-500 mb-1">{text.difficulty}</label>
                        <input type="number" min="1" max="5" value={editDifficulty} onChange={(e) => setEditDifficulty(parseInt(e.target.value) || 1)} className="w-full bg-slate-950 border border-red-900/50 rounded p-2 text-sm focus:border-red-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-slate-500 mb-1">{text.taskDesc}</label>
                        <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full bg-slate-950 border border-red-900/50 rounded p-2 text-sm h-24 focus:border-red-500 focus:outline-none resize-none" />
                    </div>
                </div>

                {/* LOGIC & FLAGS */}
                <div className="bg-red-950/20 p-3 rounded border border-red-900/30 space-y-3">
                    <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">Logic & Flags</h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] uppercase text-slate-500 mb-1">Req Flag (Lock)</label>
                            <input type="text" placeholder="KEY_NAME" value={editReqFlag} onChange={(e) => setEditReqFlag(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs focus:border-red-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-slate-500 mb-1">Reward Flag</label>
                            <input type="text" placeholder="KEY_NAME" value={editOnCompleteFlag} onChange={(e) => setEditOnCompleteFlag(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs focus:border-red-500" />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-red-900/30">
                        <label className="block text-[10px] uppercase text-slate-500 mb-1">Condition Flag (If True)</label>
                        <input type="text" placeholder="KEY_NAME" value={editCondFlag} onChange={(e) => setEditCondFlag(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs focus:border-red-500 mb-2" />
                        
                        <input type="text" placeholder="Alt Title" value={editCondTitle} onChange={(e) => setEditCondTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs focus:border-red-500 mb-1" />
                        <textarea placeholder="Alt Description" value={editCondDesc} onChange={(e) => setEditCondDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs focus:border-red-500 h-16 resize-none" />
                    </div>
                </div>

                 {/* BRANCH GENERATOR */}
                 <div className="bg-slate-800/30 p-3 rounded border border-slate-700 space-y-2">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Branch Creator</h3>
                    <input type="text" placeholder="Branch 1 Title" value={branch1} onChange={(e) => setBranch1(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs" />
                    <input type="text" placeholder="Branch 2 Title" value={branch2} onChange={(e) => setBranch2(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs" />
                    <input type="text" placeholder="Branch 3 Title" value={branch3} onChange={(e) => setBranch3(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs" />
                    <button onClick={handleCreateBranches} className="w-full py-1 bg-blue-900/50 hover:bg-blue-800 border border-blue-700 text-blue-100 text-xs rounded transition-colors">
                        Spawn Branches
                    </button>
                 </div>

                {/* ACTIONS */}
                <div className="pt-4 space-y-3">
                    <button onClick={handleSave} className="w-full py-2 bg-red-700 hover:bg-red-600 text-white rounded font-bold transition-colors shadow-lg shadow-red-900/20">
                        {text.saveChanges}
                    </button>
                    {node.type !== 'start' && (
                        <button onClick={handleDelete} className="w-full py-2 border border-red-900 text-red-500 hover:bg-red-900/20 rounded font-bold transition-colors text-xs">
                            {text.deleteNode}
                        </button>
                    )}
                </div>
            </div>
        </div>
      );
  }

  // --- PLAYER MODE: VIEW ---
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
          {displayTitle || (node.type === 'blank' ? "(Empty Node)" : "")}
        </h2>
        
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-6 relative overflow-hidden">
          {showConditionalContent && (
             <div className="absolute top-0 right-0 p-1 bg-purple-500/20 text-[10px] text-purple-300 rounded-bl">Alt</div>
          )}
          <h3 className="text-xs uppercase tracking-wider text-slate-400 mb-2">{text.brief}</h3>
          <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
            {displayDesc || (node.type === 'blank' ? "No description." : "")}
          </p>
        </div>
        
        {isLocked && (
            <div className="mb-4 p-3 bg-red-950/30 border border-red-900 rounded text-red-400 text-xs flex items-center gap-2">
                <span>🔒</span>
                <span>LOCKED: Requires <span className="font-mono bg-red-900/50 px-1 rounded">{node.requiredFlag}</span></span>
            </div>
        )}

        {/* Action Section */}
        <div className="space-y-4">
          {!pawnAtNode && canMove && !isLocked && (
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

          {pawnAtNode && !isCompleted && node.type !== 'blank' && (
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