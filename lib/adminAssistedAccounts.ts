import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { findWhatsappUpload, updateWhatsappUploadAccountCreation } from '@/lib/whatsappUploadStore';
import { WhatsappAccountCreation, WhatsappUploadSubmission } from '@/lib/whatsappUploadTypes';
import { createUserRegistration, findUser, listUsers, updateUserRegistrationRecord } from '@/lib/proDb';
import { sendOrQueueEmail } from '@/lib/email';
import { getBusinessEmailFrom } from '@/lib/emailConfig';
import {
  isValidEmail,
  isValidGst,
  isValidIndianMobile,
  normalizeEmail,
  normalizeGst,
  normalizeIndianMobile,
  sanitizeMultiline,
  sanitizeString,
} from '@/lib/validation';

type AdminAccountInput = {
  role?: string;
  accountType?: string;
  fullName?: string;
  firmName?: string;
  mobile?: string;
  alternateMobile?: string;
  email?: string;
  gstNumber?: string;
  city?: string;
  state?: string;
  address?: string;
  productInterest?: string;
  selectedMetal?: string;
  selectedProduct?: string;
  selectedGrade?: string;
  selectedProductForm?: string;
  adminNote?: string;
};

type AccountEmailOptions = {
  user: any;
  submission: WhatsappUploadSubmission;
  activationUrl?: string;
  alreadyActivated?: boolean;
  temporaryPassword?: string;
};

const activationTtlMs = 7 * 24 * 60 * 60 * 1000;

function accountId() {
  return `USR-WA-${Date.now()}`;
}

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function roleCategory(accountType: string) {
  const lower = accountType.toLowerCase();
  if (lower.includes('trader')) return 'trader';
  if (lower.includes('seller') || lower.includes('supplier') || lower.includes('manufacturer') || lower.includes('scrap')) return 'seller';
  if (lower.includes('logistics')) return 'logistics';
  return 'buyer';
}

export function accountTypeForWhatsappRole(role: unknown) {
  const lower = sanitizeString(role, 80).toLowerCase();
  if (lower.includes('trader')) return 'Trader - buyer and seller access';
  if (lower.includes('supplier')) return 'Seller / Supplier';
  if (lower.includes('manufacturer')) return 'Manufacturer';
  if (lower.includes('seller')) return 'Seller / Supplier';
  return 'Buyer';
}

function productInterestFromSubmission(submission: WhatsappUploadSubmission) {
  return [
    submission.finalMetalLabel || submission.selectedMetal || submission.customMetal,
    submission.finalProductLabel || submission.selectedProduct || submission.customProduct,
    submission.finalGradeLabel || submission.selectedGrade || submission.customGrade,
    submission.finalProductFormLabel || submission.selectedProductForm || submission.customProductForm,
    [submission.quantity, submission.quantityUnit].filter(Boolean).join(' '),
  ].filter(Boolean).join(' / ');
}

function cleanAccountInput(submission: WhatsappUploadSubmission, input: AdminAccountInput) {
  const accountType = sanitizeString(input.accountType, 100) || accountTypeForWhatsappRole(input.role || submission.role);
  const address =
    sanitizeMultiline(input.address, 900) ||
    sanitizeMultiline(submission.dispatchLocation || submission.deliveryLocation, 900);

  return {
    role: sanitizeString(input.role || submission.role, 80),
    accountType,
    roleCategory: roleCategory(accountType),
    fullName: sanitizeString(input.fullName || submission.fullName, 120),
    firmName: sanitizeString(input.firmName || submission.firmName, 160),
    mobile: normalizeIndianMobile(input.mobile || submission.mobile),
    alternateMobile: input.alternateMobile || submission.alternateMobile ? normalizeIndianMobile(input.alternateMobile || submission.alternateMobile) : '',
    email: normalizeEmail(input.email || submission.email),
    gstNumber: normalizeGst(input.gstNumber || submission.gstNumber),
    city: sanitizeString(input.city || submission.city, 80),
    state: sanitizeString(input.state || submission.state, 80),
    address,
    productInterest: sanitizeMultiline(input.productInterest || productInterestFromSubmission(submission), 1200),
    selectedMetal: sanitizeString(input.selectedMetal || submission.finalMetalLabel || submission.selectedMetal || submission.customMetal, 120),
    selectedProduct: sanitizeString(input.selectedProduct || submission.finalProductLabel || submission.selectedProduct || submission.customProduct, 140),
    selectedGrade: sanitizeString(input.selectedGrade || submission.finalGradeLabel || submission.selectedGrade || submission.customGrade, 120),
    selectedProductForm: sanitizeString(input.selectedProductForm || submission.finalProductFormLabel || submission.selectedProductForm || submission.customProductForm, 120),
    adminNote: sanitizeMultiline(input.adminNote, 800),
  };
}

