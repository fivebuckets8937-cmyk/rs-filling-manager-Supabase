import { Task, TeamMember } from "../types";

// --- 配置区域 ---
// 确保你本地已经下载了该模型: ollama pull llama3.2
const OLLAMA_MODEL = "qwen3"; 
const OLLAMA_API_URL = "http://localhost:11434/api/generate";

/**
 * 通用的 Ollama 请求帮助函数
 */
const callOllama = async (prompt: string): Promise<string | null> => {
  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false, // 关闭流式传输，一次性返回
        options: {
          temperature: 0.7, // 控制创造性，0.7 比较平衡
        }
      }),
    });

    if (!response.ok) {
      console.error(`Ollama API Error: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Connection to Ollama failed:", error);
    return null;
  }
};

/**
 * 生成早间简报
 * 逻辑与原 GeminiService 保持一致，复用相同的数据结构和 Prompt
 */
export const generateMorningBriefing = async (tasks: Task[], members: TeamMember[], lang: 'en' | 'zh'): Promise<string> => {
  // 1. 数据预处理 (保持原逻辑)
  const assignedTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.assigneeId);
  const unassignedTasks = tasks.filter(t => !t.assigneeId);

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

  // 2. 构建 Prompt (保持原逻辑，保留制药填装团队的上下文)
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

  // 3. 调用 Ollama
  const result = await callOllama(prompt);

  // 4. 错误处理与返回
  if (!result) {
    return lang === 'zh' 
      ? "错误：无法连接本地 AI。请确认 Ollama 已启动 (ollama run llama3.2)。" 
      : "Error: Unable to connect to Local AI. Ensure Ollama is running.";
  }

  return result;
};

/**
 * 任务分配建议
 * 逻辑与原 GeminiService 保持一致
 */
export const suggestAssignment = async (task: Task, tasks: Task[], members: TeamMember[], lang: 'en' | 'zh'): Promise<string> => {
  // 1. 数据预处理
  const memberLoad = members
    .filter(m => m.role === 'MEMBER')
    .map(m => ({
      id: m.id,
      name: m.name,
      currentTasks: tasks.filter(t => t.assigneeId === m.id && t.status !== 'COMPLETED').length
    }));

  const languageInstruction = lang === 'zh' ? "Respond in Chinese (Simplified)." : "Respond in English.";

  // 2. 构建 Prompt
  const prompt = `
    I have a new RS Filling task: Project ${task.projectNumber}, Priority: ${task.priority}.
    Current Team Workload:
    ${JSON.stringify(memberLoad, null, 2)}

    Recommend one team member to assign this to based on lowest workload. 
    Explain why in 1 sentence.
    ${languageInstruction}
  `;

  // 3. 调用 Ollama
  const result = await callOllama(prompt);

  if (!result) {
    return lang === 'zh' ? "无法生成建议 (Ollama未连接)。" : "Unable to generate suggestion (Ollama disconnected).";
  }

  return result;
};