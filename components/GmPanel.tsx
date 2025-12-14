import React, { useState } from 'react';
import { Language } from '../types';
import { UI_TEXT } from '../constants';

interface GmPanelProps {
  language: Language;
  onAddManualTask: (title: string, desc: string, difficulty: number) => void;
  onBreakdown: () => void;
  onGenerateCampaign: (goal: string, milestones: string) => void;
  isProcessing: boolean;
}

export const GmPanel: React.FC<GmPanelProps> = ({
  language,
  onAddManualTask,
  onBreakdown,
  onGenerateCampaign,
  isProcessing
}) => {
  const ui = UI_TEXT[language];
  const [activeTab, setActiveTab] = useState<'none' | 'manual' | 'campaign'>('none');
  
  // Manual Task Form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  
  // Campaign Form
  const [goal, setGoal] = useState('');
  const [milestones, setMilestones] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(newTitle) {
        onAddManualTask(newTitle, newDesc, 1);
        setNewTitle('');
        setNewDesc('');
        setActiveTab('none');
    }
  };

  const handleCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(goal) {
        onGenerateCampaign(goal, milestones);
        setGoal('');
        setMilestones('');
        setActiveTab('none');
    }
  };

  return (
    <div className="fixed left-6 top-24 w-64 bg-slate-900/90 border border-slate-700 text-slate-200 rounded-lg backdrop-blur-md shadow-2xl p-4 z-40 transition-all">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-700">
        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
        <h2 className="font-bold text-red-400 tracking-wider">{ui.gmTools}</h2>
      </div>

      <div className="space-y-3">
        {/* Breakdown Button */}
        <button
          onClick={onBreakdown}
          disabled={isProcessing}
          className="w-full py-2 px-3 bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-700 rounded text-sm font-medium transition-colors flex items-center justify-between group"
        >
          <span>{ui.breakdown}</span>
          <span className="text-indigo-400 group-hover:text-white">✨</span>
        </button>

        {/* Manual Task Toggle */}
        <button
          onClick={() => setActiveTab(activeTab === 'manual' ? 'none' : 'manual')}
          className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors border text-left ${activeTab === 'manual' ? 'bg-slate-800 border-slate-500 text-white' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}
        >
          {ui.addTask}
        </button>

        {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="bg-slate-950/50 p-3 rounded border border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-2">
                <input 
                    type="text" 
                    placeholder={ui.taskTitle}
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                    required
                />
                <textarea 
                    placeholder={ui.taskDesc}
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm h-16 focus:outline-none focus:border-blue-500 resize-none"
                />
                <button type="submit" className="w-full bg-blue-700 hover:bg-blue-600 text-white text-xs py-1 rounded font-bold">
                    {ui.create}
                </button>
            </form>
        )}

        {/* Campaign Toggle */}
        <button
          onClick={() => setActiveTab(activeTab === 'campaign' ? 'none' : 'campaign')}
          className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors border text-left ${activeTab === 'campaign' ? 'bg-slate-800 border-slate-500 text-white' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}
        >
          {ui.campaign}
        </button>

        {activeTab === 'campaign' && (
             <form onSubmit={handleCampaignSubmit} className="bg-slate-950/50 p-3 rounded border border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-2">
                <input 
                    type="text" 
                    placeholder={ui.goalInput}
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-purple-500"
                    required
                />
                <textarea 
                    placeholder={ui.milestones}
                    value={milestones}
                    onChange={e => setMilestones(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm h-16 focus:outline-none focus:border-purple-500 resize-none"
                />
                 <button type="submit" disabled={isProcessing} className="w-full bg-purple-700 hover:bg-purple-600 text-white text-xs py-1 rounded font-bold disabled:opacity-50">
                    {isProcessing ? ui.generating : ui.create}
                </button>
             </form>
        )}
      </div>
    </div>
  );
};
