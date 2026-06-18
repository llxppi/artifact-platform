// 对话历史摘要功能
interface Message {
  role: "user" | "assistant";
  content: string;
}

// 生成对话摘要
export function summarizeMessages(messages: Message[]): Message[] {
  if (messages.length <= 10) return messages;

  // 保留最近5轮对话
  const recentMessages = messages.slice(-10);

  // 对前面的对话生成摘要
  const oldMessages = messages.slice(0, -10);
  const summary = generateSummary(oldMessages);

  return [
    { role: "assistant", content: `[对话摘要] ${summary}` },
    ...recentMessages
  ];
}

// 简单摘要生成（提取关键信息）
function generateSummary(messages: Message[]): string {
  const userQuestions = messages
    .filter(m => m.role === "user")
    .map(m => m.content)
    .slice(0, 3);

  return `之前讨论了：${userQuestions.join("、")}等话题。`;
}

// 计算token数（粗略估算）
export function estimateTokens(messages: Message[]): number {
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  return Math.ceil(totalChars / 2); // 中文约2字符=1token
}
