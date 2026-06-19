import { NextRequest } from "next/server";
import { getArtifactById } from "@/data/artifacts";

export async function POST(req: NextRequest) {
  try {
    const { artifactId, currentAct, previousActs = [], style = "", nickname = "" } = await req.json();
    if (!artifactId || !currentAct) return Response.json({ error: "Missing fields" }, { status: 400 });

    const artifact = getArtifactById(artifactId);
    if (!artifact) return Response.json({ error: "Artifact not found" }, { status: 404 });

    const prevStory = previousActs
      .map((a: { act_title: string; content: string }) => `【${a.act_title}】${a.content.slice(0, 100)}`)
      .join("\n");

    const prompt = `你是一个互动故事设计师。请仔细阅读故事，为读者设计2个真正影响剧情走向的选择。

【文物】${artifact.name}（${artifact.dynasty}）${style ? `  【风格】${style}` : ""}${nickname ? `  【主角】${nickname}` : ""}
${prevStory ? `【前情回顾】\n${prevStory}\n` : ""}【当前段落结尾】
${currentAct.content.slice(-300)}

设计要求：
1. 先找出这个段落结尾留下的最核心悬念或矛盾（不要输出，内部思考）
2. 两个选择必须是读者在当前情境下自然会想做的事，且两者会导致完全不同的故事走向
3. 每个选择用一句话（8字以内），写具体动作或说出的话，不写选择后果
4. 两个选择性格方向要有明显差异（如：主动vs被动、感性vs理性、追问vs沉默等），根据故事实际情况决定，不要固定套"温情"和"推理"
5. 禁止：泛化词汇（"深入了解"、"继续探索"、"深入交流"）、"选A/选B"、与故事情节脱节的选项
6. 硬性要求：choice1和choice2的文字必须完全不同，不能是同一句话

只返回JSON，direction填本次选择的实际倾向（2-4字）：{"choice1":"具体行动或话语","direction1":"实际倾向","choice2":"具体行动或话语","direction2":"实际倾向"}`;

    const apiUrl = process.env.BRANCH_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const apiKey = process.env.BRANCH_API_KEY || process.env.OPENAI_API_KEY;
    const res = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.BRANCH_MODEL || process.env.MODEL || "gpt-oss-20b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    const text = msg?.content || msg?.reasoning_content || "";
    let parsed = null;
    try {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    } catch {}

    if (!parsed) {
      console.error("[branch] raw text:", text.slice(0, 300), "data:", JSON.stringify(data).slice(0, 300));
      return Response.json({ error: "Parse failed" }, { status: 500 });
    }
    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}
