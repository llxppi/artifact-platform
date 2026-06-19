import { NextRequest } from "next/server";
import { getArtifactById } from "@/data/artifacts";

function safeParseJSON(text: string): unknown {
  try { return JSON.parse(text); } catch {}
  return null;
}

const styleGuides: Record<string, string> = {
  温情治愈: "语言柔和温暖，侧重情感联结，结尾传递美好感悟",
  历史正剧: "语言严谨庄重，贴合真实历史背景，侧重文物历史价值",
  Q版可爱: "语言活泼俏皮，多用拟人化，文物形象可爱",
  悬疑探秘: "语言略带紧张感，围绕文物隐秘谜团，结尾揭晓温和谜底",
  工匠传承: "语言朴实有质感，侧重制作工艺与传承历程",
  穿越对话: "语言轻松幽默，穿越场景自然，对话接地气",
  q_version: "文物拟人化，语言轻松活泼",
  realistic: "尊重史实，语言庄重",
  mystery: "悬疑感，结尾留疑问",
  healing: "温暖治愈，情感细腻",
  historical: "严肃厚重，还原历史细节",
  craftsman: "工匠视角，细节考究",
  timetravel: "古今对话，语言活泼有反差感",
};

export async function POST(req: NextRequest) {
  try {
    const { artifactId, previousActs, selectedBranch, direction, style, nickname = "", identity = "", relation = "", isLast = false } = await req.json();

    if (!artifactId || !previousActs || !selectedBranch) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const artifact = getArtifactById(artifactId);
    if (!artifact) return Response.json({ error: "Artifact not found" }, { status: 404 });

    const knowledgeFacts = artifact.knowledge
      .filter((k) => k.credibility >= 3)
      .slice(0, 2)
      .map((k) => `- ${k.content}`)
      .join("\n");

    const prevSummary = previousActs.map((a: { act_title: string; content: string }) => `【${a.act_title}】${a.content.slice(0, 100)}`).join("\n");
    const styleGuide = styleGuides[style] || style || "写实";
    const userCtx = nickname ? `昵称：${nickname}，身份：${identity}，关系：${relation}` : "";

    const lastActNumber = previousActs[previousActs.length - 1]?.act_number ?? 2;
    const nextNum = lastActNumber + 1;

    const branchRule = isLast ? "" : `，choice1/choice2必须是与段落结尾悬念直接相关的具体行动（禁止选A/选B/深入了解等泛化词），direction1/direction2根据选择实际倾向填写（禁止固定填温情治愈/历史推理）`;
    const outputSchema = isLast
      ? `{"acts":[{"act_number":${nextNum},"act_title":"结尾","content":"100-150字"},{"act_number":${nextNum + 1},"act_title":"知识点","content":"• 知识点1\\n• 知识点2"}]}`
      : `{"acts":[{"act_number":${nextNum},"act_title":"高潮","content":"150-200字","branch":{"choice1":"具体行动描述","direction1":"实际倾向2-4字","choice2":"具体行动描述","direction2":"实际倾向2-4字"}}]}`;

    const prompt = `继续为文物「${artifact.name}」创作后续剧情，输出JSON。

【前情摘要】${prevSummary}
【选择】${selectedBranch}（${direction}）
【史实】${knowledgeFacts}
【风格】${styleGuide}${userCtx ? `\n【用户】${userCtx}` : ""}

每句≤15字，对话用「」，JSON内禁用英文双引号${branchRule}

只返回JSON：
${outputSchema}`;

    const apiUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.MODEL || "gpt-oss-20b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 3000,
        stream: true,
      }),
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) return controller.close();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.trim().startsWith("data:")) continue;
              const data = line.trim().slice(5).trim();
              if (data === "[DONE]") continue;
              try {
                const content = JSON.parse(data).choices?.[0]?.delta?.content || "";
                if (content) {
                  fullText += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text: content })}\n\n`));
                }
              } catch {}
            }
          }
          let parsed = null;
          try {
            const jsonText = fullText.trim().replace(/```json\s*/g, "").replace(/```\s*/g, "");
            const first = jsonText.indexOf("{");
            const last = jsonText.lastIndexOf("}");
            if (first !== -1 && last > first) parsed = safeParseJSON(jsonText.substring(first, last + 1));
          } catch {}
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", parsed })}\n\n`));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
