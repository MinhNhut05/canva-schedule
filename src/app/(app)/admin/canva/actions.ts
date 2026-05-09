"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { createCanvaAuthorizationUrl } from "@/lib/canva/oauth";

const CANVA_OAUTH_STATE_COOKIE = "canva_oauth_state";
const CANVA_OAUTH_VERIFIER_COOKIE = "canva_oauth_verifier";
const COOKIE_MAX_AGE_SECONDS = 10 * 60;

export async function startCanvaConnect() {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    throw new Error("Bạn không có quyền kết nối Canva.");
  }

  const redirectUri = await getCanvaRedirectUri();
  const { authorizeUrl, verifier, state } = createCanvaAuthorizationUrl(redirectUri);
  const cookieStore = await cookies();
  const secure = redirectUri.startsWith("https://");

  cookieStore.set(CANVA_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/admin/canva",
  });
  cookieStore.set(CANVA_OAUTH_VERIFIER_COOKIE, verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/admin/canva",
  });

  redirect(authorizeUrl);
}

export async function getCanvaOAuthSession() {
  const cookieStore = await cookies();

  return {
    state: cookieStore.get(CANVA_OAUTH_STATE_COOKIE)?.value ?? null,
    verifier: cookieStore.get(CANVA_OAUTH_VERIFIER_COOKIE)?.value ?? null,
    redirectUri: await getCanvaRedirectUri(),
  };
}

export async function clearCanvaOAuthSession() {
  const cookieStore = await cookies();

  cookieStore.delete(CANVA_OAUTH_STATE_COOKIE);
  cookieStore.delete(CANVA_OAUTH_VERIFIER_COOKIE);
}

async function getCanvaRedirectUri() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const referer = headerStore.get("referer");
  const fallbackHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const fallbackProto = headerStore.get("x-forwarded-proto") ?? "http";
  const baseUrl = origin ?? (referer ? new URL(referer).origin : null) ?? (fallbackHost ? `${fallbackProto}://${fallbackHost}` : null);

  if (!baseUrl) {
    throw new Error("Không xác định được host để tạo Canva callback URL.");
  }

  return `${baseUrl}/admin/canva/callback`;
}
