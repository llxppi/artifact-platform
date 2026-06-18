import { NextRequest } from "next/server";
import { getArtifactById } from "@/data/artifacts";

export async function POST(req: NextRequest) {
  const { text, artifactId } = await req.json();
  const artifact = getArtifactById(artifactId);

  if (!artifact) {
    return Response.json({ error: "文物未找到" }, { status: 404 });
  }

  const match = artifact.knowledge.find(k =>
    k.content.includes(text) || text.includes(k.content.slice(0, 20))
  );

  if (match) {
    return Response.json({
      credibility: match.credibility,
      source: match.source,
      type: match.type,
      verified: true,
      label: "史实内容"
    });
  }

  return Response.json({
    credibility: 0,
    source: "AI生成内容，未经验证",
    verified: false,
    label: "虚拟内容"
  });
}
