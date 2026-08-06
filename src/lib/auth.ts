import { cookies } from "next/headers";
import {
  AUTH_COOKIE,
  createSessionToken,
  verifySessionToken,
} from "@/lib/session";

export { AUTH_COOKIE, createSessionToken, verifySessionToken };

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function verifyPassword(input: string): boolean {
  const password = process.env.APP_PASSWORD;
  if (!password) throw new Error("APP_PASSWORD is not set");
  return timingSafeEqual(input, password);
}

export async function isAuthenticated() {
  const jar = await cookies();
  return verifySessionToken(jar.get(AUTH_COOKIE)?.value);
}
