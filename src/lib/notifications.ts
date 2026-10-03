type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

export function emailIsConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from || !/^\S+@\S+\.\S+$/.test(payload.to)) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [payload.to], subject: payload.subject, text: payload.text, reply_to: payload.replyTo }),
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!response.ok) console.error("Email provider returned", response.status);
    return response.ok;
  } catch (error) {
    console.error("Email delivery failed", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
}
