import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateNextTasks, getGameFlavorText, generateCampaign } from './services/geminiService';
import { TileNode } from './components/TileNode';
import { DetailPanel } from './components/DetailPanel';
import { GmPanel } from './components/GmPanel';
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
        language: 'ja'
    },
    isGmMode: false,
    flags: {}
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flavorText, setFlavorText] = useState<string>("システム起動。準備完了。");

  // Refs
  const keysPressed = useRef<Set<string>>(new Set());
  const requestRef = useRef<number>();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  };

  const toggleGmMode = () => {
      setGameState(prev => ({
          ...prev,
          isGmMode: !prev.isGmMode
      }));
      setIsSettingsOpen(false);
  };

  // --- Storage Logic: Browser (LocalStorage) ---

  const handleBrowserSave = () => {
      try {
          if (gameState.isGmMode) {
              const campaignData = { nodes: gameState.nodes, edges: gameState.edges, flags: gameState.flags };
              localStorage.setItem('taskquest_campaign', JSON.stringify(campaignData));
              setFlavorText(currentLang === 'ja' ? "ブラウザにキャンペーンを保存しました。" : "Campaign saved to browser.");
          } else {
              localStorage.setItem('taskquest_save', JSON.stringify(gameState));
              setFlavorText(currentLang === 'ja' ? "ブラウザに記録を保存しました。" : "Progress saved to browser.");
          }
          setIsSettingsOpen(false);
      } catch (e) {
          console.error(e);
          setFlavorText("Browser Save Failed.");
      }
  };

  const handleBrowserLoad = () => {
      try {
          if (gameState.isGmMode) {
              const saved = localStorage.getItem('taskquest_campaign');
              if (saved) {
                  const data = JSON.parse(saved);
                  setGameState(prev => ({
                      ...prev,
                      nodes: data.nodes,
                      edges: data.edges,
                      flags: data.flags || {},
                      focusedNodeId: INITIAL_NODE_ID,
                      pawnPosition: INITIAL_NODE_ID,
                      camera: { x: window.innerWidth / 2 - TILE_SIZE / 2, y: window.innerHeight / 2 - TILE_SIZE / 2 }
                  }));
                  setFlavorText(currentLang === 'ja' ? "ブラウザからキャンペーンを読み込みました。" : "Campaign loaded from browser.");
              } else {
                  setFlavorText(currentLang === 'ja' ? "保存データが見つかりません。" : "No saved data.");
              }
          } else {
              const saved = localStorage.getItem('taskquest_save');
              if (saved) {
                  setGameState(JSON.parse(saved));
                  setFlavorText(currentLang === 'ja' ? "ブラウザから記録を読み込みました。" : "Progress loaded from browser.");
              } else {
                  setFlavorText(currentLang === 'ja' ? "保存データが見つかりません。" : "No saved data.");
              }
          }
          setIsSettingsOpen(false);
      } catch (e) {
           console.error(e);
           setFlavorText("Browser Load Failed.");
      }
  };

  // --- Storage Logic: File (JSON) ---

  const downloadJson = (data: any, filename: string) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleFileSave = () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      try {
          if (gameState.isGmMode) {
              const campaignData = { type: 'campaign', nodes: gameState.nodes, edges: gameState.edges, flags: gameState.flags };
              downloadJson(campaignData, `taskquest_campaign_${timestamp}.json`);
              setFlavorText(currentLang === 'ja' ? "キャンペーンファイルを出力しました。" : "Campaign exported.");
          } else {
              const saveData = { ...gameState, type: 'savegame' };
              downloadJson(saveData, `taskquest_save_${timestamp}.json`);
              setFlavorText(currentLang === 'ja' ? "セーブデータを出力しました。" : "Save file exported.");
          }
          setIsSettingsOpen(false);
      } catch (e) {
          console.error(e);
          setFlavorText("File Export Failed.");
      }
  };

  const handleFileLoadClick = () => {
      if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);
              
              if (gameState.isGmMode) {
                  if (data.nodes && data.edges) {
                      setGameState(prev => ({
                          ...prev,
                          nodes: data.nodes,
                          edges: data.edges,
                          flags: data.flags || {},
                          focusedNodeId: INITIAL_NODE_ID,
                          pawnPosition: INITIAL_NODE_ID,
                          camera: { x: window.innerWidth / 2 - TILE_SIZE / 2, y: window.innerHeight / 2 - TILE_SIZE / 2 }
                      }));
                      setFlavorText(currentLang === 'ja' ? "ファイルからキャンペーンを読み込みました。" : "Campaign imported.");
                  }
              } else {
                  if (data.nodes && data.edges && data.pawnPosition) {
                      setGameState(data);
                      setFlavorText(currentLang === 'ja' ? "ファイルから記録を復元しました。" : "Progress imported.");
                  }
              }
          } catch (err) {
              console.error(err);
              setFlavorText(currentLang === 'ja' ? "読み込みに失敗しました。" : "Import failed.");
          } finally {
              if (fileInputRef.current) fileInputRef.current.value = '';
              setIsSettingsOpen(false);
          }
      };
      reader.readAsText(file);
  };

  // --- Reset & Game Logic ---

  const handleReset = () => {
      if (!window.confirm(currentLang === 'ja' ? "本当にリセットしますか？" : "Are you sure you want to reset?")) return;
      
      const resetState: GameState = {
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
          settings: { language: currentLang },
          isGmMode: gameState.isGmMode,
          flags: {}
      };
      setGameState(resetState);
      setFlavorText(currentLang === 'ja' ? "世界が再構築されました。" : "World reset.");
      setIsSettingsOpen(false);
  };

  const handleUpdateNode = (id: string, updates: Partial<TaskNode>) => {
      setGameState(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => n.id === id ? { ...n, ...updates } : n)
      }));
      setFlavorText(currentLang === 'ja' ? "ノード情報を更新しました。" : "Node updated.");
  };

  const handleDeleteNode = (id: string) => {
      setGameState(prev => {
          const newNodes = prev.nodes.filter(n => n.id !== id);
          const newEdges = prev.edges.filter(e => e.source !== id && e.target !== id);
          const newFocus = prev.focusedNodeId === id ? INITIAL_NODE_ID : prev.focusedNodeId;
          return { ...prev, nodes: newNodes, edges: newEdges, focusedNodeId: newFocus };
      });
  };

  const handleCreateBranches = (parentId: string, branches: string[]) => {
    const parentNode = getNode(parentId);
    if (!parentNode) return;

    setGameState(prev => {
        const newNodes: TaskNode[] = [];
        const newEdges: Edge[] = [];
        const existingPositions = new Set(prev.nodes.map(n => `${n.position.col},${n.position.row}`));
        
        // Find 3 available spots
        const directions: GridPosition[] = [
            { col: 0, row: -1 }, { col: 1, row: 0 }, { col: 0, row: 1 }, { col: -1, row: 0 },
            { col: 1, row: -1 }, { col: 1, row: 1 }, { col: -1, row: 1 }, { col: -1, row: -1 }
        ];

        let addedCount = 0;
        for (const dir of directions) {
            if (addedCount >= branches.length) break;
            const targetPos = { col: parentNode.position.col + dir.col, row: parentNode.position.row + dir.row };
            const key = `${targetPos.col},${targetPos.row}`;
            
            if (!existingPositions.has(key)) {
                const title = branches[addedCount];
                if (title.trim() === "") { addedCount++; continue; }

                const newNodeId = `node-branch-${Date.now()}-${addedCount}`;
                newNodes.push({
                    id: newNodeId,
                    title: title,
                    description: "Branch task",
                    status: 'available',
                    position: targetPos,
                    type: 'task',
                    difficulty: parentNode.difficulty,
                    generatedFrom: parentNode.id
                });
                newEdges.push({ source: parentNode.id, target: newNodeId });
                existingPositions.add(key);
                addedCount++;
            }
        }

        return {
            ...prev,
            nodes: [...prev.nodes, ...newNodes],
            edges: [...prev.edges, ...newEdges]
        };
    });
    setFlavorText(currentLang === 'ja' ? "分岐ルートを作成しました。" : "Branches created.");
  };

  const handleInsertBlankNode = () => {
    const focusedNode = getNode(gameState.focusedNodeId);
    if (!focusedNode) return;

    setGameState(prev => {
        const existingPositions = new Set(prev.nodes.map(n => `${n.position.col},${n.position.row}`));
        const directions: GridPosition[] = [{ col: 1, row: 0 }, { col: 0, row: 1 }, { col: -1, row: 0 }, { col: 0, row: -1 }];
        
        let targetPos = null;
        for (const dir of directions) {
             const checkPos = { col: focusedNode.position.col + dir.col, row: focusedNode.position.row + dir.row };
             if (!existingPositions.has(`${checkPos.col},${checkPos.row}`)) {
                 targetPos = checkPos;
                 break;
             }
        }

        if (!targetPos) {
             setFlavorText(currentLang === 'ja' ? "配置スペースがありません。" : "No space for blank node.");
             return prev;
        }

        const newNodeId = `node-blank-${Date.now()}`;
        const newNode: TaskNode = {
            id: newNodeId,
            title: "",
            description: "",
            status: 'available',
            position: targetPos,
            type: 'blank',
            difficulty: 1,
            generatedFrom: focusedNode.id
        };

        return {
            ...prev,
            nodes: [...prev.nodes, newNode],
            edges: [...prev.edges, { source: focusedNode.id, target: newNodeId }],
            focusedNodeId: newNodeId // Auto focus new node
        };
    });
    setFlavorText(currentLang === 'ja' ? "ブランクノードを追加しました。" : "Blank node inserted.");
  };
  
  const handleAddManualTask = (title: string, description: string, difficulty: number) => {
      const activeNode = getNode(gameState.focusedNodeId) || getNode(gameState.pawnPosition);
      if(!activeNode) return;

      const directions: GridPosition[] = [
        { col: 1, row: 0 }, { col: 0, row: 1 }, { col: -1, row: 0 }, { col: 0, row: -1 }
      ];
      let targetPos = { col: activeNode.position.col + 1, row: activeNode.position.row };
      const existingPositions = new Set(gameState.nodes.map(n => `${n.position.col},${n.position.row}`));

      for (const dir of directions) {
          const checkPos = { col: activeNode.position.col + dir.col, row: activeNode.position.row + dir.row };
          if(!existingPositions.has(`${checkPos.col},${checkPos.row}`)) {
              targetPos = checkPos;
              break;
          }
      }

      setGameState(prev => {
          const newNodeId = `node-manual-${Date.now()}`;
          const newNode: TaskNode = {
              id: newNodeId,
              title,
              description,
              status: 'available',
              position: targetPos,
              type: 'task',
              difficulty,
              generatedFrom: activeNode.id
          };
          return {
              ...prev,
              nodes: [...prev.nodes, newNode],
              edges: [...prev.edges, { source: activeNode.id, target: newNodeId }]
          };
      });
      setFlavorText(currentLang === 'ja' ? "手動でタスクを配置しました。" : "Manual task node placed.");
  };

  const handleGenerateCampaign = async (goal: string, milestones: string) => {
      const startNode = getNode(gameState.focusedNodeId);
      if(!startNode || isGenerating) return;

      setIsGenerating(true);
      setFlavorText(currentLang === 'ja' ? "キャンペーンルートを計算中..." : "Calculating campaign route...");

      try {
          const tasks = await generateCampaign(startNode.title, goal, milestones, currentLang);
          setGameState(prev => {
              const newNodes: TaskNode[] = [];
              const newEdges: Edge[] = [];
              let lastNode = startNode;
              const existingPositions = new Set(prev.nodes.map(n => `${n.position.col},${n.position.row}`));
              
              let dirX = 0; let dirY = 0;
              if (lastNode.position.col === 0 && lastNode.position.row === 0) {
                   dirX = 1;
              } else {
                   const mag = Math.sqrt(lastNode.position.col**2 + lastNode.position.row**2);
                   if (mag > 0) {
                        if (Math.abs(lastNode.position.col) > Math.abs(lastNode.position.row)) {
                             dirX = Math.sign(lastNode.position.col);
                        } else {
                             dirY = Math.sign(lastNode.position.row);
                        }
                   } else { dirX = 1; }
              }

              const alternateDirs = [{ col: 1, row: 0 }, { col: 0, row: 1 }, { col: -1, row: 0 }, { col: 0, row: -1 }];

              tasks.forEach((task, idx) => {
                  const candidates = [
                      { col: dirX, row: dirY },
                      { col: dirY, row: dirX },
                      { col: -dirY, row: -dirX },
                  ].filter(d => d.col !== 0 || d.row !== 0);

                  alternateDirs.forEach(d => {
                      if (!candidates.some(c => c.col === d.col && c.row === d.row)) candidates.push(d);
                  });

                  for(const d of candidates) {
                       const pos = { col: lastNode.position.col + d.col, row: lastNode.position.row + d.row };
                       if(!existingPositions.has(`${pos.col},${pos.row}`)) {
                           const newNodeId = `node-camp-${Date.now()}-${idx}`;
                           const newNode: TaskNode = {
                               id: newNodeId,
                               title: task.title,
                               description: task.description,
                               status: 'available',
                               position: pos,
                               type: idx === tasks.length - 1 ? 'boss' : 'task',
                               difficulty: task.difficulty,
                               generatedFrom: lastNode.id
                           };
                           newNodes.push(newNode);
                           newEdges.push({ source: lastNode.id, target: newNodeId });
                           existingPositions.add(`${pos.col},${pos.row}`);
                           
                           dirX = d.col; dirY = d.row;
                           lastNode = newNode;
                           break;
                       }
                  }
              });

              return { ...prev, nodes: [...prev.nodes, ...newNodes], edges: [...prev.edges, ...newEdges] };
          });
          setFlavorText(currentLang === 'ja' ? "キャンペーンが生成されました。" : "Campaign generated.");
      } catch (e) {
          console.error(e);
          setFlavorText("Error generating campaign.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleGmBreakdown = async () => {
      const currentNode = getNode(gameState.focusedNodeId);
      if(!currentNode || isGenerating) return;

      setIsGenerating(true);
      setFlavorText(currentLang === 'ja' ? "タスクを分解中..." : "Deconstructing task...");
      
      try {
        const suggestions = await generateNextTasks(currentNode.title, currentNode.description, currentLang);
        setGameState(prev => {
            const newNodes: TaskNode[] = [];
            const newEdges: Edge[] = [];
            const existingPositions = new Set(prev.nodes.map(n => `${n.position.col},${n.position.row}`));
            const directions: GridPosition[] = [{ col: 0, row: -1 }, { col: 1, row: 0 }, { col: 0, row: 1 }, { col: -1, row: 0 }];
            let addedCount = 0;
            const shuffledDirs = directions.sort(() => 0.5 - Math.random());

            for (const dir of shuffledDirs) {
                if (addedCount >= suggestions.length) break;
                const targetPos = { col: currentNode.position.col + dir.col, row: currentNode.position.row + dir.row };
                const key = `${targetPos.col},${targetPos.row}`;
                if (!existingPositions.has(key)) {
                    const taskData = suggestions[addedCount];
                    const newNodeId = `node-gm-break-${Date.now()}-${addedCount}`;
                    newNodes.push({
                        id: newNodeId,
                        title: taskData.title,
                        description: taskData.description,
                        status: 'available',
                        position: targetPos,
                        type: 'task',
                        difficulty: taskData.difficulty,
                        generatedFrom: currentNode.id
                    });
                    newEdges.push({ source: currentNode.id, target: newNodeId });
                    existingPositions.add(key);
                    addedCount++;
                }
            }
            return { ...prev, nodes: [...prev.nodes, ...newNodes], edges: [...prev.edges, ...newEdges] };
        });
        setFlavorText(currentLang === 'ja' ? "分解完了。" : "Breakdown complete.");
      } catch(e) {
          setFlavorText("Error.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleGenerate = async () => {
    const currentNode = getNode(gameState.pawnPosition);
    if (!currentNode || isGenerating) return;

    setIsGenerating(true);
    setFlavorText(currentLang === 'ja' ? "周辺エリアをスキャン中..." : "Scanning surrounding sectors...");

    try {
      const suggestions = await generateNextTasks(currentNode.title, currentNode.description, currentLang);
      setGameState(prev => {
        const newNodes: TaskNode[] = [];
        const newEdges: Edge[] = [];
        const existingPositions = new Set(prev.nodes.map(n => `${n.position.col},${n.position.row}`));
        const directions: GridPosition[] = [{ col: 0, row: -1 }, { col: 1, row: 0 }, { col: 0, row: 1 }, { col: -1, row: 0 }];
        let addedCount = 0;
        const shuffledDirs = directions.sort(() => 0.5 - Math.random());

        for (const dir of shuffledDirs) {
          if (addedCount >= suggestions.length) break;
          const targetPos = { col: currentNode.position.col + dir.col, row: currentNode.position.row + dir.row };
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
        return { ...prev, nodes: [...prev.nodes, ...newNodes], edges: [...prev.edges, ...newEdges] };
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
      
      const newFlags = { ...prev.flags };
      if (currentNode.onCompleteFlag) {
          newFlags[currentNode.onCompleteFlag] = true;
      }

      return { ...prev, nodes: updatedNodes, xp: newXp, level: newLevel, flags: newFlags };
    });
    
    if (currentNode.onCompleteFlag) {
        setFlavorText(currentLang === 'ja' ? `フラグ解放: [${currentNode.onCompleteFlag}]` : `Flag Unlocked: [${currentNode.onCompleteFlag}]`);
    }

    const text = await getGameFlavorText('complete', currentNode.title, currentLang);
    if (text) setFlavorText(text);
  };

  const handleMovePawn = async () => {
      if (gameState.focusedNodeId === gameState.pawnPosition) return;
      const pawnNode = getNode(gameState.pawnPosition);
      const targetNode = getNode(gameState.focusedNodeId);
      if(!pawnNode || !targetNode) return;

      if (isAdjacent(pawnNode.id, targetNode.id) || gameState.isGmMode) { 
          // CHECK FLAG REQUIREMENT
          if (!gameState.isGmMode && targetNode.requiredFlag && !gameState.flags[targetNode.requiredFlag]) {
              setFlavorText(currentLang === 'ja' ? `ロックされています。必要フラグ: [${targetNode.requiredFlag}]` : `Locked. Requires: [${targetNode.requiredFlag}]`);
              return;
          }

          setGameState(prev => ({ ...prev, pawnPosition: targetNode.id }));
           const pos = getPositionStyle(targetNode.position);
           const targetCamX = window.innerWidth / 2 - pos.x - TILE_SIZE/2;
           const targetCamY = window.innerHeight / 2 - pos.y - TILE_SIZE/2;
           setGameState(prev => ({ ...prev, pawnPosition: targetNode.id, camera: { x: targetCamX, y: targetCamY } }));

           if (!gameState.isGmMode) {
               const text = await getGameFlavorText('move', targetNode.title, currentLang);
               if (text) setFlavorText(text);
           }
      } else {
          setFlavorText(currentLang === 'ja' ? "道が繋がっていません。" : "Path obstructed.");
      }
  };

  // --- Controls & Effects ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
             if(document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                 (document.activeElement as HTMLElement).blur();
                 return;
             }
             setIsSettingsOpen(prev => !prev);
             return;
        }

        // Add X key toggle
        if (e.key.toLowerCase() === 'x') {
            if(document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
            toggleGmMode();
            return;
        }

        // Add Ctrl+N for blank node insertion in GM Mode
        if (e.ctrlKey && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            if (gameState.isGmMode) {
                handleInsertBlankNode();
            }
            return;
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            if(document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
            e.preventDefault();
            const focusedNode = getNode(gameState.focusedNodeId);
            if (!focusedNode) return;

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
            if(document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
            const pawnAtNode = gameState.pawnPosition === gameState.focusedNodeId;
            if(!pawnAtNode) handleMovePawn();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.focusedNodeId, gameState.pawnPosition, gameState.nodes, currentLang, gameState.isGmMode, getNode, gameState.flags]); 

  // Camera Pan
  useEffect(() => {
    const handleKeyUpdate = (e: KeyboardEvent) => {
        if(document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        if (['w','a','s','d'].includes(e.key.toLowerCase())) keysPressed.current.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        keysPressed.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', handleKeyUpdate);
    window.addEventListener('keyup', handleKeyUp);
    const animate = () => {
        const speed = 10;
        let dx = 0; let dy = 0;
        if (keysPressed.current.has('w')) dy += speed;
        if (keysPressed.current.has('s')) dy -= speed;
        if (keysPressed.current.has('a')) dx += speed;
        if (keysPressed.current.has('d')) dx -= speed;
        if (dx !== 0 || dy !== 0) {
            setGameState(prev => ({ ...prev, camera: { x: prev.camera.x + dx, y: prev.camera.y + dy } }));
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
          x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y}
          stroke={gameState.isGmMode ? "#ef4444" : "#475569"} 
          strokeWidth="4"
          className="transition-all duration-500"
          strokeLinecap="round"
          strokeDasharray={gameState.isGmMode ? "8 4" : "0"}
        />
      );
    });
  };

  const activeNode = getNode(gameState.focusedNodeId);
  const pawnNode = getNode(gameState.pawnPosition);
  const canMoveHere = activeNode && pawnNode ? isAdjacent(activeNode.id, pawnNode.id) : false;
  const levelTitle = LEVEL_TITLES[currentLang][Math.min(gameState.level - 1, LEVEL_TITLES[currentLang].length - 1)];

  return (
    <div className={`w-screen h-screen overflow-hidden text-slate-200 font-sans selection:bg-blue-500 selection:text-white relative transition-colors duration-500 ${gameState.isGmMode ? 'bg-slate-900' : 'bg-slate-950'}`}>
      
      {/* Hidden File Input for Loading */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

      {/* GM Mode Background Grid */}
      {gameState.isGmMode && (
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      )}

      {/* --- HUD --- */}
      <div className="fixed top-0 left-0 p-6 z-50 pointer-events-none w-full flex justify-between items-start bg-gradient-to-b from-slate-950/80 to-transparent">
        
        {/* Left Side: Settings & Title */}
        <div className="pointer-events-auto relative">
             <div className="flex items-center gap-3">
                 <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2 rounded-full border transition-colors shadow-lg group ${gameState.isGmMode ? 'bg-red-900 border-red-500 hover:bg-red-800' : 'bg-slate-800 border-slate-600 hover:bg-slate-700'}`} title={ui.settings}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300 group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                 </button>
                 <div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] leading-none">
                        TASK<span className={gameState.isGmMode ? "text-red-500" : "text-blue-500"}>{gameState.isGmMode ? "MASTER" : "QUEST"}</span>
                    </h1>
                 </div>
             </div>
            <p className={`${gameState.isGmMode ? "text-red-400" : "text-blue-400"} font-mono text-sm opacity-80 mt-1 pl-12`}>{flavorText}</p>

             {/* Settings Menu */}
             {isSettingsOpen && (
                 <div className="absolute top-14 left-0 bg-slate-800 border border-slate-600 rounded-lg p-4 w-72 shadow-2xl z-50">
                     <div className="mb-4 pb-4 border-b border-slate-700">
                         <h3 className="text-xs uppercase text-slate-400 mb-2 font-bold">{ui.gmMode}</h3>
                         <button onClick={toggleGmMode} className={`w-full py-2 rounded font-bold text-sm transition-colors ${gameState.isGmMode ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                             {gameState.isGmMode ? 'ON' : 'OFF'}
                         </button>
                     </div>

                     {/* Browser Storage Section */}
                     <div className="mb-4 pb-4 border-b border-slate-700">
                         <h3 className="text-xs uppercase text-slate-400 mb-2 font-bold">System (Browser)</h3>
                         <div className="space-y-2">
                             <button onClick={handleBrowserSave} className="w-full text-left px-3 py-2 rounded text-sm bg-slate-700 text-emerald-400 hover:bg-slate-600 font-bold flex justify-between">
                                 <span>{gameState.isGmMode ? ui.saveCamp : ui.saveProg}</span>
                                 <span>💾</span>
                             </button>
                             <button onClick={handleBrowserLoad} className="w-full text-left px-3 py-2 rounded text-sm bg-slate-700 text-blue-400 hover:bg-slate-600 font-bold flex justify-between">
                                 <span>{gameState.isGmMode ? ui.loadCamp : ui.loadProg}</span>
                                 <span>📂</span>
                             </button>
                         </div>
                     </div>

                     {/* File Storage Section */}
                     <div className="mb-4 pb-4 border-b border-slate-700">
                         <h3 className="text-xs uppercase text-slate-400 mb-2 font-bold">File (JSON)</h3>
                         <div className="space-y-2">
                             <button onClick={handleFileSave} className="w-full text-left px-3 py-2 rounded text-sm bg-slate-700 text-emerald-300 hover:bg-slate-600 font-bold flex justify-between group">
                                 <span>Export File</span>
                                 <span className="group-hover:translate-y-1 transition-transform">⬇️</span>
                             </button>
                             <button onClick={handleFileLoadClick} className="w-full text-left px-3 py-2 rounded text-sm bg-slate-700 text-blue-300 hover:bg-slate-600 font-bold flex justify-between group">
                                 <span>Import File</span>
                                 <span className="group-hover:-translate-y-1 transition-transform">⬆️</span>
                             </button>
                         </div>
                     </div>

                     <div className="space-y-2">
                         <button onClick={handleReset} className="w-full text-left px-3 py-2 rounded text-sm hover:bg-red-900/50 text-red-400 hover:text-red-300 transition-colors">
                            {ui.reset}
                         </button>
                        <div className="flex gap-2 mt-2">
                             <button onClick={() => setLanguage('en')} className={`flex-1 py-1 rounded text-xs ${currentLang === 'en' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>EN</button>
                             <button onClick={() => setLanguage('ja')} className={`flex-1 py-1 rounded text-xs ${currentLang === 'ja' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>JP</button>
                        </div>
                     </div>
                 </div>
             )}
        </div>

        {/* Right Side: XP & Rank */}
        <div className="flex flex-col items-end pointer-events-auto relative">
            <div className="flex items-center gap-4 mb-2">
                <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase tracking-widest">{ui.xp}</div>
                    <div className="text-xl font-bold font-mono text-emerald-400">{gameState.xp} XP</div>
                </div>
                <div className="h-10 w-px bg-slate-700"></div>
                <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase tracking-widest">{ui.rank}</div>
                    <div className="text-xl font-bold text-yellow-400">{levelTitle}</div>
                </div>
            </div>
            <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-1000" style={{ width: `${(gameState.xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100}%` }}></div>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">{ui.lvl} {gameState.level} {ui.progress}</div>
        </div>
      </div>

      {/* --- GM Panel --- */}
      {gameState.isGmMode && (
          <div className="mt-20"> 
             <GmPanel language={currentLang} isProcessing={isGenerating} onAddManualTask={handleAddManualTask} onBreakdown={handleGmBreakdown} onGenerateCampaign={handleGenerateCampaign} />
          </div>
      )}

      {/* --- Game Board --- */}
      <div 
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        style={{ transform: `translate(${gameState.camera.x}px, ${gameState.camera.y}px)`, transition: 'transform 0.1s linear' }}
        onClick={() => setIsSettingsOpen(false)}
      >
        <svg className="absolute top-[-5000px] left-[-5000px] w-[10000px] h-[10000px] pointer-events-none overflow-visible">
             <g transform="translate(5000, 5000)">{renderConnections()}</g>
        </svg>

        {gameState.nodes.map(node => {
            const pos = getPositionStyle(node.position);
            return (
                <div key={node.id} style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }} className="absolute top-0 left-0">
                    <TileNode 
                        node={node} 
                        isFocused={gameState.focusedNodeId === node.id} 
                        isPawnHere={gameState.pawnPosition === node.id} 
                        language={currentLang} 
                        onClick={(id) => setGameState(prev => ({ ...prev, focusedNodeId: id }))} 
                        flags={gameState.flags}
                    />
                </div>
            );
        })}

        {pawnNode && (
            <div className="absolute z-30 pointer-events-none transition-all duration-500 ease-in-out flex flex-col items-center justify-center" style={{ left: getPositionStyle(pawnNode.position).x, top: getPositionStyle(pawnNode.position).y, width: TILE_SIZE, height: TILE_SIZE }}>
              <div className="relative">
                <div className={`w-8 h-12 rounded-full border-2 border-white shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-bounce relative z-10 ${gameState.isGmMode ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]' : 'bg-blue-500'}`}>
                    <div className="w-6 h-6 bg-white/30 rounded-full mx-auto mt-1"></div>
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-4 bg-black/50 blur-sm rounded-full"></div>
              </div>
            </div>
        )}
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
        isGmMode={gameState.isGmMode}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        onCreateBranches={handleCreateBranches}
        flags={gameState.flags}
      />
    </div>
  );
};

export default App;