const DEFAULT_BUSINESS_FROM = 'Raghavendra Tiwari <raghavendra.tiwari@talmechtrading.in>';

function cleanEnv(key: string) {
  return String(process.env[key] || '').trim();
}

function parseSecure(value: string, port: number) {
  if (!value) return port === 465;
  return ['1', 'true', 'yes', 'ssl'].includes(value.toLowerCase());
}

export function getBusinessEmailFrom() {
  return cleanEnv('NOTIFICATION_FROM_EMAIL') || cleanEnv('EMAIL_FROM') || DEFAULT_BUSINESS_FROM;
}

export function getOtpEmailFrom() {
  return cleanEnv('OTP_FROM_EMAIL');
}

export function getSmtpConfig() {
  const host = cleanEnv('SMTP_HOST');
  const port = Number(cleanEnv('SMTP_PORT') || 465);
  const secure = parseSecure(cleanEnv('SMTP_SECURE'), port);
  const user = cleanEnv('SMTP_USER');
  const password = cleanEnv('SMTP_PASSWORD');
  const provider = cleanEnv('EMAIL_PROVIDER') || (host ? 'smtp' : '');

  return {
    provider,
    host,
    port: Number.isFinite(port) && port > 0 ? port : 465,
    secure,
    user,
    password,
    configured: Boolean(host && user && password),
  };
}

export function isBusinessEmailConfigured() {
  return getSmtpConfig().configured || Boolean(cleanEnv('RESEND_API_KEY'));
}
