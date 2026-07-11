import type { MissingInformationItem } from '@/lib/missingInformation';

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

function row(label: string, value: unknown) {
  return `<tr><td style="border:1px solid #dbe4ee;padding:11px 12px;background:#f8fafc;font-weight:700;width:190px">${escapeHtml(label)}</td><td style="border:1px solid #dbe4ee;padding:11px 12px">${escapeHtml(value || '-')}</td></tr>`;
}

function missingHtml(items: MissingInformationItem[]) {
  if (!items.length) return '';
  return `
    <div style="margin-top:18px;border:1px solid #fed7aa;background:#fff7ed;border-radius:14px;padding:16px;color:#7c2d12">
      <b>Information still required</b>
      <ul style="margin:10px 0 0;padding-left:20px">
        ${items.map((item) => `<li><b>${escapeHtml(item.label)}:</b> ${escapeHtml(item.message)}</li>`).join('')}
      </ul>
    </div>`;
}

function shell(title: string, body: string) {
  return `
  <div style="margin:0;padding:24px;background:#f5f8fb;font-family:Arial,sans-serif;color:#0f172a;line-height:1.55">
    <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #dbe4ee;border-radius:18px;overflow:hidden">
      <div style="padding:22px 24px;background:linear-gradient(135deg,#07111f,#0f766e);color:#fff">
        <div style="font-size:13px;font-weight:700;color:#ccfbf1">Talmech Trading</div>
        <h1 style="font-size:24px;line-height:1.2;margin:8px 0 0">${escapeHtml(title)}</h1>
      </div>
      <div style="padding:24px">${body}</div>
    </div>
  </div>`;
}

export function clientAccountListingCreatedEmail({
  user,
  listing,
  temporaryPassword,
  missingItems,
}: {
  user: any;
  listing: any;
  temporaryPassword?: string;
  missingItems: MissingInformationItem[];
}) {
  const loginUrl = `${appBaseUrl()}/signin`;
  const dashboardUrl = `${appBaseUrl()}/account`;
  const recipientName = user?.ownerName || user?.firmName || 'there';
  const credentialRows = [
    row('Client name', user?.ownerName),
    row('Firm name', user?.firmName),
    row('Account ID / User ID', user?.id),
    row('Dashboard URL', dashboardUrl),
    row('Login URL', loginUrl),
    row('Username', user?.email || user?.primaryMobile || user?.id),
    row('Temporary password', temporaryPassword || 'Use your existing password or ask Talmech admin for a reset.'),
    row('Listing ID', listing?.id),
    row('Listing summary', [listing?.metal, listing?.product, listing?.grade, listing?.productForm || listing?.raw?.productForm].filter(Boolean).join(' / ')),
    row('Quantity', [listing?.quantity, listing?.unit || listing?.raw?.quantityUnit].filter(Boolean).join(' ')),
    row('Price', listing?.targetPrice || listing?.priceType || listing?.raw?.price || 'Price on request'),
    row('Dispatch location', listing?.pickupAddress || listing?.raw?.dispatchLocation),
    row('Delivery location', listing?.deliveryLocation || listing?.raw?.deliveryLocation),
  ].join('');

  const html = shell('Your Talmech workspace and listing are ready', `
    <p>Hello ${escapeHtml(recipientName)},</p>
    <p>Talmech admin created this workspace to help publish and manage your marketplace listing. Please sign in, review your details, and change the temporary password after first login.</p>
    <table style="border-collapse:collapse;width:100%;margin-top:16px">${credentialRows}</table>
    <p style="margin:18px 0"><a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;border-radius:999px;padding:12px 18px;font-weight:700">Open your dashboard</a></p>
    <p>Please reply to this email or WhatsApp Talmech with 3 clear product pictures, stock proof, and any missing information listed below.</p>
    ${missingHtml(missingItems)}
    <p style="margin-top:20px"><b>Next steps</b><br/>1. Open your dashboard.<br/>2. Change your password.<br/>3. Confirm product, price, GST, dispatch, and certificate details.<br/>4. Share product photos if still pending.</p>
    <p style="margin-top:20px">Regards,<br/><b>Raghavendra Tiwari</b><br/>Talmech Trading<br/>Support: +91 7389642874</p>
  `);

  const text = [
    'Your Talmech workspace and listing are ready.',
    `Hello ${recipientName},`,
    `Client name: ${user?.ownerName || '-'}`,
    `Firm name: ${user?.firmName || '-'}`,
    `Account ID/User ID: ${user?.id || '-'}`,
    `Dashboard: ${dashboardUrl}`,
    `Login: ${loginUrl}`,
    `Username: ${user?.email || user?.primaryMobile || user?.id || '-'}`,
    `Temporary password: ${temporaryPassword || 'Use your existing password or ask Talmech admin for a reset.'}`,
    `Listing ID: ${listing?.id || '-'}`,
    `Listing: ${[listing?.metal, listing?.product, listing?.grade, listing?.productForm || listing?.raw?.productForm].filter(Boolean).join(' / ') || '-'}`,
    `Quantity: ${[listing?.quantity, listing?.unit || listing?.raw?.quantityUnit].filter(Boolean).join(' ') || '-'}`,
    `Price: ${listing?.targetPrice || listing?.priceType || listing?.raw?.price || 'Price on request'}`,
    `Dispatch location: ${listing?.pickupAddress || listing?.raw?.dispatchLocation || '-'}`,
    `Delivery location: ${listing?.deliveryLocation || listing?.raw?.deliveryLocation || '-'}`,
    'Change your password after first login.',
    missingItems.length ? 'Information still required:' : '',
    ...missingItems.map((item) => `- ${item.label}: ${item.message}`),
    'Please share 3 clear product pictures if not already shared.',
    'Regards,',
    'Raghavendra Tiwari',
    'Talmech Trading | Support: +91 7389642874',
  ].filter(Boolean).join('\n');

  return { subject: 'Your Talmech Trading workspace and listing are ready', html, text };
}

export function clientFollowUpRequiredEmail({ user, listing, missingItems }: { user: any; listing: any; missingItems: MissingInformationItem[] }) {
  const dashboardUrl = `${appBaseUrl()}/account`;
  const html = shell('Talmech listing follow-up required', `
    <p>Hello ${escapeHtml(user?.ownerName || user?.firmName || 'there')},</p>
    <p>Your listing ${escapeHtml(listing?.id || '')} needs a few details before Talmech can complete verification and buyer outreach.</p>
    ${missingHtml(missingItems)}
    <p style="margin:18px 0"><a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;border-radius:999px;padding:12px 18px;font-weight:700">Open your dashboard</a></p>
    <p>Please share 3 clear product pictures if they are still pending.</p>
    <p>Regards,<br/><b>Raghavendra Tiwari</b><br/>Talmech Trading<br/>Support: +91 7389642874</p>
  `);
  const text = [
    'Talmech listing follow-up required.',
    `Listing ID: ${listing?.id || '-'}`,
    ...missingItems.map((item) => `- ${item.label}: ${item.message}`),
    `Dashboard: ${dashboardUrl}`,
    'Please share 3 clear product pictures if they are still pending.',
    'Raghavendra Tiwari | Talmech Trading | Support: +91 7389642874',
  ].join('\n');
  return { subject: 'Talmech listing follow-up required', html, text };
}
