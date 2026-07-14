import { NextRequest, NextResponse } from 'next/server';
import { csv } from '@/lib/marketplaceStore';
import { createUserRegistration, findUser, listUsers, updateUserRegistrationStatus } from '@/lib/proDb';
import { apiError } from '@/lib/security/apiResponse';
import { detectHoneypot, formFillTimeOk, verifyTurnstileToken } from '@/lib/security/inputSanitizer';
import { getClientIp, rateLimitResponse } from '@/lib/security/rateLimit';
import { getStorageMode, publicStorageError } from '@/lib/storageMode';
import {
  collectMissing,
  isValidEmail,
  isValidGst,
  isValidIndianMobile,
  isValidPincode,
  jsonSizeBytes,
  maskEmail,
  maskMobile,
  maskText,
  normalizeEmail,
  normalizeGst,
  normalizeIndianMobile,
  normalizePincode,
  sanitizeFileMetadata,
  sanitizeMultiline,
  sanitizeString,
  toFiniteNumber,
} from '@/lib/validation';

export const dynamic = 'force-dynamic';

const headers = [
  'id','createdAt','updatedAt','status','roleCategory','accountType','firmName','ownerName','businessRole','directorName','gstNumber','primaryMobile','alternateMobile','email','state','city','area','pincode','fullAddress','liveLocation','locationPermission','shopImages','documents','tradingProducts','monthlyTradingVolume','monthlyTradingVolumeUnit','tradeScope','annualTurnoverAmount','annualTurnoverUnit','tradingExperienceYears','buyerSellerMix','majorMarkets','importExportCode','paymentCycle','warehouseDetails','subscriptionRequired','subscriptionPlan','rejectionReason'
];

function isTrader(accountType: string) {
  return String(accountType || '').toLowerCase().includes('trader');
}


function publicUserSummary(user: any) {
  if (!user) return null;
  const { raw, shopImages, documents, ...rest } = user;
  return {
    ...rest,
    documents: sanitizeMultiline(documents, 1000),
    shopImages: Array.isArray(shopImages)
      ? sanitizeFileMetadata(shopImages)
      : undefined,
  };
}

function publicStatusSummary(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    status: user.status || 'PENDING_REVIEW',
    roleCategory: user.roleCategory || roleCategory(user.accountType),
    accountType: user.accountType,
    firmName: maskText(user.firmName, 3),
    primaryMobile: maskMobile(user.primaryMobile),
    email: maskEmail(user.email),
    city: sanitizeString(user.city, 80),
    state: sanitizeString(user.state, 80),
    nextAction:
      user.status === 'APPROVED'
        ? 'Admin approval is recorded. Sign in with your verified contact and continue.'
        : 'Talmech admin must review documents, location, GST and commercial details before activation.',
  };
}

function roleCategory(accountType: string) {
  const lower = String(accountType || '').toLowerCase();
  if (lower.includes('trader')) return 'trader';
  if (lower.includes('seller') || lower.includes('supplier') || lower.includes('manufacturer') || lower.includes('scrap')) return 'seller';
  if (lower.includes('logistics')) return 'logistics';
  return 'buyer';
}

