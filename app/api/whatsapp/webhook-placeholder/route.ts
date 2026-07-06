import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const provider = process.env.WHATSAPP_PROVIDER || 'not-configured';
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');
  const verifyToken = req.nextUrl.searchParams.get('hub.verify_token');
  const configuredToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && configuredToken && verifyToken === configuredToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({
    ok: true,
    provider,
    phase: 'placeholder',
    message: 'WhatsApp webhook placeholder only. Phase 1 uses wa.me prefilled messages and admin review.',
    futureProviders: ['Meta WhatsApp Cloud API', 'Twilio WhatsApp', 'Gupshup', 'WATI', 'Interakt'],
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  /*
    Future structure:
    - Meta WhatsApp Cloud API: verify signature, read messages/media IDs, fetch media server-side.
    - Twilio WhatsApp: validate Twilio signature, normalize Body/MediaUrl fields.
    - Gupshup / WATI / Interakt: verify provider token/signature and normalize inbound message payloads.
    Phase 1 intentionally does not call paid provider APIs and does not store media/base64 documents.
  */
  return NextResponse.json({
    ok: true,
    phase: 'placeholder',
    received: Boolean(body && Object.keys(body).length),
    message: 'Inbound WhatsApp parsing is reserved for a later phase. No external provider call was made.',
  });
}
