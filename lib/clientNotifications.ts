import { clientAccountListingCreatedEmail, clientFollowUpRequiredEmail } from '@/lib/clientEmailTemplates';
import { sendOrQueueEmail } from '@/lib/email';
import { getBusinessEmailFrom } from '@/lib/emailConfig';
import { detectMissingInformation } from '@/lib/missingInformation';
import { updateListing, updateUserRegistrationRecord } from '@/lib/proDb';
import { sanitizeMultiline, sanitizeString } from '@/lib/validation';

export type ClientNotificationType =
  | 'client_account_listing_created'
  | 'client_follow_up_required'
  | 'client_listing_reminder';

function publicError(result: any) {
  return sanitizeMultiline(JSON.stringify(result?.providerError || result?.data || result?.error || result?.reason || ''), 500);
}

function emailStatus(result: any): 'sent' | 'failed' | 'preview' {
  if (result?.status === 'sent') return 'sent';
  if (result?.status === 'preview') return 'preview';
  return 'failed';
}

export async function sendClientListingNotification({
  user,
  listing,
  temporaryPassword,
  notificationType = 'client_account_listing_created',
}: {
  user: any;
  listing: any;
  temporaryPassword?: string;
  notificationType?: ClientNotificationType;
}) {
  const missingItems = detectMissingInformation({ account: user, listing });
  const template = notificationType === 'client_account_listing_created'
    ? clientAccountListingCreatedEmail({ user, listing, temporaryPassword, missingItems })
    : clientFollowUpRequiredEmail({ user, listing, missingItems });

  const recipient = sanitizeString(user?.email || listing?.raw?.ownerEmail || listing?.ownerEmail, 254);
  const sentAt = new Date().toISOString();
  const emailResult = await sendOrQueueEmail({
    to: recipient,
    subject: template.subject,
    html: template.html,
    text: template.text,
    leadId: listing?.id || user?.id || `CLIENT-${Date.now()}`,
  });
  const status = emailStatus(emailResult);
  const sender = sanitizeString(emailResult.from || getBusinessEmailFrom(), 254);
  const provider = sanitizeString(emailResult.provider, 80);
  const error = status === 'failed' ? publicError(emailResult) : '';
  const tracking = {
    notificationType,
    emailStatus: status,
    emailRecipient: recipient,
    emailSender: sender,
    emailProvider: provider,
    lastEmailSentAt: status === 'sent' ? sentAt : '',
    lastSentAt: status === 'sent' ? sentAt : '',
    lastAttemptAt: sentAt,
    emailError: error,
    errorMessage: status === 'sent' ? '' : publicError(emailResult),
    missingInformation: missingItems,
    clientFollowUpRequired: missingItems.length > 0 || status !== 'sent',
  };

  try {
    if (user?.id) {
      await updateUserRegistrationRecord(user.id, {
        clientNotification: tracking,
        clientNotificationStatus: tracking.emailStatus,
        clientNotificationType: notificationType,
        clientNotificationRecipient: recipient,
        clientNotificationSender: sender,
        clientNotificationProvider: provider,
        clientNotificationLastAttemptAt: sentAt,
        clientNotificationLastEmailSentAt: tracking.lastEmailSentAt,
        clientNotificationLastSentAt: tracking.lastSentAt,
        clientNotificationEmailError: tracking.emailError,
        clientNotificationError: tracking.errorMessage,
      });
    }
    if (listing?.id) {
      const existingRaw = listing.raw && typeof listing.raw === 'object' ? listing.raw : {};
      await updateListing(listing.id, {
        raw: {
          ...existingRaw,
          clientNotification: tracking,
          clientNotificationStatus: tracking.emailStatus,
          clientNotificationType: notificationType,
          clientNotificationRecipient: recipient,
          clientNotificationSender: sender,
          clientNotificationProvider: provider,
          clientNotificationLastAttemptAt: sentAt,
          clientNotificationLastEmailSentAt: tracking.lastEmailSentAt,
          clientNotificationLastSentAt: tracking.lastSentAt,
          clientNotificationEmailError: tracking.emailError,
          clientNotificationError: tracking.errorMessage,
          missingInformation: missingItems,
          clientFollowUpRequired: tracking.clientFollowUpRequired,
        },
      });
    }
  } catch (error) {
    return {
      ...emailResult,
      tracking,
      missingInformation: missingItems,
      text: template.text,
      html: template.html,
      trackingError: error instanceof Error ? error.message : 'Unable to store notification status.',
    };
  }

  return { ...emailResult, tracking, missingInformation: missingItems, text: template.text, html: template.html };
}
