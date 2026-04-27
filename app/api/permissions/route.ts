import { NextRequest, NextResponse } from 'next/server';
import { getPermissions, addPermission } from '@/lib/store';

export async function GET() {
  return NextResponse.json(getPermissions());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newPerm = addPermission(body);
  return NextResponse.json(newPerm, { status: 201 });
}
