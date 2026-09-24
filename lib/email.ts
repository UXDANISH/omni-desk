import 'server-only';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Outgoing email. No provider is connected yet, so messages are written to the server log.
 * Swap the body of this function for your provider (Postmark, SES, Resend…) when wiring integrations.
 */
export async function sendEmail(msg: EmailMessage): Promise<void> {
  console.info(`\n[email] to=${msg.to}\n[email] subject=${msg.subject}\n${msg.text}\n`);
}

/** True when no real email provider is configured, so the UI can hand links over directly. */
export const emailIsStub = true;
