import { GoogleGenAI } from "@google/genai";
import { Task, TeamMember } from "../types";

// Helper to initialize the client safely
const getClient = () => {
  // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("API Key is missing. Please set API_KEY in your environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateMorningBriefing = async (tasks: Task[], members: TeamMember[], lang: 'en' | 'zh'): Promise<string> => {
  const ai = getClient();
  if (!ai) return lang === 'zh' ? "错误：缺少 API 密钥。" : "Error: API Key missing.";

  const assignedTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.assigneeId);
  const unassignedTasks = tasks.filter(t => !t.assigneeId);

  // Anonymized data summary for the prompt
  const dataSummary = {
    pendingCount: unassignedTasks.length,
    activeCount: assignedTasks.length,
    urgentCount: tasks.filter(t => t.priority === 'URGENT').length,
    memberWorkloads: members.filter(m => m.role === 'MEMBER').map(m => ({
      name: m.name,
      activeTasks: tasks.filter(t => t.assigneeId === m.id && t.status === 'IN_PROGRESS').length
    }))
  };

  const languageInstruction = lang === 'zh' ? "Respond in Chinese (Simplified)." : "Respond in English.";

  const prompt = `
    You are an AI assistant for a pharmaceutical filling team manager.
    Analyze the following workload data:
    ${JSON.stringify(dataSummary, null, 2)}
    
    Provide a concise "Morning Briefing" (max 150 words).
    1. Highlight any bottlenecks or urgent unassigned tasks.
    2. Suggest if workload needs balancing.
    3. Keep tone professional and encouraging.
    4. Do not use markdown bolding too heavily.
    5. ${languageInstruction}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || (lang === 'zh' ? "未生成洞察。" : "No insights generated.");
  } catch (error) {
    console.error("Gemini Error:", error);
    return lang === 'zh' ? "暂时无法生成简报。" : "Unable to generate briefing at this time.";
  }
};

export const suggestAssignment = async (task: Task, tasks: Task[], members: TeamMember[], lang: 'en' | 'zh'): Promise<string> => {
  const ai = getClient();
  if (!ai) return lang === 'zh' ? "错误：缺少 API 密钥。" : "Error: API Key missing.";

  const memberLoad = members
    .filter(m => m.role === 'MEMBER')
    .map(m => ({
      id: m.id,
      name: m.name,
      currentTasks: tasks.filter(t => t.assigneeId === m.id && t.status !== 'COMPLETED').length
    }));

  const languageInstruction = lang === 'zh' ? "Respond in Chinese (Simplified)." : "Respond in English.";

  const prompt = `
    I have a new RS Filling task: Project ${task.projectNumber}, Priority: ${task.priority}.
    Current Team Workload:
    ${JSON.stringify(memberLoad, null, 2)}

    Recommend one team member to assign this to based on lowest workload. 
    Explain why in 1 sentence.
    ${languageInstruction}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || (lang === 'zh' ? "无建议。" : "No suggestion available.");
  } catch (error) {
    return lang === 'zh' ? "无法生成建议。" : "Unable to generate suggestion.";
  }
};