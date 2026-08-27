import { cleanWhitespace, joinSingleLetterTokens, normalizeAddressText, normalizeBasicText } from './text';
import {
  NormalizedCompanyName,
  NormalizedDomain,
  NormalizedEmail,
  NormalizedField,
  NormalizedGstin,
  NormalizedLocation,
  NormalizedPhone,
} from './types';

const suffixPattern = /\b(private limited|pvt limited|pvt ltd|pvt|private|limited|ltd|llp|inc|incorporated|co|company)\b/g;

const stateAliases = new Map([
  ['up', 'Uttar Pradesh'],
  ['u p', 'Uttar Pradesh'],
  ['uttar pradesh', 'Uttar Pradesh'],
  ['mp', 'Madhya Pradesh'],
  ['m p', 'Madhya Pradesh'],
  ['madhya pradesh', 'Madhya Pradesh'],
  ['orissa', 'Odisha'],
  ['odisha', 'Odisha'],
  ['delhi', 'Delhi'],
  ['new delhi', 'Delhi'],
  ['delhi ncr', 'Delhi NCR'],
]);

const cityAliases = new Map([
  ['bangalore', 'Bengaluru'],
  ['bengaluru', 'Bengaluru'],
  ['bombay', 'Mumbai'],
  ['mumbai', 'Mumbai'],
  ['new delhi', 'Delhi'],
  ['delhi', 'Delhi'],
]);

function normalizedField(original: string, normalized: string, valid = Boolean(normalized)): NormalizedField {
  return { original: String(original || '').trim(), normalized, valid };
}

function normalizeAlias(value: string, aliases: Map<string, string>) {
  const text = normalizeBasicText(value);
  return aliases.get(text) || cleanWhitespace(value);
}

export function normalizeCompanyName(value: string): NormalizedCompanyName {
  const original = String(value || '').trim();
  const normalized = joinSingleLetterTokens(normalizeBasicText(original))
    .replace(suffixPattern, ' ')
    .replace(/\band\b/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    original,
    normalized,
    displayName: cleanWhitespace(original),
  };
}

export function normalizeOfficialDomain(value: string): NormalizedDomain {
  const original = String(value || '').trim();
  if (!original) return { original, normalized: '', valid: false, reason: 'EMPTY' };
  try {
    const input = /^[a-z][a-z0-9+.-]*:\/\//i.test(original) ? original : `https://${original}`;
    const url = new URL(input);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    const normalized = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) {
      return { original, normalized: '', valid: false, reason: 'INVALID_HOST' };
    }
    return { original, normalized, valid: true };
  } catch {
    return { original, normalized: '', valid: false, reason: 'INVALID_URL' };
  }
}

export function normalizeGstin(value: string): NormalizedGstin {
  const original = String(value || '').trim();
  const normalized = original.toUpperCase().replace(/[\s\-./]/g, '');
  const valid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(normalized);
  return { original, normalized, valid, stateCode: valid ? normalized.slice(0, 2) : undefined };
}

export function normalizePhone(value: string, options: { countryContext?: 'IN' | 'UNKNOWN' } = { countryContext: 'IN' }): NormalizedPhone {
  const original = String(value || '').trim();
  const hasExplicitPlus = original.trim().startsWith('+');
  const digits = original.replace(/(?:ext|extension|x)\s*\d+$/i, '').replace(/\D/g, '');
  let nationalNumber = '';
  let countryCode = '';
  let e164 = '';
  let type: NormalizedPhone['type'] = 'UNKNOWN';
  let confidence: NormalizedPhone['confidence'] = 'LOW';

  if (hasExplicitPlus && digits.startsWith('91') && digits.length === 12 && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    countryCode = '91';
    nationalNumber = digits.slice(2);
    e164 = `+91${nationalNumber}`;
    type = 'MOBILE';
    confidence = 'HIGH';
  } else if (options.countryContext === 'IN' && digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    countryCode = '91';
    nationalNumber = digits;
    e164 = `+91${digits}`;
    type = 'MOBILE';
    confidence = 'HIGH';
  } else if (options.countryContext === 'IN' && digits.length === 11 && digits.startsWith('0') && /^[6-9]\d{9}$/.test(digits.slice(1))) {
    countryCode = '91';
    nationalNumber = digits.slice(1);
    e164 = `+91${nationalNumber}`;
    type = 'MOBILE';
    confidence = 'HIGH';
  } else if (options.countryContext === 'IN' && digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    countryCode = '91';
    nationalNumber = digits.slice(2);
    e164 = `+91${nationalNumber}`;
    type = 'MOBILE';
    confidence = 'HIGH';
  } else if (hasExplicitPlus && digits.length >= 8 && digits.length <= 15) {
    e164 = `+${digits}`;
    confidence = 'LOW';
  }

  return {
    original,
    normalized: e164,
    valid: Boolean(e164),
    countryCode: countryCode || undefined,
    nationalNumber: nationalNumber || undefined,
    e164: e164 || undefined,
    type,
    confidence,
  };
}

export function normalizeEmail(value: string): NormalizedEmail {
  const original = String(value || '').trim();
  const normalized = original.toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized);
  return { original, normalized, valid };
}

export function normalizeLocation(input: {
  country?: string;
  region?: string;
  state?: string;
  district?: string;
  city?: string;
  industrialCluster?: string;
  industrialArea?: string;
  pincode?: string;
  address?: string;
}): NormalizedLocation {
  const state = input.state ? normalizeAlias(input.state, stateAliases) : '';
  const city = input.city ? normalizeAlias(input.city, cityAliases) : '';
  const pincode = String(input.pincode || '').replace(/\D/g, '');
  return {
    country: input.country ? normalizedField(input.country, cleanWhitespace(input.country)) : undefined,
    region: input.region ? normalizedField(input.region, cleanWhitespace(input.region)) : undefined,
    state: input.state ? normalizedField(input.state, state, Boolean(state)) : undefined,
    district: input.district ? normalizedField(input.district, cleanWhitespace(input.district)) : undefined,
    city: input.city ? normalizedField(input.city, city, Boolean(city)) : undefined,
    industrialCluster: input.industrialCluster ? normalizedField(input.industrialCluster, cleanWhitespace(input.industrialCluster)) : undefined,
    industrialArea: input.industrialArea ? normalizedField(input.industrialArea, cleanWhitespace(input.industrialArea)) : undefined,
    pincode: input.pincode ? normalizedField(input.pincode, pincode, pincode.length === 6) : undefined,
    address: input.address ? normalizedField(input.address, normalizeAddressText(input.address)) : undefined,
  };
}

export function normalizePersonName(value: string): NormalizedField {
  return normalizedField(value, joinSingleLetterTokens(normalizeBasicText(value)));
}

export function normalizeDesignation(value: string): NormalizedField {
  return normalizedField(value, normalizeBasicText(value));
}

export { normalizeDepartment, normalizeProcessLabel, normalizeServiceOpportunity } from './taxonomy';

