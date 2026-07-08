import { randomBytes } from 'crypto';
import { hashAdminAssistedPassword } from '@/lib/adminAssistedAccounts';
import { sendClientListingNotification } from '@/lib/clientNotifications';
import { createUserRegistration, listUsers, updateUserRegistrationRecord } from '@/lib/proDb';
import { normalizeListingImages } from '@/lib/listingImages';
import { createWorkspaceListing } from '@/lib/workspaceListings';
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

type ManualAccountInput = Record<string, any>;
type ManualListingInput = Record<string, any>;
type CleanAccount = ReturnType<typeof cleanAccount>;
type CleanListing = ReturnType<typeof cleanListing>;

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

function accountId() {
  return `USR-MAN-${Date.now()}`;
}

function temporaryPassword() {
  return `${randomBytes(9).toString('base64url')}T7!`;
}

function cleanAccount(input: ManualAccountInput) {
  const accountType = sanitizeString(input.accountType, 100) || 'Buyer';
  return {
    accountType,
    roleCategory: roleCategory(accountType),
    fullName: sanitizeString(input.fullName || input.ownerName, 120),
    firmName: sanitizeString(input.firmName, 160),
    email: normalizeEmail(input.email),
    mobile: normalizeIndianMobile(input.mobile || input.primaryMobile),
    alternateMobile: input.alternateMobile ? normalizeIndianMobile(input.alternateMobile) : '',
    gstNumber: normalizeGst(input.gstNumber),
    city: sanitizeString(input.city, 80),
    state: sanitizeString(input.state, 80),
    address: sanitizeMultiline(input.address || input.fullAddress, 1000),
  };
}

function cleanListing(input: ManualListingInput) {
  return {
    listingType: sanitizeString(input.listingType, 80) || 'Sell Listing',
    metal: sanitizeString(input.metal, 80),
    product: sanitizeString(input.product, 140),
    grade: sanitizeString(input.grade, 100),
    productForm: sanitizeString(input.productForm, 120),
    sizeOrSpecification: sanitizeString(input.sizeOrSpecification, 240),
    quantity: sanitizeString(input.quantity, 80),
    quantityUnit: sanitizeString(input.quantityUnit, 40) || 'KG',
    price: sanitizeString(input.price, 120),
    targetPrice: sanitizeString(input.targetPrice || input.price, 120),
    priceUnit: sanitizeString(input.priceUnit, 60),
    taxStatus: sanitizeString(input.taxStatus, 60),
    stockStatus: sanitizeString(input.stockStatus, 80),
    certificateAvailable: sanitizeString(input.certificateAvailable, 80),
    certificateRequired: sanitizeString(input.certificateRequired, 80),
    dispatchLocation: sanitizeMultiline(input.dispatchLocation, 800),
    deliveryLocation: sanitizeMultiline(input.deliveryLocation, 800),
    city: sanitizeString(input.city, 80),
    state: sanitizeString(input.state, 80),
    deliveryTimeline: sanitizeString(input.deliveryTimeline, 120),
    remarks: sanitizeMultiline(input.remarks, 1200),
    productImages: normalizeListingImages(input.productImages || input, [input.metal, input.product, input.grade].filter(Boolean).join(' ')),
  };
}

function validationError(field: string, message: string) {
  return { ok: false, status: 400, code: 'VALIDATION_ERROR', message, field, error: message };
}

function quantityExplainedElsewhere(listing: CleanListing) {
  const note = `${listing.stockStatus} ${listing.remarks}`.toLowerCase();
  return /not sure|confirmation|made to order|to be confirmed|not confirmed|pending|after verification|will confirm|tbc/.test(note);
}

function withListingDefaults(account: CleanAccount, listing: CleanListing): CleanListing {
  const city = listing.city || account.city;
  const state = listing.state || account.state;
  const locationLabel = [city, state].filter(Boolean).join(', ');
  return {
    ...listing,
    city,
    state,
    dispatchLocation: listing.dispatchLocation || locationLabel,
    deliveryLocation: listing.deliveryLocation || locationLabel,
  };
}