function validateAccountInput(cleaned: ReturnType<typeof cleanAccountInput>) {
  if (!cleaned.fullName) return 'Enter the client contact name.';
  if (!cleaned.firmName) return 'Enter the firm or company name.';
  if (!isValidIndianMobile(cleaned.mobile)) return 'Enter a valid Indian mobile number.';
  if (cleaned.alternateMobile && !isValidIndianMobile(cleaned.alternateMobile)) return 'Enter a valid alternate mobile number or leave it blank.';
  if (!isValidEmail(cleaned.email)) return 'Enter a valid email address for activation.';
  if (cleaned.gstNumber && !isValidGst(cleaned.gstNumber)) return 'Enter a valid GST number or leave it blank.';
  if (!cleaned.accountType) return 'Select an account type.';
  return '';
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function createActivationToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token), expiresAt: new Date(Date.now() + activationTtlMs).toISOString() };
}

function temporaryPassword() {
  return `${randomBytes(9).toString('base64url')}T7!`;
}

function activationUrl(token: string) {
  return `${appBaseUrl()}/activate-account?token=${encodeURIComponent(token)}`;
}

export function hashAdminAssistedPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { passwordHash: hash, passwordSalt: salt, passwordKdf: 'scrypt' };
}

export function verifyAdminAssistedPassword(password: string, user: any) {
  const hash = sanitizeString(user?.passwordHash, 200);
  const salt = sanitizeString(user?.passwordSalt, 80);
  if (!hash || !salt) return false;
  const incoming = Buffer.from(scryptSync(password, salt, 64).toString('hex'), 'hex');
  const stored = Buffer.from(hash, 'hex');
  if (incoming.length !== stored.length) return false;
  return timingSafeEqual(incoming, stored);
}

function safeAccount(user: any) {
  return {
    id: user.id,
    status: user.status || 'PENDING_PROFILE_CONFIRMATION',
    accountType: user.accountType || 'Buyer',
    roleCategory: user.roleCategory || roleCategory(user.accountType || 'Buyer'),
    firmName: user.firmName || '',
    ownerName: user.ownerName || '',
    primaryMobile: user.primaryMobile || '',
    alternateMobile: user.alternateMobile || '',
    email: user.email || '',
    city: user.city || '',
    state: user.state || '',
    gstNumber: user.gstNumber || '',
    adminCreated: Boolean(user.adminCreated),
    onboardingSource: user.onboardingSource || '',
    whatsappSubmissionId: user.whatsappSubmissionId || '',
    mustChangePassword: Boolean(user.mustChangePassword),
    profileConfirmationRequired: user.profileConfirmationRequired !== false,
    activationStatus: user.activationStatus || '',
  };
}

async function findDuplicateAccount(email: string, mobile: string) {
  const users = await listUsers();
  return users.find((user: any) => {
    const emailMatch = email && normalizeEmail(user.email) === email;
    const mobileMatch = mobile && normalizeIndianMobile(user.primaryMobile || user.mobile || user.phone) === mobile;
    return emailMatch || mobileMatch;
  }) || null;
}

