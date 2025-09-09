"use server";

import { cookies } from "next/headers";
import axios from "axios";

export async function getValueFromCookie(key: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(key)?.value;
}

export async function setValueToCookie(
  key: string,
  value: string,
  options: { path?: string; maxAge?: number } = {},
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(key, value, {
    path: options.path ?? "/",
    maxAge: options.maxAge ?? 60 * 60 * 24 * 7, // default: 7 days
  });
}

export async function getPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): Promise<T> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(key);
  const value = cookie ? cookie.value.trim() : undefined;
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export async function loginAndSetToken(baseUrl: string, username: string, password: string): Promise<string> {
  const res = await axios.post(`${baseUrl}/auth/login`, { username, password }, { headers: { "Content-Type": "application/json" } });
  const token = res.data?.access_token as string;
  if (!token) throw new Error("Token not found");
  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, { path: "/", maxAge: 60 * 60 * 12 });
  return token;
}