function validate(account: CleanAccount, listing: CleanListing) {
  if (!account.accountType) return validationError('account.accountType', 'Select an account type.');
  if (!account.fullName && !account.firmName) {
    return validationError('account.firmName', 'Enter either firm name or contact person.');
  }
  if (!account.email && !account.mobile) {
    return validationError('account.email', 'Enter either client email or mobile number.');
  }
  if (account.email && !isValidEmail(account.email)) {
    return validationError('account.email', 'Enter a valid client email address or leave it blank.');
  }
  if (account.mobile && !isValidIndianMobile(account.mobile)) {
    return validationError('account.mobile', 'Enter a valid client mobile number or leave it blank.');
  }
  if (account.alternateMobile && !isValidIndianMobile(account.alternateMobile)) {
    return validationError('account.alternateMobile', 'Enter a valid alternate mobile number or leave it blank.');
  }
  if (account.gstNumber && !isValidGst(account.gstNumber)) {
    return validationError('account.gstNumber', 'Enter a valid GST number or leave it blank.');
  }
  if (!listing.listingType) return validationError('listing.listingType', 'Select a listing type.');
  if (!listing.metal) return validationError('listing.metal', 'Select the metal.');
  if (!listing.product) return validationError('listing.product', 'Select the product.');
  if (!listing.quantity && !quantityExplainedElsewhere(listing)) {
    return validationError('listing.quantity', 'Enter quantity, or use stock status/remarks to explain that quantity is not confirmed.');
  }
  if (!listing.quantityUnit) return validationError('listing.quantityUnit', 'Select a quantity unit.');
  return null;
}

async function findExistingAccount(email: string, mobile: string) {
  const users = await listUsers();
  return users.find((user: any) => {
    const emailMatch = email && normalizeEmail(user.email) === email;
    const mobileMatch = mobile && normalizeIndianMobile(user.primaryMobile || user.mobile || user.phone) === mobile;
    return emailMatch || mobileMatch;
  }) || null;
}

function productInterest(listing: ReturnType<typeof cleanListing>) {
  return [
    listing.listingType,
    listing.metal,
    listing.product,
    listing.grade,
    listing.productForm,
    [listing.quantity, listing.quantityUnit].filter(Boolean).join(' '),
  ].filter(Boolean).join(' / ');
}

function emailHtml(user: any, listing: any, password: string) {
  const loginUrl = `${appBaseUrl()}/signin`;
  const accountUrl = `${appBaseUrl()}/account`;
  const rows = [
    ['Firm name', user.firmName],
    ['Account type', user.accountType],
    ['Login email', user.email],
    ['Login mobile', user.primaryMobile],
    ['Temporary password', password],
    ['Listing ID', listing.id],
    ['Listing', `${listing.type} / ${listing.metal} / ${listing.product}`],
    ['Client workspace', accountUrl],
  ];

  return `
  <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a">
    <h2 style="margin:0 0 10px">Your Talmech Trading workspace is ready</h2>
    <p>Hello ${escapeHtml(user.ownerName || user.firmName || 'there')},</p>
    <p>Talmech admin has created your client workspace and listing from the details shared with our team.</p>
    <table style="border-collapse:collapse;width:100%;max-width:760px">
      ${rows.map(([key, value]) => `<tr><td style="border:1px solid #dbe4ee;padding:10px;background:#f8fafc;font-weight:700;width:190px">${escapeHtml(key)}</td><td style="border:1px solid #dbe4ee;padding:10px">${escapeHtml(value || '-')}</td></tr>`).join('')}
    </table>
    <p><b>Next step:</b> sign in at <a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a> with the temporary password above, then change your password immediately in the workspace.</p>
    <p>Email/mobile OTP is not required for this admin-created account. Normal public OTP onboarding remains unchanged for public registrations.</p>
    <p>Regards,<br/><b>Talmech Trading Team</b></p>
  </div>`;
}

function emailText(user: any, listing: any, password: string) {
  return [
    'Your Talmech Trading workspace is ready.',
    `Firm: ${user.firmName}`,
    `Account type: ${user.accountType}`,
    `Login: ${user.email || user.primaryMobile}`,
    `Temporary password: ${password}`,
    `Listing ID: ${listing.id}`,
    `Sign in: ${appBaseUrl()}/signin`,
    `Workspace: ${appBaseUrl()}/account`,
    'Change this temporary password immediately after first login.',
  ].join('\n');
}

async function sendManualEmail(user: any, listing: any, password: string) {
  const html = emailHtml(user, listing, password);
  const text = emailText(user, listing, password);
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || process.env.NOTIFICATION_FROM_EMAIL || 'Talmech Trading <onboarding@resend.dev>';
  if (!apiKey) {
    return { status: 'preview_only', provider: 'manual_preview', html, text };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: user.email,
        subject: 'Your Talmech Trading workspace is ready',
        html,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { status: 'sent', provider: 'resend', data };
    return { status: 'provider_error', provider: 'resend', data, html, text };
  } catch (error: any) {
    return { status: 'provider_error', provider: 'resend', error: error?.message || String(error), html, text };
  }
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
    mustChangePassword: Boolean(user.mustChangePassword),
    profileConfirmationRequired: user.profileConfirmationRequired !== false,
  };
}

