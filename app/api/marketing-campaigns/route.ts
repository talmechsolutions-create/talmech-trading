import { NextResponse } from 'next/server';
import { defaultCampaigns, marketingCampaignsFile, readJsonArray, writeJsonArray } from '@/lib/marketingSeo';
import { canUseJsonFileStorage, publicStorageError } from '@/lib/storageMode';

export const dynamic = 'force-dynamic';

async function listCampaigns() {
  const rows = await readJsonArray(marketingCampaignsFile);
  if (rows.length) return rows;
  const defaults = defaultCampaigns();
  if (!canUseJsonFileStorage()) return defaults;
  await writeJsonArray(marketingCampaignsFile, defaults);
  return defaults;
}

export async function GET() {
  const campaigns = await listCampaigns();
  return NextResponse.json({ ok: true, campaigns });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const rows = await listCampaigns();
  const now = new Date().toISOString();
  const campaign = {
    id: body.id || `mc-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    status: body.status || 'Draft',
    channel: body.channel || 'SEO / Organic',
    objective: body.objective || 'Lead generation',
    audience: body.audience || '',
    region: body.region || '',
    keywordTheme: body.keywordTheme || '',
    landingPage: body.landingPage || '/public-marketplace',
    budget: body.budget || '',
    owner: body.owner || 'Talmech Marketing',
    notes: body.notes || '',
  };
  try {
    rows.unshift(campaign);
    await writeJsonArray(marketingCampaignsFile, rows);
    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to save campaign.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const rows = await listCampaigns();
  const idx = rows.findIndex((row: any) => row.id === body.id);
  if (idx < 0) return NextResponse.json({ ok: false, error: 'Campaign not found.' }, { status: 404 });
  try {
    rows[idx] = { ...rows[idx], ...body, updatedAt: new Date().toISOString() };
    await writeJsonArray(marketingCampaignsFile, rows);
    return NextResponse.json({ ok: true, campaign: rows[idx] });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to update campaign.' }, { status: 500 });
  }
}
