import { Resend } from "resend";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export type SendEmailResult = {
  id: string;
};

function getFrom(): string {
  return (
    process.env.NEWSLETTER_FROM?.trim() ||
    "HappenMCR <onboarding@resend.dev>"
  );
}

export function isNewsletterSendingConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: getFrom(),
    to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
    headers: input.headers,
  });

  if (error) {
    const detail =
      typeof error === "object" && error && "message" in error
        ? String((error as { message?: string }).message)
        : "Resend send failed";
    throw new Error(detail);
  }

  const id = data?.id;
  if (!id) {
    throw new Error("Resend accepted the request but returned no email id");
  }

  return { id };
}
