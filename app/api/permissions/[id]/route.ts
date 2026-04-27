import { NextRequest, NextResponse } from 'next/server';
import { updatePermission } from '@/lib/store';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const result = updatePermission(id, body);
  return NextResponse.json(result);
}