function accountEmailHtml({ user, submission, activationUrl: activateUrl, alreadyActivated, temporaryPassword }: AccountEmailOptions) {
  const loginUrl = `${appBaseUrl()}/signin`;
  const dashboardUrl = `${appBaseUrl()}/account`;
  const rows = [
    ['Client name', user.ownerName],
    ['Account ID / User ID', user.id],
    ['Account type', user.accountType],
    ['Firm name', user.firmName],
    ['Registered mobile', user.primaryMobile],
    ['Registered email', user.email],
    ['Dashboard URL', dashboardUrl],
    ['WhatsApp submission', submission.submissionId],
    ['Login URL', loginUrl],
    ['Temporary password', temporaryPassword || 'Use your existing password or request a fresh admin resend.'],
    ['Product / requirement interest', user.tradingProducts],
  ];

  const activationBlock = temporaryPassword
    ? '<p><b>Security:</b> Sign in with the temporary password above and change it after first login. Email/mobile OTP is disabled only for this admin-created account setup.</p>'
    : activateUrl
    ? `<p><b>Activate account:</b> <a href="${escapeHtml(activateUrl)}">${escapeHtml(activateUrl)}</a></p>
       <p>This link lets you set your password. Email OTP is not required for this admin-created setup.</p>`
    : alreadyActivated
      ? '<p>Your account password is already set. Use the login URL above to continue.</p>'
      : '<p>Please contact Talmech support for a fresh activation link.</p>';

  return `
  <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a">
    <h2 style="margin:0 0 10px">Your Talmech Trading account has been created</h2>
    <p>Hello ${escapeHtml(user.ownerName || user.firmName || 'there')},</p>
    <p>Your Talmech Trading account has been created by the Talmech admin team based on the details you shared through WhatsApp.</p>
    <table style="border-collapse:collapse;width:100%;max-width:760px">
      ${rows.map(([key, value]) => `<tr><td style="border:1px solid #dbe4ee;padding:10px;background:#f8fafc;font-weight:700;width:190px">${escapeHtml(key)}</td><td style="border:1px solid #dbe4ee;padding:10px">${escapeHtml(value || '-')}</td></tr>`).join('')}
    </table>
    ${activationBlock}
    <p>For security, please review your business details after your first login.</p>
    <p>Please reply to this email or WhatsApp Talmech with 3 clear product pictures, stock proof, GST, certificate, price, dispatch location, delivery location, grade, product form, or any missing details that need correction.</p>
    <p>If you did not request this account, please contact Talmech support immediately.</p>
    <p>Regards,<br/><b>Raghavendra Tiwari</b><br/>Talmech Trading<br/>Support: +91 7389642874</p>
  </div>`;
}

async function sendAccountEmail(options: AccountEmailOptions) {
  return sendOrQueueEmail({
    to: options.user.email,
    subject: 'Your Talmech Trading account has been created',
    html: accountEmailHtml(options),
    text: [
      'Your Talmech Trading account has been created.',
      `Client name: ${options.user.ownerName || '-'}`,
      `Firm name: ${options.user.firmName || '-'}`,
      `Account ID/User ID: ${options.user.id || '-'}`,
      `Dashboard URL: ${appBaseUrl()}/account`,
      `Login URL: ${appBaseUrl()}/signin`,
      `Username/User ID: ${options.user.email || options.user.primaryMobile || options.user.id}`,
      options.temporaryPassword ? `Temporary password: ${options.temporaryPassword}` : '',
      `Product/requirement interest: ${options.user.tradingProducts || '-'}`,
      'Change your password after first login.',
      'Please share 3 clear product pictures, stock proof, GST, certificate, price, dispatch location, delivery location, grade, product form, or any missing details.',
      'Raghavendra Tiwari | Talmech Trading | Support: +91 7389642874',
    ].filter(Boolean).join('\n'),
    leadId: options.submission.submissionId,
  });
}

function emailNeedsManualCopy(result: any) {
  return result?.status !== 'sent';
}

function normalizedEmailStatus(result: any): 'sent' | 'failed' | 'preview' {
  if (result?.status === 'sent') return 'sent';
  if (result?.status === 'preview') return 'preview';
  return 'failed';
}