export async function GET(req: NextRequest) {
  try {
    const statusQuery = req.nextUrl.searchParams.get('statusBy');
    if (statusQuery) {
      const rawLookup = sanitizeString(statusQuery, 254);
      const lookupKey = rawLookup.startsWith('USR-')
        ? rawLookup
        : rawLookup.includes('@')
          ? normalizeEmail(rawLookup)
          : normalizeIndianMobile(rawLookup);
      const u = await findUser(lookupKey);
      return NextResponse.json({ ok: !!u, user: publicStatusSummary(u) });
    }

    const users = await listUsers();
    if (req.nextUrl.searchParams.get('format') === 'csv') {
      return new NextResponse(csv(users, headers), {
        headers: {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': 'attachment; filename="talmech-user-registrations.csv"',
        },
      });
    }

    return NextResponse.json({ users, updatedAt: new Date().toISOString(), storage: getStorageMode() });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    console.error('USER_REGISTRATIONS_GET_FAILED', error);
    return NextResponse.json({ ok: false, error: 'Unable to load user registrations.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const limited = await rateLimitResponse(req, { keyPrefix: 'user-registration', limit: 10, windowMs: 30 * 60 * 1000 });
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  if (detectHoneypot(body) || !formFillTimeOk(body)) return apiError('SPAM_CHECK_FAILED', 'Unable to accept this registration.', 400);
  const captcha = await verifyTurnstileToken((body as any).turnstileToken || (body as any)['cf-turnstile-response'], getClientIp(req));
  if (!captcha.ok) return apiError('CAPTCHA_FAILED', captcha.error, 400);

  if (jsonSizeBytes(body) > 1_500_000) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Registration payload is too large. Upload previews are not stored publicly; submit smaller images or document notes.',
      },
      { status: 413 }
    );
  }

  const accountType = sanitizeString(body.accountType || 'Buyer', 80) || 'Buyer';
  const trader = isTrader(accountType);

  const required = ['firmName', 'ownerName', 'gstNumber', 'primaryMobile', 'alternateMobile', 'email', 'pincode', 'fullAddress'];
  const missing = collectMissing(body, required);
  if (missing.length) {
    return NextResponse.json({ ok: false, error: missing[0].message, issues: missing }, { status: 400 });
  }

  if (!isValidGst(body.gstNumber)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid GST number.' }, { status: 400 });
  }

  if (!isValidIndianMobile(body.primaryMobile) || !isValidIndianMobile(body.alternateMobile)) {
    return NextResponse.json({ ok: false, error: 'Enter two valid Indian mobile numbers.' }, { status: 400 });
  }

  if (normalizeIndianMobile(body.primaryMobile) === normalizeIndianMobile(body.alternateMobile)) {
    return NextResponse.json({ ok: false, error: 'Primary and alternate mobile numbers must be different.' }, { status: 400 });
  }

  if (!isValidEmail(body.email)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
  }

  if (!isValidPincode(body.pincode)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid 6 digit PIN code.' }, { status: 400 });
  }

  if (body.locationPermission !== true) {
    return NextResponse.json(
      { ok: false, error: 'Location verification permission is required before admin review.' },
      { status: 400 }
    );
  }

  const shopImages = sanitizeFileMetadata(body.shopImages);
  if (shopImages.length < 2) {
    return NextResponse.json(
      { ok: false, error: 'Upload at least two shop, office, warehouse or stockyard image references.' },
      { status: 400 }
    );
  }

  if (trader) {
    const traderRequired = ['tradingProducts', 'monthlyTradingVolume', 'annualTurnoverAmount', 'tradingExperienceYears', 'majorMarkets'];
    for (const key of traderRequired) {
      if (!body[key]) return NextResponse.json({ ok: false, error: `Missing trader approval field: ${key}` }, { status: 400 });
    }
  }

  const user = {
    id: `USR-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'PENDING_REVIEW',
    roleCategory: roleCategory(accountType),
    subscriptionRequired: trader || Boolean(body.subscriptionRequired),
    accountType,
    firmName: sanitizeString(body.firmName, 140),
    ownerName: sanitizeString(body.ownerName, 120),
    businessRole: sanitizeString(body.businessRole, 80),
    directorName: sanitizeString(body.directorName, 120),
    gstNumber: normalizeGst(body.gstNumber),
    primaryMobile: normalizeIndianMobile(body.primaryMobile),
    alternateMobile: normalizeIndianMobile(body.alternateMobile),
    email: normalizeEmail(body.email),
    state: sanitizeString(body.state, 80),
    city: sanitizeString(body.city, 80),
    area: sanitizeString(body.area, 120),
    pincode: normalizePincode(body.pincode),
    fullAddress: sanitizeMultiline(body.fullAddress, 800),
    liveLocation: sanitizeString(body.liveLocation, 500),
    locationPermission: true,
    tradingProducts: sanitizeMultiline(body.tradingProducts, 1200),
    monthlyTradingVolume: sanitizeString(body.monthlyTradingVolume, 80),
    monthlyTradingVolumeUnit: sanitizeString(body.monthlyTradingVolumeUnit, 80),
    tradeScope: sanitizeString(body.tradeScope, 80),
    annualTurnoverAmount: String(toFiniteNumber(body.annualTurnoverAmount, 0) || ''),
    annualTurnoverUnit: sanitizeString(body.annualTurnoverUnit, 30),
    tradingExperienceYears: String(toFiniteNumber(body.tradingExperienceYears, 0) || ''),
    buyerSellerMix: sanitizeString(body.buyerSellerMix, 100),
    majorMarkets: sanitizeMultiline(body.majorMarkets, 1200),
    importExportCode: sanitizeString(body.importExportCode, 40),
    paymentCycle: sanitizeString(body.paymentCycle, 120),
    warehouseDetails: sanitizeMultiline(body.warehouseDetails, 1200),
    shopImages,
    documents: sanitizeMultiline(body.documents, 1500),
    createdFrom: sanitizeString(body.createdFrom, 80),
    accountLock: accountType,
    subscriptionPlan: trader
      ? 'Trader dual-access approval / subscription review required'
      : sanitizeString(body.subscriptionPlan || 'Not required', 120),
  };

  let saved;
  try {
    saved = await createUserRegistration(user);
    if (saved.duplicate) {
      return NextResponse.json({ ok: false, error: 'A registration already exists for this mobile, email or GST number.', user: publicUserSummary(saved.duplicate) }, { status: 409 });
    }
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to save registration.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user: publicUserSummary(saved.user) });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = sanitizeString(body.id, 80);
  const status = sanitizeString(body.status, 80);
  const reason = sanitizeMultiline(body.reason, 500);
  if (!id || !status) return NextResponse.json({ ok: false, error: 'Missing user id or status.' }, { status: 400 });
  try {
    const updated = await updateUserRegistrationStatus(id, status, reason);
    if (!updated) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    return NextResponse.json({ ok: true, user: updated });
  } catch (error) {
    const storageError = publicStorageError(error);
    if (storageError) return NextResponse.json(storageError, { status: storageError.status });
    return NextResponse.json({ ok: false, error: 'Unable to update registration.' }, { status: 500 });
  }
}
