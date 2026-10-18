import { mailpitURL } from './env.js';

type MailpitMessageSummary = {
  ID: string;
  To: Array<{ Address: string }>;
  Subject: string;
};

type MailpitMessage = {
  ID: string;
  Text: string;
  HTML: string;
};

/**
 * Poll Mailpit until a message for `email` matching `subject` appears, then
 * return the first http(s) URL in the body.
 */
export async function waitForEmailLink(options: {
  email: string;
  subject: RegExp;
  timeoutMs?: number;
}): Promise<string> {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const list = (await (
      await fetch(`${mailpitURL}/api/v1/messages`)
    ).json()) as { messages: MailpitMessageSummary[] };

    const match = list.messages?.find(
      (message) =>
        message.To?.some((to) => to.Address === options.email) &&
        options.subject.test(message.Subject)
    );

    if (match) {
      const full = (await (
        await fetch(`${mailpitURL}/api/v1/message/${match.ID}`)
      ).json()) as MailpitMessage;
      const body = `${full.Text}\n${full.HTML}`;
      const url = body.match(/https?:\/\/[^\s"'<>]+/i)?.[0];
      if (url) {
        return url.replace(/&amp;/g, '&');
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(
    `No email for ${options.email} matching ${options.subject} in Mailpit within ${timeoutMs}ms`
  );
}