function accountCreationFromEmail(
  existing: WhatsappAccountCreation | undefined,
  user: any,
  emailResult: any,
  activation: { expiresAt?: string; status?: 'pending' | 'activated' },
  adminNote?: string,
  notification: { type?: string; recipient?: string; clientFollowUpRequired?: boolean } = {}
): WhatsappAccountCreation {
  const now = new Date().toISOString();
  const emailStatus = normalizedEmailStatus(emailResult);
  const emailSender = sanitizeString(emailResult?.from || getBusinessEmailFrom(), 254);
  const emailProvider = sanitizeString(emailResult?.provider, 80);
  const emailError = emailStatus === 'failed'
    ? sanitizeMultiline(JSON.stringify(emailResult?.providerError || emailResult?.error || emailResult?.reason || ''), 500)
    : '';
  return {
    ...(existing || {}),
    status: emailStatus === 'sent' ? 'Email Sent' : 'Needs Follow-up',
    accountId: user.id,
    accountType: user.accountType,
    roleCategory: user.roleCategory,
    adminCreated: true,
    onboardingSource: 'whatsapp-assisted',
    verificationStatus: 'Pending Profile Confirmation',
    profileConfirmationRequired: true,
    emailOtpRequired: false,
    mobileOtpRequired: false,
    activationStatus: activation.status || existing?.activationStatus || 'pending',
    activationTokenExpiresAt: activation.expiresAt || existing?.activationTokenExpiresAt || '',
    credentialsSentAt: now,
    emailLastAttemptAt: now,
    emailStatus,
    emailProvider,
    emailRecipient: sanitizeString(notification.recipient || user.email, 254).toLowerCase(),
    emailSender,
    lastEmailSentAt: emailStatus === 'sent' ? now : '',
    emailError,
    notificationType: sanitizeString(notification.type || 'client_account_created', 80),
    clientFollowUpRequired: notification.clientFollowUpRequired === undefined ? existing?.clientFollowUpRequired : Boolean(notification.clientFollowUpRequired),
    emailPreviewAvailable: emailNeedsManualCopy(emailResult),
    lastEmailError: emailError,
    adminNote: sanitizeMultiline(adminNote || existing?.adminNote, 800),
  };
}

function accountManualInstructions(user: any, submission: WhatsappUploadSubmission, tempPassword?: string) {
  return [
    `Hello ${user.ownerName || user.firmName || 'there'},`,
    '',
    'Your Talmech Trading account has been created by the Talmech admin team from the details shared through WhatsApp.',
    `Company: ${user.firmName || '-'}`,
    `Account ID/User ID: ${user.id || '-'}`,
    `Dashboard URL: ${appBaseUrl()}/account`,
    `Login URL: ${appBaseUrl()}/signin`,
    `Username/User ID: ${user.email || user.primaryMobile || user.id}`,
    tempPassword ? `Temporary password: ${tempPassword}` : 'Password: use your current password or request a fresh Talmech admin resend.',
    `WhatsApp submission: ${submission.submissionId}`,
    '',
    'Please sign in, change the temporary password after first login, review your business details, and share 3 clear product images if your listing is missing photos.',
    'Reply to Talmech support if any product, GST, certificate, price, stock, or dispatch information needs correction.',
    '',
    'Regards,',
    'Raghavendra Tiwari',
    'Talmech Trading | Support: +91 7389642874',
  ].join('\n');
}

