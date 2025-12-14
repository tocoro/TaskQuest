import { Language } from "./types";

export const TILE_SIZE = 120;
export const TILE_GAP = 40;
export const XP_PER_LEVEL = 100;

export const INITIAL_NODE_ID = 'root-node';

export const LEVEL_TITLES = {
  en: [
    "Novice Planner",
    "Apprentice Executer",
    "Journeyman Doer",
    "Expert Manager",
    "Master Strategist",
    "Grandmaster Visionary"
  ],
  ja: [
    "見習い冒険者",
    "駆け出し実行者",
    "熟練の仕事人",
    "熟達の管理者",
    "戦略の達人",
    "伝説の先導者"
  ]
};

export const UI_TEXT = {
  en: {
    appName: "TASKQUEST",
    xp: "Experience",
    rank: "Rank",
    progress: "Progress",
    travel: "Travel Here",
    complete: "Complete Task",
    scout: "Scout New Tasks",
    scouting: "Scouting Area...",
    controls: "Controls",
    pan: "Pan Camera",
    focus: "Focus",
    brief: "Mission Brief",
    tooFar: "Too far to travel. Move closer.",
    base: "BASE",
    lvl: "LVL",
    genAi: "(GenAI)",
    enter: "Enter",
    settings: "Settings",
    language: "Language",
    close: "Close",
    gmMode: "GM Mode",
    gmTools: "GM Tools",
    addTask: "Add Manual Task",
    breakdown: "Break Down Selected",
    campaign: "Generate Campaign",
    goalInput: "Goal Description",
    milestones: "Milestones (comma separated)",
    generating: "Fabricating World...",
    create: "Create",
    cancel: "Cancel",
    taskTitle: "Task Title",
    taskDesc: "Description",
    saveCamp: "Save Campaign",
    loadCamp: "Load Campaign",
    saveProg: "Save Progress",
    loadProg: "Load Progress",
    reset: "Reset Board",
    system: "System",
    editNode: "Edit Node Details",
    saveChanges: "Save Changes",
    difficulty: "Difficulty (XP Multiplier)",
    deleteNode: "Delete Node"
  },
  ja: {
    appName: "TASKQUEST",
    xp: "経験値",
    rank: "ランク",
    progress: "進行度",
    travel: "ここに移動",
    complete: "タスク完了",
    scout: "エリアを偵察",
    scouting: "偵察中...",
    controls: "操作方法",
    pan: "視点移動",
    focus: "選択",
    brief: "ミッション概要",
    tooFar: "遠すぎます。近くに移動してください。",
    base: "拠点",
    lvl: "Lv",
    genAi: "(生成AI)",
    enter: "決定",
    settings: "設定",
    language: "言語設定",
    close: "閉じる",
    gmMode: "GMモード",
    gmTools: "GMツール",
    addTask: "手動タスク追加",
    breakdown: "選択タスクを分解",
    campaign: "キャンペーン生成",
    goalInput: "ゴールの設定",
    milestones: "中間ポイント (カンマ区切り)",
    generating: "世界を構築中...",
    create: "作成",
    cancel: "キャンセル",
    taskTitle: "タスク名",
    taskDesc: "説明",
    saveCamp: "盤面を保存 (GM)",
    loadCamp: "盤面を読込 (GM)",
    saveProg: "進捗を保存 (Player)",
    loadProg: "進捗を読込 (Player)",
    reset: "リセット",
    system: "システム",
    editNode: "ノード詳細編集",
    saveChanges: "変更を保存",
    difficulty: "難易度 (XP倍率)",
    deleteNode: "ノードを削除"
  }
};
