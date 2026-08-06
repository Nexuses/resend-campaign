export const AUTH_COOKIE = "blast_session";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

async function hmacHex(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createSessionToken() {
  const secret = getSessionSecret();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `ok:${expiresAt}`;
  const signature = await hmacHex(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;

  try {
    const secret = getSessionSecret();
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return false;

    const expected = await hmacHex(payload, secret);
    if (!timingSafeEqual(signature, expected)) return false;

    const [, expiresAt] = payload.split(":");
    return Number(expiresAt) > Date.now();
  } catch {
    return false;
  }
}