export async function createAdminAssistedAccount(submissionId: string, input: AdminAccountInput) {
  const submission = await findWhatsappUpload(submissionId);
  if (!submission) return { ok: false, status: 404, error: 'Submission not found.' };
  if (submission.accountCreation?.accountId) {
    return { ok: false, status: 409, error: 'An account is already linked to this WhatsApp submission.', submission };
  }

  const cleaned = cleanAccountInput(submission, input || {});
  const validationError = validateAccountInput(cleaned);
  if (validationError) return { ok: false, status: 400, error: validationError };

  const duplicate = await findDuplicateAccount(cleaned.email, cleaned.mobile);
  if (duplicate) {
    return { ok: false, status: 409, error: 'A user already exists for this email or mobile number.', duplicate: safeAccount(duplicate) };
  }

  const tempPassword = temporaryPassword();
  const password = hashAdminAssistedPassword(tempPassword);
  const now = new Date().toISOString();
  const user = {
    id: accountId(),
    createdAt: now,
    updatedAt: now,
    status: 'PENDING_PROFILE_CONFIRMATION',
    roleCategory: cleaned.roleCategory,
    accountType: cleaned.accountType,
    firmName: cleaned.firmName,
    ownerName: cleaned.fullName,
    businessRole: 'Admin-assisted WhatsApp onboarding',
    directorName: '',
    gstNumber: cleaned.gstNumber,
    primaryMobile: cleaned.mobile,
    alternateMobile: cleaned.alternateMobile,
    email: cleaned.email,
    state: cleaned.state,
    city: cleaned.city,
    area: '',
    pincode: '',
    fullAddress: cleaned.address,
    liveLocation: '',
    locationPermission: false,
    tradingProducts: cleaned.productInterest,
    monthlyTradingVolume: '',
    monthlyTradingVolumeUnit: '',
    tradeScope: cleaned.roleCategory === 'trader' ? 'Domestic' : '',
    annualTurnoverAmount: '',
    annualTurnoverUnit: '',
    tradingExperienceYears: '',
    buyerSellerMix: cleaned.roleCategory === 'trader' ? 'Both buying and selling' : '',
    majorMarkets: [cleaned.city, cleaned.state].filter(Boolean).join(', '),
    importExportCode: '',
    paymentCycle: '',
    warehouseDetails: '',
    subscriptionRequired: cleaned.roleCategory === 'trader',
    subscriptionPlan: cleaned.roleCategory === 'trader' ? 'Trader dual-access approval / subscription review required' : 'Not required',
    shopImages: [],
    documents: `Admin-assisted account created from WhatsApp submission ${submission.submissionId}. Product interest: ${cleaned.productInterest || 'Not shared'}.`,
    createdFrom: 'whatsapp-assisted-admin',
    accountLock: cleaned.accountType,
    adminCreated: true,
    onboardingSource: 'whatsapp-assisted',
    whatsappSubmissionId: submission.submissionId,
    verificationStatus: 'Pending Profile Confirmation',
    emailOtpRequired: false,
    mobileOtpRequired: false,
    mustChangePassword: true,
    profileConfirmationRequired: true,
    accountCreatedAt: now,
    credentialsSentAt: '',
    activationStatus: 'activated',
    activationTokenHash: '',
    activationTokenExpiresAt: '',
    ...password,
    temporaryPasswordIssuedAt: now,
    adminAssistedNote: cleaned.adminNote,
  };

  const saved = await createUserRegistration(user);
  if (saved.duplicate) {
    return { ok: false, status: 409, error: 'A registration already exists for this mobile, email or GST number.', duplicate: safeAccount(saved.duplicate) };
  }

  const emailResult = await sendAccountEmail({ user, submission, temporaryPassword: tempPassword });
  const accountCreation = accountCreationFromEmail(
    { status: 'Account Created' },
    user,
    emailResult,
    { status: 'activated' },
    cleaned.adminNote,
    { type: 'client_account_created', recipient: user.email, clientFollowUpRequired: true }
  );
  const updatedSubmission = await updateWhatsappUploadAccountCreation(submission.submissionId, accountCreation, {
    status: 'Converted',
    note: `Admin-assisted account ${user.id} created from WhatsApp submission.`,
  });

  await updateUserRegistrationRecord(user.id, {
    credentialsSentAt: accountCreation.credentialsSentAt,
    emailDeliveryStatus: accountCreation.emailStatus,
    emailProvider: accountCreation.emailProvider,
    emailSender: accountCreation.emailSender,
    emailRecipient: accountCreation.emailRecipient,
    emailStatus: accountCreation.emailStatus,
    lastEmailSentAt: accountCreation.lastEmailSentAt,
    emailError: accountCreation.emailError,
    clientNotificationLastSentAt: accountCreation.lastEmailSentAt,
    clientNotificationLastEmailSentAt: accountCreation.lastEmailSentAt,
    clientNotificationStatus: accountCreation.emailStatus,
    clientNotificationRecipient: user.email,
    clientNotificationSender: accountCreation.emailSender,
    clientNotificationProvider: accountCreation.emailProvider,
    clientNotificationEmailError: accountCreation.emailError,
  });

  return {
    ok: true,
    user: safeAccount(user),
    submission: updatedSubmission,
    email: emailResult,
    manualCopy: emailNeedsManualCopy(emailResult) ? {
      temporaryPassword: tempPassword,
      instructions: accountManualInstructions(user, submission, tempPassword),
    } : undefined,
  };
}

