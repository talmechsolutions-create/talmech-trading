export type ValidationIssue = {
  field: string;
  message: string;
};

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

export function sanitizeString(value: unknown, maxLength = 500): string {
  if (value === null || value === undefined) return '';
  const raw =
    typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      ? String(value)
      : '';
  return raw
    .replace(CONTROL_CHARS, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeMultiline(value: unknown, maxLength = 2000): string {
  if (value === null || value === undefined) return '';
  const raw =
    typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      ? String(value)
      : '';
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeStringArray(value: unknown, maxItems = 12, maxLength = 180): string[] {
  const rows = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/\n|,/)
      : [];

  return rows
    .map((item) => sanitizeString(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

export function normalizeEmail(value: unknown): string {
  return sanitizeString(value, 254).toLowerCase();
}

export function isValidEmail(value: unknown): boolean {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function normalizeIndianMobile(value: unknown): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.slice(-10);
}

export function isValidIndianMobile(value: unknown): boolean {
  return /^[6-9]\d{9}$/.test(normalizeIndianMobile(value));
}

export function normalizeGst(value: unknown): string {
  return sanitizeString(value, 15).toUpperCase();
}

export function isValidGst(value: unknown): boolean {
  const gst = normalizeGst(value);
  return /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst);
}

export function normalizePincode(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '').slice(0, 6);
}

export function isValidPincode(value: unknown): boolean {
  return /^[1-9]\d{5}$/.test(normalizePincode(value));
}

export function toFiniteNumber(value: unknown, fallback = 0): number {
  const cleaned =
    typeof value === 'string' ? value.replace(/,/g, '').replace(/[^\d.-]/g, '') : value;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function maskMobile(value: unknown): string {
  const mobile = normalizeIndianMobile(value);
  if (mobile.length !== 10) return '';
  return `${mobile.slice(0, 2)}******${mobile.slice(-2)}`;
}

export function maskEmail(value: unknown): string {
  const email = normalizeEmail(value);
  const [name, domain] = email.split('@');
  if (!name || !domain) return '';
  const visible = name.length <= 2 ? name.slice(0, 1) : name.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(2, name.length - visible.length))}@${domain}`;
}

export function maskText(value: unknown, visibleStart = 2): string {
  const text = sanitizeString(value, 120);
  if (text.length <= visibleStart) return text ? `${text[0]}***` : '';
  return `${text.slice(0, visibleStart)}${'*'.repeat(Math.min(8, Math.max(3, text.length - visibleStart)))}`;
}

export function sanitizeFileMetadata(value: unknown, maxItems = 8) {
  const rows = Array.isArray(value) ? value : [];
  return rows.slice(0, maxItems).map((item) => ({
    name: sanitizeString((item as Record<string, unknown>)?.name, 140),
    type: sanitizeString((item as Record<string, unknown>)?.type, 80),
    size: Math.max(0, Math.round(toFiniteNumber((item as Record<string, unknown>)?.size))),
    compressed: Boolean((item as Record<string, unknown>)?.compressed),
    previewSize: Math.max(0, Math.round(toFiniteNumber((item as Record<string, unknown>)?.previewSize))),
  }));
}

export function jsonSizeBytes(value: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(value ?? null), 'utf8');
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

export function collectMissing(input: Record<string, unknown>, fields: string[]): ValidationIssue[] {
  return fields
    .filter((field) => !sanitizeString(input[field], 1000))
    .map((field) => ({ field, message: `Missing required field: ${field}` }));
}
