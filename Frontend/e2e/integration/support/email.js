import fs from 'node:fs'
import path from 'node:path'
import { MAIL_DIR } from './paths.js'

function mailFiles() {
  if (!fs.existsSync(MAIL_DIR)) return []
  return fs
    .readdirSync(MAIL_DIR)
    .filter((f) => f.endsWith('.log'))
    .sort()
}

function decodeQuotedPrintable(input) {
  return input
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
}

// Decodes a raw MIME message body, honouring Content-Transfer-Encoding.
// The OTP email body contains an emoji, so Django encodes it as base64.
function decodeBody(raw) {
  const normalized = raw.replace(/\r\n/g, '\n')
  const sep = normalized.indexOf('\n\n')
  const headers = sep === -1 ? normalized : normalized.slice(0, sep)
  let body = sep === -1 ? '' : normalized.slice(sep + 2)

  // Drop the trailing MIME boundary and the file separator.
  body = body.split(/\n--/)[0]

  const encMatch = headers.match(/content-transfer-encoding:\s*(\S+)/i)
  const encoding = encMatch ? encMatch[1].toLowerCase() : '7bit'

  if (encoding === 'base64') {
    const cleaned = body.replace(/[^A-Za-z0-9+/=]/g, '')
    return Buffer.from(cleaned, 'base64').toString('utf8')
  }
  if (encoding === 'quoted-printable') {
    return Buffer.from(decodeQuotedPrintable(body), 'binary').toString('utf8')
  }
  return body
}

// Returns the most recent email message (newest file first) that matches the
// optional predicate, or null. Files are named by timestamp, so lexical
// ascending order is chronological.
export function readLatestEmail(predicate = () => true) {
  const files = mailFiles().reverse()
  for (const file of files) {
    const raw = fs.readFileSync(path.join(MAIL_DIR, file), 'latin1')
    const decoded = decodeBody(raw)
    const toMatch = raw.match(/^To:\s*(.*)$/im)
    const to = toMatch ? toMatch[1].trim() : ''
    if (predicate({ raw, decoded, to, file })) {
      return { raw, decoded, to, file }
    }
  }
  return null
}

// Extracts the { uid, token } pair from the password-reset link in the most
// recent captured email for `email`. Delivery is asynchronous, so it polls
// within a bounded window. The returned values are never logged.
export async function readResetLinkFor(email, { timeout = 20_000 } = {}) {
  const target = email.toLowerCase()
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const message = readLatestEmail(
      ({ to, decoded }) =>
        to.toLowerCase().includes(target) &&
        /password-reset-confirm/i.test(decoded)
    )
    if (message) {
      const match = message.decoded.match(
        /\/password-reset-confirm\/([A-Za-z0-9_=-]+)\/([A-Za-z0-9_=-]+)\/?/
      )
      if (match) {
        return { uid: match[1], token: match[2] }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Timed out waiting for a password-reset email for ${email}`)
}

// Reads the 6-digit OTP sent to `email` from the file-based email backend.
export function readOtpFor(email) {
  const target = email.toLowerCase()
  const message = readLatestEmail(({ to }) => to.toLowerCase().includes(target))
  if (!message) {
    throw new Error(`No OTP email found for ${email} in ${MAIL_DIR}`)
  }
  const match =
    message.decoded.match(/OTP Code:\s*(\d{6})/i) ||
    message.decoded.match(/\b(\d{6})\b/)
  if (!match) {
    throw new Error(
      `Could not parse an OTP from the email for ${email}. Body:\n${message.decoded}`
    )
  }
  return match[1]
}