export async function resendAdminAssistedAccountEmail(submissionId: string) {
  const submission = await findWhatsappUpload(submissionId);
  if (!submission) return { ok: false, status: 404, error: 'Submission not found.' };
  const accountIdValue = submission.accountCreation?.accountId;
  if (!accountIdValue) return { ok: false, status: 400, error: 'No account is linked to this WhatsApp submission yet.' };

  const user = await findUser(accountIdValue);
  if (!user) return { ok: false, status: 404, error: 'Linked user account was not found.' };
  if (!isValidEmail(user.email)) return { ok: false, status: 400, error: 'Linked user account does not have a valid email.' };

  const shouldIssueTemporaryPassword = Boolean(user.mustChangePassword) || user.activationStatus !== 'activated' || !user.passwordHash;
  const freshTemporaryPassword = shouldIssueTemporaryPassword ? temporaryPassword() : '';
  const passwordPatch = freshTemporaryPassword ? hashAdminAssistedPassword(freshTemporaryPassword) : {};
  const activated = !shouldIssueTemporaryPassword;
  const activation = freshTemporaryPassword ? null : activated ? null : createActivationToken();
  if (freshTemporaryPassword) {
    await updateUserRegistrationRecord(user.id, {
      ...passwordPatch,
      activationStatus: 'activated',
      activationTokenHash: '',
      activationTokenExpiresAt: '',
      mustChangePassword: true,
      temporaryPasswordIssuedAt: new Date().toISOString(),
      emailOtpRequired: false,
      mobileOtpRequired: false,
    });
  } else if (activation) {
    await updateUserRegistrationRecord(user.id, {
      activationStatus: 'pending',
      activationTokenHash: activation.hash,
      activationTokenExpiresAt: activation.expiresAt,
    });
  }

  const activateUrl = activation ? activationUrl(activation.token) : undefined;
  const emailResult = await sendAccountEmail({
    user,
    submission,
    activationUrl: activateUrl,
    alreadyActivated: activated,
    temporaryPassword: freshTemporaryPassword,
  });
  const accountCreation = accountCreationFromEmail(
    submission.accountCreation,
    user,
    emailResult,
    { expiresAt: activation?.expiresAt, status: freshTemporaryPassword || activated ? 'activated' : 'pending' },
    submission.accountCreation?.adminNote,
    { type: 'client_account_resend', recipient: user.email, clientFollowUpRequired: submission.accountCreation?.clientFollowUpRequired }
  );
  const updatedSubmission = await updateWhatsappUploadAccountCreation(submission.submissionId, accountCreation, {
    note: `Admin-assisted account email resent for ${user.id}.`,
  });

  await updateUserRegistrationRecord(user.id, {
    credentialsSentAt: accountCreation.credentialsSentAt,
    emailDeliveryStatus: accountCreation.emailStatus,
    emailProvider: accountCreation.emailProvider,
    emailSender: accountCreation.emailSender,
    emailRecipient: accountCreation.emailRecipient,
    emailStatus: accountCreation.emailStatus,
    lastEmailSentAt: accountCreation.lastEmailSentAt,
    emailError: accountCreation.emailError,
    clientNotificationLastSentAt: accountCreation.lastEmailSentAt,
    clientNotificationLastEmailSentAt: accountCreation.lastEmailSentAt,
    clientNotificationStatus: accountCreation.emailStatus,
    clientNotificationRecipient: user.email,
    clientNotificationSender: accountCreation.emailSender,
    clientNotificationProvider: accountCreation.emailProvider,
    clientNotificationEmailError: accountCreation.emailError,
  });

  return {
    ok: true,
    user: safeAccount(user),
    submission: updatedSubmission,
    email: emailResult,
    manualActivationUrl: activateUrl && emailNeedsManualCopy(emailResult) ? activateUrl : undefined,
    manualCopy: emailNeedsManualCopy(emailResult) ? {
      temporaryPassword: freshTemporaryPassword,
      instructions: accountManualInstructions(user, submission, freshTemporaryPassword),
    } : undefined,
  };
}

