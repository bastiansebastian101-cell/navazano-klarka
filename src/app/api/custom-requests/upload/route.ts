import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { checkRateLimit, getIp } from '@/lib/rateLimit';

const MAX_SIZE = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  if (!checkRateLimit(`custom-request-upload:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'too_large' }, { status: 400 });
  }

  const blob = await put(`custom-requests/${Date.now()}-${file.name}`, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
