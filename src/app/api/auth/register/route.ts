import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return Response.json({ error: '邮箱已注册' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });

    const token = generateToken(user.id);
    return Response.json({ token, user: { id: user.id, email, name } });
  } catch (error) {
    return Response.json({ error: '注册失败' }, { status: 500 });
  }
}