export async function activateAdminAssistedAccount(token: string, password: string) {
  const cleanToken = sanitizeString(token, 300);
  if (cleanToken.length < 24) return { ok: false, status: 400, error: 'Invalid activation token.' };
  if (String(password || '').length < 12) return { ok: false, status: 400, error: 'Password must be at least 12 characters.' };

  const tokenHash = hashToken(cleanToken);
  const users = await listUsers();
  const user = users.find((candidate: any) => (
    candidate.adminCreated === true &&
    candidate.onboardingSource === 'whatsapp-assisted' &&
    candidate.activationTokenHash === tokenHash &&
    candidate.activationTokenExpiresAt &&
    Date.parse(candidate.activationTokenExpiresAt) > Date.now()
  ));

  if (!user) return { ok: false, status: 404, error: 'Activation link is invalid or expired.' };

  const hashed = hashAdminAssistedPassword(password);
  const updated = await updateUserRegistrationRecord(user.id, {
    ...hashed,
    passwordSetAt: new Date().toISOString(),
    activationStatus: 'activated',
    activationTokenHash: '',
    activationTokenExpiresAt: '',
    mustChangePassword: false,
    profileConfirmationRequired: true,
    emailOtpRequired: false,
    mobileOtpRequired: false,
    activatedAt: new Date().toISOString(),
  });

  return { ok: true, user: safeAccount(updated || user) };
}

export async function loginAdminAssistedAccount(login: string, password: string) {
  const cleanLogin = sanitizeString(login, 254);
  const lookup = cleanLogin.includes('@') ? normalizeEmail(cleanLogin) : normalizeIndianMobile(cleanLogin);
  const user = await findUser(lookup);
  if (!user || user.adminCreated !== true || !['whatsapp-assisted', 'manual-admin-listing'].includes(user.onboardingSource)) {
    return { ok: false, status: 401, error: 'Invalid admin-assisted account login.' };
  }
  if (user.activationStatus !== 'activated' || !user.passwordHash) {
    return { ok: false, status: 403, error: 'Activate this admin-created account before signing in.' };
  }
  if (!verifyAdminAssistedPassword(password, user)) {
    return { ok: false, status: 401, error: 'Invalid admin-assisted account login.' };
  }
  return { ok: true, user: safeAccount(user) };
}

export async function changeAdminAssistedAccountPassword(userId: string, currentPassword: string, nextPassword: string) {
  const user = await findUser(userId);
  if (!user || user.adminCreated !== true || !['whatsapp-assisted', 'manual-admin-listing'].includes(user.onboardingSource)) {
    return { ok: false, status: 401, error: 'Admin-created account sign-in required.' };
  }
  if (!verifyAdminAssistedPassword(currentPassword, user)) {
    return { ok: false, status: 401, error: 'Current password is incorrect.' };
  }
  if (String(nextPassword || '').length < 12) {
    return { ok: false, status: 400, error: 'New password must be at least 12 characters.' };
  }
  if (currentPassword === nextPassword) {
    return { ok: false, status: 400, error: 'Choose a new password different from the temporary password.' };
  }

  const hashed = hashAdminAssistedPassword(nextPassword);
  const updated = await updateUserRegistrationRecord(user.id, {
    ...hashed,
    passwordSetAt: new Date().toISOString(),
    activationStatus: 'activated',
    activationTokenHash: '',
    activationTokenExpiresAt: '',
    mustChangePassword: false,
    profileConfirmationRequired: true,
  });

  return { ok: true, user: safeAccount(updated || user) };
}
