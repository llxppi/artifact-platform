import { NextRequest } from "next/server";
import { handleAPIError } from "@/lib/error-handler";

export async function POST(req: NextRequest) {
  try {
    const { content, mode } = await req.json();
    const apiUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

    const modeHint: Record<string, string> = {
      artifact: "以文物第一人称视角",
      historian: "以历史学家视角",
      traveler: "以穿越旅行者视角",
    };

    const response = await fetch(`https://api.deepseek.com/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [
          {
            role: "user",
            content: `根据以下回答内容，${modeHint[mode] || ""}生成2个用户可能感兴趣的追问问题。只返回JSON数组，例如：["问题1","问题2"]\n\n回答内容：${content.slice(0, 500)}`,
          },
        ],
        thinking: { type: "disabled" },
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!response.ok) return Response.json({ suggestions: [] });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "[]";
    const match = text.match(/\[[\s\S]*\]/);
    const suggestions = match ? JSON.parse(match[0]) : [];
    return Response.json({ suggestions: suggestions.slice(0, 2) });
  } catch (error: any) {
    return Response.json({ suggestions: [] });
  }
}
