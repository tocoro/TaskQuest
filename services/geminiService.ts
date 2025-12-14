import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NewTaskSuggestion, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const taskSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Short title of the task (max 20 characters)" },
          description: { type: Type.STRING, description: "Concise actionable description" },
          difficulty: { type: Type.INTEGER, description: "Difficulty level 1-5 based on complexity" },
        },
        required: ["title", "description", "difficulty"],
      },
    },
  },
  required: ["tasks"],
};

export async function generateNextTasks(
  currentTaskTitle: string,
  currentTaskDesc: string,
  language: Language = 'ja',
  goalContext: string = "General Project"
): Promise<NewTaskSuggestion[]> {
  try {
    const langInstruction = language === 'ja' 
      ? "Respond strictly in Japanese." 
      : "Respond in English.";

    const prompt = `
      You are a Dungeon Master for a productivity RPG board game. 
      The player is currently at a tile representing the task: "${currentTaskTitle}".
      Description: "${currentTaskDesc}".
      Context: "${goalContext}".

      Generate 2 to 4 actionable sub-tasks or follow-up steps that naturally flow from this task.
      These will become new adjacent tiles on the game board.
      Make them sound like RPG quests if possible, but keep them practical.
      ${langInstruction}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: taskSchema,
        systemInstruction: `You are a helpful productivity assistant gamifying tasks. ${langInstruction}`,
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.tasks || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to generate tasks:", error);
    return [];
  }
}

export async function generateCampaign(
    startTaskTitle: string,
    goalDescription: string,
    milestones: string,
    language: Language = 'ja'
): Promise<NewTaskSuggestion[]> {
    try {
        const langInstruction = language === 'ja'
            ? "Respond strictly in Japanese."
            : "Respond in English.";

        const prompt = `
            You are a Dungeon Master designing a quest line (campaign) for a productivity RPG.
            Start Point: "${startTaskTitle}".
            Ultimate Goal: "${goalDescription}".
            Intermediate Milestones: "${milestones}".

            Generate a linear or slightly branching sequence of 3 to 6 tasks that connect the start point to the goal, incorporating the milestones.
            The tasks should progress logically from start to finish.
            The last task should be the Goal itself.
            ${langInstruction}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: taskSchema,
                systemInstruction: `You are a Level Designer for a productivity RPG. ${langInstruction}`,
            },
        });

        if (response.text) {
            const data = JSON.parse(response.text);
            return data.tasks || [];
        }
        return [];
    } catch (error) {
        console.error("Failed to generate campaign:", error);
        return [];
    }
}

export async function getGameFlavorText(action: 'complete' | 'move', taskTitle: string, language: Language = 'ja'): Promise<string> {
   try {
    const langInstruction = language === 'ja' 
      ? "Write in Japanese. Keep it under 60 characters." 
      : "Write in English. Keep it under 60 characters.";

    const prompt = action === 'complete' 
      ? `Write a very short RPG-style victory message for completing the quest: "${taskTitle}". ${langInstruction}`
      : `Write a very short flavor text for traveling to the location: "${taskTitle}". ${langInstruction}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    return "";
  }
}