export async function createManualAdminClientListing(input: { account?: ManualAccountInput; listing?: ManualListingInput }) {
  const account = cleanAccount(input.account || {});
  const listingInput = withListingDefaults(account, cleanListing(input.listing || {}));
  const validationResult = validate(account, listingInput);
  if (validationResult) return validationResult;

  const existing = await findExistingAccount(account.email, account.mobile);
  const now = new Date().toISOString();
  let user = existing;
  let createdAccount = false;
  let tempPassword = '';
  let emailResult: any = { status: 'not_sent_existing_account', provider: 'existing_account' };

  if (!user) {
    tempPassword = temporaryPassword();
    const hashed = hashAdminAssistedPassword(tempPassword);
    const newUser = {
      id: accountId(),
      createdAt: now,
      updatedAt: now,
      status: 'PENDING_PROFILE_CONFIRMATION',
      roleCategory: account.roleCategory,
      accountType: account.accountType,
      firmName: account.firmName,
      ownerName: account.fullName,
      businessRole: 'Admin-assisted manual listing creation',
      directorName: '',
      gstNumber: account.gstNumber,
      primaryMobile: account.mobile,
      alternateMobile: account.alternateMobile,
      email: account.email,
      state: account.state,
      city: account.city,
      area: '',
      pincode: '',
      fullAddress: account.address,
      liveLocation: '',
      locationPermission: false,
      tradingProducts: productInterest(listingInput),
      monthlyTradingVolume: '',
      monthlyTradingVolumeUnit: '',
      tradeScope: account.roleCategory === 'trader' ? 'Domestic' : '',
      annualTurnoverAmount: '',
      annualTurnoverUnit: '',
      tradingExperienceYears: '',
      buyerSellerMix: account.roleCategory === 'trader' ? 'Both buying and selling' : '',
      majorMarkets: [account.city, account.state].filter(Boolean).join(', '),
      importExportCode: '',
      paymentCycle: '',
      warehouseDetails: '',
      subscriptionRequired: account.roleCategory === 'trader',
      subscriptionPlan: account.roleCategory === 'trader' ? 'Trader dual-access approval / subscription review required' : 'Not required',
      shopImages: [],
      documents: `Admin-created account from manual listing flow. Product interest: ${productInterest(listingInput) || 'Not shared'}.`,
      createdFrom: 'manual-admin-listing',
      accountLock: account.accountType,
      adminCreated: true,
      onboardingSource: 'manual-admin-listing',
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
      temporaryPasswordIssuedAt: now,
      ...hashed,
    };

    const saved = await createUserRegistration(newUser);
    user = saved.user || saved.duplicate;
    createdAccount = Boolean(saved.user);
    if (!user) return { ok: false, status: 500, error: 'Unable to create or link the client account.' };
  }

  const owner = user;
  const listing = await createWorkspaceListing({
    ...listingInput,
    accountId: owner.id,
    ownerUserId: owner.id,
    ownerEmail: owner.email || account.email,
    ownerMobile: owner.primaryMobile || account.mobile,
    firmName: owner.firmName || account.firmName,
    contactPerson: owner.ownerName || account.fullName,
    listingVisibility: 'public',
  }, {
    owner,
    source: 'manual-admin-listing',
    createdByAdmin: true,
    approved: true,
    prefix: 'LIST-MAN',
  });

  if (user?.id) {
    emailResult = await sendClientListingNotification({
      user,
      listing,
      temporaryPassword: tempPassword || undefined,
      notificationType: 'client_account_listing_created',
    });
    await updateUserRegistrationRecord(user.id, {
      ...(createdAccount ? { credentialsSentAt: now } : {}),
      emailDeliveryStatus: emailResult.status,
      emailProvider: emailResult.provider,
      lastManualListingId: listing.id,
      updatedAt: now,
    });
  }

  const needsManualCopy = emailResult.status !== 'sent';

  return {
    ok: true,
    accountAction: createdAccount ? 'created' : 'linked_existing',
    account: safeAccount({ ...user, ...(createdAccount ? { mustChangePassword: true } : {}) }),
    listing,
    email: {
      status: emailResult.status,
      provider: emailResult.provider,
      data: emailResult.data,
      error: emailResult.error,
      tracking: emailResult.tracking,
    },
    missingInformation: emailResult.missingInformation || [],
    manualCopy: needsManualCopy ? {
      temporaryPassword: tempPassword,
      instructions: emailResult.text || emailText(user, listing, tempPassword),
      emailPreviewHtml: emailResult.html,
    } : undefined,
  };
}
