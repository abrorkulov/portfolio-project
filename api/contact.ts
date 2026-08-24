/**
 * Contact form → Telegram.
 *
 * The form used to hand the message to the visitor's own mail client, which
 * meant most of them never sent it. This forwards it to a Telegram bot
 * instead, and the bot passes it on to Jahongir's chat.
 *
 * **The bot token must never reach the browser.** That is the whole reason
 * this file exists rather than the form calling api.telegram.org directly:
 * anything shipped in the client bundle is public, and a leaked bot token
 * lets anyone send messages as the bot or read everything it receives. The
 * token lives in a Vercel environment variable and is only ever read here.
 *
 * Set two environment variables in the Vercel project (both "Encrypted"):
 *
 *   TELEGRAM_BOT_TOKEN   from @BotFather, after /newbot
 *   TELEGRAM_CHAT_ID     the numeric id of the chat to deliver to
 *
 * A bot cannot open a conversation with a person, and it cannot address one
 * by @username — so send your own bot a /start first, then read your numeric
 * id from https://api.telegram.org/bot<TOKEN>/getUpdates (or from @userinfobot).
 * A channel works too, as `@channelname`.
 *
 * With either variable missing the endpoint answers 503 and the form falls
 * back to opening a mail client, so the site never silently swallows a
 * message.
 */

// Vercel's edge runtime exposes `process.env`; the `api` directory is outside
// `tsconfig.json`'s `include`, so this declaration is what types it.
declare const process: { env: Record<string, string | undefined> }

export const config = { runtime: 'edge' }

const LIMITS = { name: 80, email: 120, message: 4000 }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Telegram parses `parse_mode: HTML`, so visitor text has to be inert. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    return json({ error: 'not_configured' }, 503)
  }

  let payload: {
    name?: unknown
    email?: unknown
    message?: unknown
    company?: unknown
  }
  try {
    payload = await request.json()
  } catch {
    return json({ error: 'bad_request' }, 400)
  }

  // Honeypot. No human ever sees this field, so anything in it came from a
  // bot — answer 200 so it believes it succeeded and moves on rather than
  // retrying with variations.
  if (typeof payload.company === 'string' && payload.company.length > 0) {
    return json({ ok: true }, 200)
  }

  const read = (value: unknown, max: number) =>
    typeof value === 'string' ? value.trim().slice(0, max) : ''

  const name = read(payload.name, LIMITS.name)
  const email = read(payload.email, LIMITS.email)
  const message = read(payload.message, LIMITS.message)

  if (!name || !email || !message) {
    return json({ error: 'missing_fields' }, 400)
  }
  if (!EMAIL.test(email)) {
    return json({ error: 'invalid_email' }, 400)
  }

  const text =
    '<b>New message from abrorkulov.uz</b>\n\n' +
    `<b>From:</b> ${escapeHtml(name)}\n` +
    `<b>Email:</b> ${escapeHtml(email)}\n\n` +
    escapeHtml(message)

  let delivered: Response
  try {
    delivered = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
  } catch {
    return json({ error: 'upstream_unreachable' }, 502)
  }

  if (!delivered.ok) {
    // Telegram's error bodies can echo the request URL, which contains the
    // token, so nothing from the response is ever forwarded to the browser.
    return json({ error: 'delivery_failed' }, 502)
  }

  return json({ ok: true }, 200)
}
