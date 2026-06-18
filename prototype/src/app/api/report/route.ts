import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { artifactId, contentType, content, errorPosition, reason, userId } = await req.json();

    // 保存举报记录到数据库（这里先用localStorage模拟）
    const report = {
      id: Date.now(),
      artifactId,
      contentType, // 'chat' | 'story'
      content,
      errorPosition,
      reason,
      userId,
      status: 'pending', // pending | reviewed | resolved
      createdAt: new Date().toISOString()
    };

    return Response.json({
      success: true,
      message: "感谢您的反馈！我们将在24小时内审核并处理。",
      reportId: report.id
    });
  } catch (error: any) {
    return Response.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
