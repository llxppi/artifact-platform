import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { vessel, pattern, material, dynasty } = await req.json();

    const prompt = `你是文物创作导师，用户选择了：
器型：${vessel}
纹饰：${pattern}
材质：${material}
朝代：${dynasty}

请生成：
1. 这个组合的历史合理性评价
2. 文物名称建议
3. 简短的文物故事（100字）
4. 文物性格（3个词）

返回JSON格式：
{"name":"文物名","story":"故事","personality":"性格","rating":"合理性1-5分"}`;

    const apiUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.MODEL || "moonshotai/kimi-k2.5",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    return Response.json(parsed || { error: "Failed to parse" });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
