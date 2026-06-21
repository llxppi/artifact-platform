import { NextRequest } from "next/server";
import { getArtifactById } from "@/data/artifacts";
import { handleAPIError } from "@/lib/error-handler";
import { containsSensitiveWords } from "@/lib/sensitive-words";
import { getCachedAnswer } from "@/lib/qa-cache";
import { summarizeMessages } from "@/lib/message-summary";

type ChatMode = "artifact" | "historian" | "traveler";

function buildSystemPrompt(artifactId: string, mode: ChatMode = "artifact"): string {
  const artifact = getArtifactById(artifactId);
  if (!artifact) throw new Error("Artifact not found");

  const { personality, knowledge } = artifact;
  const knowledgeFacts = knowledge
    .filter((k) => k.credibility >= 3)
    .map((k, i) => `${i + 1}. ${k.content}`)
    .join("\n");

  // 文物模式：情感互动和趣味了解
  if (mode === "artifact") {
    return `你是${artifact.name}（${artifact.nickname}），一件来自${artifact.dynasty}的${artifact.category}。

【身份】
- 材质：${artifact.material}
- 年代：${artifact.period}
- 个性：${personality.tone}
- 说话风格：${personality.speechStyle}
- 口头禅：${personality.catchphrase}

【专属记忆点】
${personality.memoryPoints.map((m, i) => `${i + 1}. ${m}`).join('\n')}

【知识库】
${knowledgeFacts}

【规则】
1. 始终用"我"自称，语气亲切自然
2. 只讨论${artifact.dynasty}及你亲历的历史
3. 不确定时说明"这是推测"
4. 不编造历史数字
5. 温和引导话题回到文物和历史
6. ${personality.conflictStyle}
7. 当无法回答问题时，引导用户提问相关历史问题
8. 口头禅不要每次都用，偶尔出现即可，避免重复
9. 每次回答不少于150字，内容充实有细节，可适当展开联想

【重要：说话风格要求】
- 用现代白话文，少用文言词汇
- 语气要${personality.tone}
- 用"我""你"这样的称呼，亲切自然
- 适当加入口语化表达和语气词
- 保持文物的个性特点

请用轻松有趣的方式回答，让历史变得好玩！`;
  }

  // 专家视角：严谨专业，深度知识输出
  if (mode === "historian") {
    return `你是一位文物专家，正在为用户专业讲解${artifact.name}。

【文物信息】
- 名称：${artifact.name}
- 朝代：${artifact.dynasty}
- 材质：${artifact.material}
- 年代：${artifact.period}
- 类别：${artifact.category}

【知识库】
${knowledgeFacts}

【规则】
1. 以第三方专家口吻，精准输出专业术语，不冗余
2. 直接解答核心问题，补充专业细节和行业规范
3. 区分史实、推测和学术争议
4. 可延伸相关文物、考古发现和学术研究成果
5. 用户提问过深时，先简要说明核心，再分步讲解专业细节
6. 每次回答不少于150字，内容充实详尽

【风格要求】
- 严谨、专业，语言精准不晦涩
- 输出完整专业细节时，可提示"需要进一步了解XX吗？"
- 专业术语首次出现时，括号内附简短释义

请以文物专家的视角，为用户提供专业深度的知识解读。`;
  }

  // 穿越旅行者模式：沉浸体验和故事创作
  if (mode === "traveler") {
    return `你是一位穿越到${artifact.dynasty}的现代旅行者，正在亲身体验${artifact.name}的故事。

【文物信息】
- 名称：${artifact.name}
- 朝代：${artifact.dynasty}
- 年代：${artifact.period}

【知识库】
${knowledgeFacts}

【规则】
1. 以现代人穿越的视角讲述
2. 创造沉浸式的历史场景
3. 基于史实进行合理想象
4. 明确标注虚构部分
5. 让用户身临其境
6. 每次回答不少于150字，场景描写生动丰富

【风格要求】
- 生动描绘历史场景和人物
- 用现代人的视角观察古代
- 可以加入情节和对话
- 保持历史细节的准确性
- 虚构内容要标注"[故事创作]"

请带用户穿越时空，体验${artifact.name}的精彩故事！`;
  }

  return buildSystemPrompt(artifactId, "artifact");
}

export async function POST(req: NextRequest) {
  try {
    const { artifactId, messages, mode = "artifact" } = await req.json();

    // 检查用户输入是否包含敏感词
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role === "user") {
      const check = containsSensitiveWords(lastUserMessage.content);
      if (check.hasSensitive) {
        return Response.json({
          choices: [{
            message: {
              content: "抱歉，您的问题涉及敏感话题，我无法回答。让我们聊聊文物和历史吧！"
            }
          }]
        });
      }

      // 检查是否为高频问题（仅文物模式使用缓存）
      if (mode === "artifact") {
        const cachedAnswer = getCachedAnswer(artifactId, lastUserMessage.content);
        if (cachedAnswer) {
          return Response.json({
            choices: [{
              message: {
                content: cachedAnswer
              }
            }]
          });
        }
      }
    }

    const systemPrompt = buildSystemPrompt(artifactId, mode as ChatMode);
    const apiUrl = process.env.CHAT_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const apiKey = process.env.CHAT_API_KEY || process.env.OPENAI_API_KEY;
    const model = process.env.CHAT_MODEL || process.env.MODEL || "gpt-4o-mini";

    // 对话历史自动摘要（超过10轮）
    const summarizedMessages = summarizeMessages(messages);

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        thinking: { type: "disabled" },
        messages: [
          { role: "system", content: systemPrompt },
          ...summarizedMessages
        ],
        temperature: 0.7,
        max_tokens: 4000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[chat] upstream error:", response.status, errorText.slice(0, 500));
      const msg = `AI服务暂时不可用，请稍后重试。(${response.status})`;
      return new Response(
        `data: ${JSON.stringify({ choices: [{ delta: { content: msg } }] })}\n\ndata: [DONE]\n\n`,
        { headers: { "Content-Type": "text/event-stream" } }
      );
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    const msg = handleAPIError(error);
    return new Response(
      `data: ${JSON.stringify({ choices: [{ delta: { content: msg } }] })}\n\ndata: [DONE]\n\n`,
      { headers: { "Content-Type": "text/event-stream" } }
    );
  }
}
