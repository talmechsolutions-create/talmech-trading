import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminSecurity';
import { createOutreachProspect, listOutreachProspects, outreachProspectsCsv } from '@/lib/outreachStore';
import { auditAdminAction } from '@/lib/security/auditLog';
import { apiError, apiOk } from '@/lib/security/apiResponse';
import { publicStorageError } from '@/lib/storageMode';

export const dynamic = 'force-dynamic';

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

function resultStatus(code: string) {
  if (code === 'DUPLICATE_PROSPECT') return 409;
  if (code === 'VALIDATION_ERROR') return 400;
  return 400;
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return apiError('ADMIN_AUTH_REQUIRED', 'Admin authentication required.', 401);

  const filters = {
    businessType: req.nextUrl.searchParams.get('businessType') || '',
    outreachStatus: req.nextUrl.searchParams.get('outreachStatus') || '',
    city: req.nextUrl.searchParams.get('city') || '',
    state: req.nextUrl.searchParams.get('state') || '',
  };
  const prospects = await listOutreachProspects(filters);

  if (req.nextUrl.searchParams.get('format') === 'csv') {
    return new NextResponse(outreachProspectsCsv(prospects), {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="talmech-outreach-prospects.csv"',
      },
    });
  }

  return apiOk({ prospects, updatedAt: new Date().toISOString() });
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return apiError('ADMIN_AUTH_REQUIRED', 'Admin authentication required.', 401);

  const body = await req.json().catch(() => ({}));
  try {
    const result = await createOutreachProspect(body);
    if (!result.ok) {
      return apiError(result.code, (result as any).message || 'Prospect could not be saved.', resultStatus(result.code), {
        issues: (result as any).issues,
        duplicate: (result as any).duplicate,
      });
    }
    await auditAdminAction({
      action: 'OUTREACH_PROSPECT_CREATED',
      entity: 'OutreachProspect',
      entityId: result.prospect.prospectId,
      note: result.prospect.businessType,
    });
    return apiOk({ prospect: result.prospect });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    console.error('OUTREACH_PROSPECT_CREATE_FAILED', error);
    return apiError('OUTREACH_PROSPECT_CREATE_FAILED', 'Unable to save prospect.', 500);
  }
}
