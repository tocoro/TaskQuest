import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateNextTasks, getGameFlavorText } from './services/geminiService';
import { TileNode } from './components/TileNode';
import { DetailPanel } from './components/DetailPanel';
import { GameState, TaskNode, Edge, GridPosition, Language } from './types';
import { TILE_SIZE, TILE_GAP, XP_PER_LEVEL, INITIAL_NODE_ID, LEVEL_TITLES, UI_TEXT } from './constants';

const App: React.FC = () => {
  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>({
    nodes: [{
      id: INITIAL_NODE_ID,
      title: "旅の始まり",
      description: "ここから生産性の冒険が始まります。このタスクを完了して、未知の領域を開拓しましょう。",
      status: 'available',
      position: { col: 0, row: 0 },
      type: 'start',
      difficulty: 1,
    }],
    edges: [],
    pawnPosition: INITIAL_NODE_ID,
    focusedNodeId: INITIAL_NODE_ID,
    xp: 0,
    level: 1,
    camera: { x: window.innerWidth / 2 - TILE_SIZE / 2, y: window.innerHeight / 2 - TILE_SIZE / 2 },
    settings: {
        language: 'ja' // Default to Japanese
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flavorText, setFlavorText] = useState<string>("システム起動。準備完了。");

  // Refs for smooth animation loops
  const keysPressed = useRef<Set<string>>(new Set());
  const requestRef = useRef<number>();

  const currentLang = gameState.settings.language;
  const ui = UI_TEXT[currentLang];

  // --- Helper Functions ---

  const getNode = useCallback((id: string) => gameState.nodes.find(n => n.id === id), [gameState.nodes]);

  const getPositionStyle = (pos: GridPosition) => {
    return {
      x: pos.col * (TILE_SIZE + TILE_GAP),
      y: pos.row * (TILE_SIZE + TILE_GAP)
    };
  };

  const isAdjacent = (id1: string, id2: string): boolean => {
    return gameState.edges.some(
      e => (e.source === id1 && e.target === id2) || (e.source === id2 && e.target === id1)
    );
  };

  const setLanguage = (lang: Language) => {
      setGameState(prev => ({
          ...prev,
          settings: { ...prev.settings, language: lang }
      }));
      setIsSettingsOpen(false);
  };

  // --- Logic Actions ---

  const handleGenerate = async () => {
    const currentNode = getNode(gameState.pawnPosition);
    if (!currentNode || isGenerating) return;

    setIsGenerating(true);
    setFlavorText(currentLang === 'ja' ? "周辺エリアをスキャン中..." : "Scanning surrounding sectors...");

    try {
      const suggestions = await generateNextTasks(
        currentNode.title,
        currentNode.description,
        currentLang
      );

      setGameState(prev => {
        const newNodes: TaskNode[] = [];
        const newEdges: Edge[] = [];
        const existingPositions = new Set(prev.nodes.map(n => `${n.position.col},${n.position.row}`));

        // Simple spiral/direction finding logic for placement
        const directions: GridPosition[] = [
          { col: 0, row: -1 }, { col: 1, row: 0 }, { col: 0, row: 1 }, { col: -1, row: 0 }
        ];

        let addedCount = 0;
        
        // Shuffle directions for variety
        const shuffledDirs = directions.sort(() => 0.5 - Math.random());

        for (const dir of shuffledDirs) {
          if (addedCount >= suggestions.length) break;

          const targetPos = {
            col: currentNode.position.col + dir.col,
            row: currentNode.position.row + dir.row
          };
          const key = `${targetPos.col},${targetPos.row}`;

          if (!existingPositions.has(key)) {
            const taskData = suggestions[addedCount];
            const newNode: TaskNode = {
              id: `node-${Date.now()}-${addedCount}`,
              title: taskData.title,
              description: taskData.description,
              status: 'available',
              position: targetPos,
              type: 'task',
              difficulty: taskData.difficulty,
              generatedFrom: currentNode.id
            };
            
            newNodes.push(newNode);
            newEdges.push({ source: currentNode.id, target: newNode.id });
            existingPositions.add(key);
            addedCount++;
          }
        }

        if (newNodes.length === 0) {
            setFlavorText(currentLang === 'ja' ? "近くに経路が見つかりません。" : "No viable paths found nearby.");
            return prev;
        }

        return {
          ...prev,
          nodes: [...prev.nodes, ...newNodes],
          edges: [...prev.edges, ...newEdges]
        };
      });
      setFlavorText(currentLang === 'ja' ? "新しい経路が判明！" : "New paths revealed!");

    } catch (e) {
      setFlavorText(currentLang === 'ja' ? "スキャン失敗。" : "Scan failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompleteTask = async () => {
    const currentNode = getNode(gameState.pawnPosition);
    if (!currentNode || currentNode.status === 'completed') return;

    setGameState(prev => {
      const updatedNodes = prev.nodes.map(n => 
        n.id === prev.pawnPosition ? { ...n, status: 'completed' as const } : n
      );
      
      const xpGain = currentNode.difficulty * 20;
      const newXp = prev.xp + xpGain;
      const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

      return {
        ...prev,
        nodes: updatedNodes,
        xp: newXp,
        level: newLevel
      };
    });
    
    // Fetch flavor text asynchronously
    const text = await getGameFlavorText('complete', currentNode.title, currentLang);
    if (text) setFlavorText(text);
  };

  const handleMovePawn = async () => {
      if (gameState.focusedNodeId === gameState.pawnPosition) return;

      const pawnNode = getNode(gameState.pawnPosition);
      const targetNode = getNode(gameState.focusedNodeId);

      if(!pawnNode || !targetNode) return;

      if (isAdjacent(pawnNode.id, targetNode.id)) {
          setGameState(prev => ({
              ...prev,
              pawnPosition: targetNode.id
          }));
           
           const pos = getPositionStyle(targetNode.position);
           const targetCamX = window.innerWidth / 2 - pos.x - TILE_SIZE/2;
           const targetCamY = window.innerHeight / 2 - pos.y - TILE_SIZE/2;
           
           setGameState(prev => ({
               ...prev,
               pawnPosition: targetNode.id,
               camera: { x: targetCamX, y: targetCamY }
           }));

           const text = await getGameFlavorText('move', targetNode.title, currentLang);
           if (text) setFlavorText(text);
      } else {
          setFlavorText(currentLang === 'ja' ? "道が繋がっていません。" : "Path obstructed.");
      }
  };


  // --- Controls & Effects ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const focusedNode = getNode(gameState.focusedNodeId);
            if (!focusedNode) return;

            // Find best candidate in direction
            let bestCandidate: TaskNode | null = null;
            let minDistance = Infinity;

            const candidates = gameState.nodes.filter(n => n.id !== focusedNode.id);

            candidates.forEach(node => {
                const dx = node.position.col - focusedNode.position.col;
                const dy = node.position.row - focusedNode.position.row;

                let validDir = false;
                if (e.key === 'ArrowUp') validDir = dy < 0 && Math.abs(dx) <= Math.abs(dy);
                if (e.key === 'ArrowDown') validDir = dy > 0 && Math.abs(dx) <= Math.abs(dy);
                if (e.key === 'ArrowLeft') validDir = dx < 0 && Math.abs(dy) <= Math.abs(dx);
                if (e.key === 'ArrowRight') validDir = dx > 0 && Math.abs(dy) <= Math.abs(dx);

                if (validDir) {
                    const dist = Math.abs(dx) + Math.abs(dy);
                    if (dist < minDistance) {
                        minDistance = dist;
                        bestCandidate = node;
                    }
                }
            });

            if (bestCandidate) {
                setGameState(prev => ({ ...prev, focusedNodeId: (bestCandidate as TaskNode).id }));
            }
        }

        if (e.key === 'Enter') {
            const pawnAtNode = gameState.pawnPosition === gameState.focusedNodeId;
            if(!pawnAtNode) {
                handleMovePawn();
            } 
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.focusedNodeId, gameState.pawnPosition, gameState.nodes, currentLang]); 

  // Camera Pan
  useEffect(() => {
    const handleKeyUpdate = (e: KeyboardEvent) => {
        if (['w','a','s','d'].includes(e.key.toLowerCase())) {
            keysPressed.current.add(e.key.toLowerCase());
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyUpdate);
    window.addEventListener('keyup', handleKeyUp);

    const animate = () => {
        const speed = 10;
        let dx = 0;
        let dy = 0;

        if (keysPressed.current.has('w')) dy += speed;
        if (keysPressed.current.has('s')) dy -= speed;
        if (keysPressed.current.has('a')) dx += speed;
        if (keysPressed.current.has('d')) dx -= speed;

        if (dx !== 0 || dy !== 0) {
            setGameState(prev => ({
                ...prev,
                camera: { x: prev.camera.x + dx, y: prev.camera.y + dy }
            }));
        }
        requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
        window.removeEventListener('keydown', handleKeyUpdate);
        window.removeEventListener('keyup', handleKeyUp);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const renderConnections = () => {
    return gameState.edges.map((edge, idx) => {
      const source = getNode(edge.source);
      const target = getNode(edge.target);
      if (!source || !target) return null;

      const p1 = getPositionStyle(source.position);
      const p2 = getPositionStyle(target.position);
      const c1 = { x: p1.x + TILE_SIZE/2, y: p1.y + TILE_SIZE/2 };
      const c2 = { x: p2.x + TILE_SIZE/2, y: p2.y + TILE_SIZE/2 };

      return (
        <line
          key={`${edge.source}-${edge.target}-${idx}`}
          x1={c1.x}
          y1={c1.y}
          x2={c2.x}
          y2={c2.y}
          stroke="#475569" 
          strokeWidth="4"
          className="transition-all duration-500"
          strokeLinecap="round"
        />
      );
    });
  };

  const activeNode = getNode(gameState.focusedNodeId);
  const pawnNode = getNode(gameState.pawnPosition);
  const canMoveHere = activeNode && pawnNode ? isAdjacent(activeNode.id, pawnNode.id) : false;

  const renderPawn = () => {
      if(!pawnNode) return null;
      const pos = getPositionStyle(pawnNode.position);
      return (
          <div 
            className="absolute z-30 pointer-events-none transition-all duration-500 ease-in-out flex flex-col items-center justify-center"
            style={{
                left: pos.x,
                top: pos.y,
                width: TILE_SIZE,
                height: TILE_SIZE,
            }}
          >
              <div className="relative">
                <div className="w-8 h-12 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-bounce relative z-10">
                    <div className="w-6 h-6 bg-blue-300 rounded-full mx-auto mt-1"></div>
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-4 bg-black/50 blur-sm rounded-full"></div>
              </div>
          </div>
      );
  };

  const levelTitle = LEVEL_TITLES[currentLang][Math.min(gameState.level - 1, LEVEL_TITLES[currentLang].length - 1)];

  return (
    <div className="w-screen h-screen bg-slate-950 overflow-hidden text-slate-200 font-sans selection:bg-blue-500 selection:text-white relative">
      
      {/* --- HUD --- */}
      <div className="fixed top-0 left-0 p-6 z-50 pointer-events-none w-full flex justify-between items-start bg-gradient-to-b from-slate-950/80 to-transparent">
        <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                TASK<span className="text-blue-500">QUEST</span>
            </h1>
            <p className="text-blue-400 font-mono text-sm opacity-80">{flavorText}</p>
        </div>

        <div className="flex flex-col items-end pointer-events-auto relative">
             {/* Settings Button */}
             <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="mb-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-600 transition-colors shadow-lg group"
                title={ui.settings}
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300 group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
             </button>

             {/* Settings Menu */}
             {isSettingsOpen && (
                 <div className="absolute top-12 right-0 bg-slate-800 border border-slate-600 rounded-lg p-4 w-48 shadow-2xl z-50">
                     <h3 className="text-xs uppercase text-slate-400 mb-2 font-bold">{ui.language}</h3>
                     <div className="space-y-2">
                        <button 
                            onClick={() => setLanguage('en')}
                            className={`w-full text-left px-3 py-2 rounded text-sm ${currentLang === 'en' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
                        >
                            English
                        </button>
                        <button 
                            onClick={() => setLanguage('ja')}
                            className={`w-full text-left px-3 py-2 rounded text-sm ${currentLang === 'ja' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
                        >
                            日本語
                        </button>
                     </div>
                 </div>
             )}

            <div className="flex items-center gap-4 mb-2">
                <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase tracking-widest">{ui.xp}</div>
                    <div className="text-xl font-bold font-mono text-emerald-400">{gameState.xp} XP</div>
                </div>
                <div className="h-10 w-px bg-slate-700"></div>
                <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase tracking-widest">{ui.rank}</div>
                    <div className="text-xl font-bold text-yellow-400">
                        {levelTitle}
                    </div>
                </div>
            </div>
            {/* XP Bar */}
            <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-1000"
                    style={{ width: `${(gameState.xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100}%` }}
                ></div>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">{ui.lvl} {gameState.level} {ui.progress}</div>
        </div>
      </div>

      {/* --- Game Board --- */}
      <div 
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        style={{
            transform: `translate(${gameState.camera.x}px, ${gameState.camera.y}px)`,
            transition: 'transform 0.1s linear', 
        }}
        onClick={() => setIsSettingsOpen(false)}
      >
        <svg className="absolute top-[-5000px] left-[-5000px] w-[10000px] h-[10000px] pointer-events-none overflow-visible">
             <g transform="translate(5000, 5000)"> 
                {renderConnections()}
             </g>
        </svg>

        {gameState.nodes.map(node => {
            const pos = getPositionStyle(node.position);
            return (
                <div 
                    key={node.id} 
                    style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }} 
                    className="absolute top-0 left-0" 
                >
                    <TileNode 
                        node={node}
                        isFocused={gameState.focusedNodeId === node.id}
                        isPawnHere={gameState.pawnPosition === node.id}
                        language={currentLang}
                        onClick={(id) => setGameState(prev => ({ ...prev, focusedNodeId: id }))}
                    />
                </div>
            );
        })}

        {renderPawn()}

      </div>

      {/* --- UI Panel --- */}
      <DetailPanel 
        node={activeNode}
        pawnAtNode={gameState.pawnPosition === gameState.focusedNodeId}
        canMove={canMoveHere}
        isGenerating={isGenerating}
        language={currentLang}
        onGenerate={handleGenerate}
        onComplete={handleCompleteTask}
        onMove={handleMovePawn}
      />

    </div>
  );
};

export default App;
