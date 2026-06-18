import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return Response.json({ error: '用户不存在' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return Response.json({ error: '密码错误' }, { status: 401 });
    }

    const token = generateToken(user.id);
    return Response.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    return Response.json({ error: '登录失败' }, { status: 500 });
  }
}
