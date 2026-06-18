import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const auth = token ? verifyToken(token) : null;
  if (!auth) return Response.json({ error: '未登录' }, { status: 401 });

  const { artifactId } = await req.json();
  await prisma.favorite.create({ data: { userId: auth.userId, artifactId } });
  return Response.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const auth = token ? verifyToken(token) : null;
  if (!auth) return Response.json({ error: '未登录' }, { status: 401 });

  const { artifactId } = await req.json();
  await prisma.favorite.deleteMany({ where: { userId: auth.userId, artifactId } });
  return Response.json({ success: true });
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const auth = token ? verifyToken(token) : null;
  if (!auth) return Response.json({ error: '未登录' }, { status: 401 });

  const favorites = await prisma.favorite.findMany({ where: { userId: auth.userId } });
  return Response.json(favorites);
}
