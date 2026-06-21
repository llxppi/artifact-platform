import { NextRequest } from "next/server";
import { getArtifactById } from "@/data/artifacts";

function safeParseJSON(text: string): unknown {
  try { return JSON.parse(text); } catch {}
  // Fix unescaped double quotes inside string values
  try {
    const fixed = text.replace(/"([^"]*)"(\s*:\s*)"([^"]*)"/g, (m, k, sep, v) =>
      `"${k}"${sep}"${v.replace(/"/g, '\\"')}"`
    );
    return JSON.parse(fixed);
  } catch {}
  // Aggressive: replace all " inside values with 「」
  try {
    const fixed = text.replace(/:\s*"([\s\S]*?)(?<!\\)"(?=\s*[,}\]])/g, (m, v) =>
      `: "${v.replace(/(?<!\\)"/g, '\\"')}"`
    );
    return JSON.parse(fixed);
  } catch {}
  return null;
}

const styleGuides: Record<string, string> = {
  // 新key（与STYLE_OPTIONS一致）
  温情治愈: "语言柔和温暖，侧重文物与用户的情感联结，无冲突，结尾传递美好感悟，适合全年龄",
  历史正剧: "语言严谨庄重，贴合真实历史背景，侧重文物历史价值，适合历史爱好者",
  Q版可爱: "语言活泼俏皮，多用拟人化表达，文物形象可爱，剧情简单易懂，适合小学生",
  悬疑探秘: "语言略带紧张感，围绕文物隐秘谜团展开，结尾揭晓温和谜底，不恐怖",
  工匠传承: "语言朴实有质感，侧重制作工艺与传承历程，结合工匠后人身份更适配",
  穿越对话: "语言轻松幽默，穿越场景自然，用户与文物/古人对话接地气，带轻喜剧效果",
  // 旧key兼容
  q_version: "文物拟人化卡通形象，语言轻松活泼，矛盾可爱化，适合全年龄",
  realistic: "尊重史实，语言庄重，符合时代感，人物对话参考历史正剧",
  mystery: "围绕未解之谜，叙述带悬疑感，结尾留疑问，可虚构侦探角色",
  healing: "温暖治愈基调，聚焦人与文物的情感连接，语言柔和细腻",
  historical: "严肃厚重叙事，还原历史细节，人物命运与时代背景深度交织",
  craftsman: "聚焦工匠视角，展现制作工艺与匠人精神，细节考究",
  timetravel: "古今对话碰撞，现代视角与古代场景交织，语言活泼有反差感",
};

