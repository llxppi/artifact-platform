import { NextRequest } from 'next/server';
import { ARTIFACTS } from '@/data/artifacts';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.toLowerCase() || '';

  if (!query) return Response.json([]);

  const results = ARTIFACTS.filter(a =>
    a.name.toLowerCase().includes(query) ||
    a.nickname.toLowerCase().includes(query) ||
    a.dynasty.toLowerCase().includes(query) ||
    a.category.toLowerCase().includes(query) ||
    a.description.toLowerCase().includes(query)
  );

  return Response.json(results);
}
