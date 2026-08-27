import { NextRequest } from 'next/server';
import { industrialApiFailure, industrialNoStoreHeaders, requireIndustrialApiPermission, requireIndustrialViewApi } from '@/lib/industrialIntelligenceApi';
import { getIndustrialCompanyDetail } from '@/lib/industrialIntelligenceService';
import {
  addIndustrialCapability,
  addIndustrialProcess,
  addIndustrialServiceOpportunity,
  addIndustrialSource,
  createManualIndustrialContact,
  createManualIndustrialPlant,
  updateManualIndustrialCompany,
} from '@/lib/industrial/managementService';
import { apiError, apiOk } from '@/lib/security/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const access = requireIndustrialViewApi(req);
  if (!access.ok) return access.response;

  try {
    const result = await getIndustrialCompanyDetail(params.id);
    if (result.schemaReady && !result.data) return apiError('INDUSTRIAL_COMPANY_NOT_FOUND', 'Industrial company not found.', 404);
    return apiOk({ company: result.data, schemaReady: result.schemaReady, updatedAt: new Date().toISOString() }, { headers: industrialNoStoreHeaders });
  } catch (error) {
    return industrialApiFailure(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const access = requireIndustrialApiPermission(req, 'industrial_intelligence.edit');
  if (!access.ok) return access.response;

  try {
    const result = await updateManualIndustrialCompany(params.id, await req.json(), access.actor.username);
    return apiOk(result, { headers: industrialNoStoreHeaders });
  } catch (error) {
    return industrialApiFailure(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const action = String(body.action || '').trim();
  const permission = action === 'addSource' ? 'industrial_intelligence.verify' : 'industrial_intelligence.edit';
  const access = requireIndustrialApiPermission(req, permission);
  if (!access.ok) return access.response;

  try {
    let result;
    if (action === 'addPlant') result = await createManualIndustrialPlant(params.id, body, access.actor.username);
    else if (action === 'addContact') result = await createManualIndustrialContact({ ...body, companyId: params.id }, access.actor.username);
    else if (action === 'addCapability') result = await addIndustrialCapability(params.id, body, access.actor.username);
    else if (action === 'addProcess') result = await addIndustrialProcess(body, access.actor.username);
    else if (action === 'addServiceOpportunity') result = await addIndustrialServiceOpportunity(params.id, body, access.actor.username);
    else if (action === 'addSource') result = await addIndustrialSource(params.id, body, access.actor.username);
    else return apiError('INVALID_INDUSTRIAL_ACTION', 'Unsupported Industrial Intelligence company action.', 400);

    const status = result.status === 'DUPLICATE_REVIEW_REQUIRED' ? 409 : 201;
    return apiOk(result, { status, headers: industrialNoStoreHeaders });
  } catch (error) {
    return industrialApiFailure(error);
  }
}