function buildScenePrompt(
  artifactId: string,
  sceneTemplate: string,
  style: string,
  nickname: string,
  identity: string,
  relation: string,
  length: "短篇" | "中篇" | "长篇" = "中篇"
): string {
  const artifact = getArtifactById(artifactId);
  if (!artifact) throw new Error("Artifact not found");

  const knowledgeFacts = artifact.knowledge
    .filter((k) => k.credibility >= 3)
    .slice(0, 2)
    .map((k) => `- ${k.content}`)
    .join("\n");

  const sceneDescriptions: Record<string, string> = {
    "court-ceremony": "皇家祭祀仪式现场，文物正在发挥其最重要的礼仪功能",
    "time-travel": "现代用户穿越到文物所在的朝代，与它邂逅",
    discovery: "文物在沉睡千年后被重新发现的考古现场",
    "daily-life": "文物所处时代普通人的日常生活场景",
  };

  const userBinding = nickname
    ? `【专属绑定】昵称：${nickname}，身份：${identity || "历史爱好者"}，关系：${relation || "朋友"}
要求：故事开篇自然嵌入昵称"${nickname}"，以其身份和关系展开叙事，强化代入感`
    : "";

  const shareText = nickname
    ? `「${nickname}与【${artifact.name}】跨越千年的对话」`
    : `「与【${artifact.name}】跨越千年的对话」`;

  const lengthConfigs = {
    short: { wordCount: "200-300字", actsDesc: "开篇（1段，含分支）", actsJson: `[{"act_number":1,"act_title":"开篇","content":"150-200字故事内容","branch":{"choice1":"具体行动描述","direction1":"根据情节填写2-4字倾向","choice2":"具体行动描述","direction2":"根据情节填写2-4字倾向"}}]` },
    medium: { wordCount: "400-500字", actsDesc: "开篇→发展（2段，每段含分支）", actsJson: `[{"act_number":1,"act_title":"开篇","content":"150-200字","branch":{"choice1":"具体行动描述","direction1":"根据情节填写2-4字倾向","choice2":"具体行动描述","direction2":"根据情节填写2-4字倾向"}},{"act_number":2,"act_title":"发展","content":"150-200字","branch":{"choice1":"具体行动描述","direction1":"根据情节填写2-4字倾向","choice2":"具体行动描述","direction2":"根据情节填写2-4字倾向"}}]` },
    long: { wordCount: "600-800字", actsDesc: "开篇→发展→高潮（3段，每段含分支）", actsJson: `[{"act_number":1,"act_title":"开篇","content":"200-250字","branch":{"choice1":"具体行动描述","direction1":"根据情节填写2-4字倾向","choice2":"具体行动描述","direction2":"根据情节填写2-4字倾向"}},{"act_number":2,"act_title":"发展","content":"200-250字","branch":{"choice1":"具体行动描述","direction1":"根据情节填写2-4字倾向","choice2":"具体行动描述","direction2":"根据情节填写2-4字倾向"}},{"act_number":3,"act_title":"高潮","content":"200-250字","branch":{"choice1":"具体行动描述","direction1":"根据情节填写2-4字倾向","choice2":"具体行动描述","direction2":"根据情节填写2-4字倾向"}}]` },
  };
  const lengthKey = length === "短篇" ? "short" : length === "长篇" ? "long" : "medium";
  const lengthConfig = lengthConfigs[lengthKey];

  return `为文物「${artifact.name}」创作情景故事，严格输出JSON。

【场景】${sceneDescriptions[sceneTemplate] || sceneTemplate}
【史实】${knowledgeFacts}
【风格】${styleGuides[style] || style}
${userBinding}

【规则】结构${lengthConfig.actsDesc}，每句≤15字，对话用「」，JSON内禁用英文双引号，choice1/choice2必须是与段落结尾悬念直接相关的具体行动（禁止"选A"/"选B"/"深入了解"等泛化词），direction1/direction2根据选择的实际情感倾向填写（如"主动追问"/"沉默感受"/"直接质疑"，禁止固定填"温情治愈"/"历史推理"），知识点content用「•」列出2条真实史实
${nickname ? `昵称"${nickname}"自然嵌入开篇` : ""}

只返回JSON，fact_check各字段填入故事中具体的史实/虚构/推测内容（非占位符），learn_more填入与文物相关的真实探索问题：
{"title":"标题","share_text":"${shareText}","acts":${lengthConfig.actsJson},"fact_check":{"verified_elements":["故事中出现的真实史实描述"],"fictional_elements":["故事中虚构的情节描述"],"inferred_elements":["故事中合理推测的内容描述"]},"learn_more":["与${artifact.name}相关的探索问题1","探索问题2"]}`;
}

export async function POST(req: NextRequest) {
  try {
    const {
      artifactId,
      sceneTemplate,
      style,
      nickname = "",
      identity = "",
      relation = "",
      length = "中篇",
    } = await req.json();

    if (!artifactId || !sceneTemplate || !style) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = buildScenePrompt(artifactId, sceneTemplate, style, nickname, identity, relation, length as "短篇" | "中篇" | "长篇");
    const maxTokens = length === "长篇" ? 6000 : length === "短篇" ? 2000 : 4000;
    const apiUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.SCENE_MODEL || process.env.MODEL || "deepseek-v4-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[scene] upstream error:", response.status, errBody.slice(0, 500));
      return Response.json({ error: `Upstream ${response.status}: ${errBody.slice(0, 200)}` }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullText = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) return controller.close();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of decoder.decode(value).split("\n").filter((l) => l.trim().startsWith("data:"))) {
              const data = line.replace(/^data: /, "");
              if (data === "[DONE]") continue;
              try {
                const chunk = JSON.parse(data);
                const content = chunk.choices?.[0]?.delta?.content || "";
                const finishReason = chunk.choices?.[0]?.finish_reason;
                if (finishReason) console.log("[scene] finish_reason:", finishReason, "len:", fullText.length, "end:", fullText.slice(-100));
                if (content) {
                  fullText += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text: content })}\n\n`));
                }
              } catch {}
            }
          }
          let parsed = null;
          try {
            let jsonText = fullText.trim().replace(/```json\s*/g, "").replace(/```\s*/g, "");
            console.log("[scene] len:", fullText.length, "start:", jsonText.slice(0, 100));
            const first = jsonText.indexOf("{");
            const last = jsonText.lastIndexOf("}");
            if (first !== -1 && last > first) {
              try {
                parsed = safeParseJSON(jsonText.substring(first, last + 1));
              } catch (e2) {
                console.error("[scene] safeParseJSON failed:", e2, jsonText.slice(0, 200));
              }
            }
          } catch (e) {
            console.error("JSON parse error:", e);
          }
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
