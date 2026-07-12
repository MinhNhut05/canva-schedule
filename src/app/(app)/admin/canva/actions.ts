"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { createCanvaAuthorizationUrl } from "@/lib/canva/oauth";
import { getAppUrl } from "@/lib/env";

const CANVA_OAUTH_STATE_COOKIE = "canva_oauth_state";
const CANVA_OAUTH_VERIFIER_COOKIE = "canva_oauth_verifier";
const CANVA_OAUTH_REDIRECT_URI_COOKIE = "canva_oauth_redirect_uri";
const COOKIE_MAX_AGE_SECONDS = 10 * 60;

export async function startCanvaConnect() {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    throw new Error("Bạn không có quyền kết nối Canva.");
  }

  const redirectUri = getCanvaRedirectUri();
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
  cookieStore.set(CANVA_OAUTH_REDIRECT_URI_COOKIE, redirectUri, {
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
    redirectUri: cookieStore.get(CANVA_OAUTH_REDIRECT_URI_COOKIE)?.value ?? getCanvaRedirectUri(),
  };
}

export async function clearCanvaOAuthSession() {
  const cookieStore = await cookies();

  cookieStore.delete(CANVA_OAUTH_STATE_COOKIE);
  cookieStore.delete(CANVA_OAUTH_VERIFIER_COOKIE);
  cookieStore.delete(CANVA_OAUTH_REDIRECT_URI_COOKIE);
}

function getCanvaRedirectUri() {
  return new URL("/admin/canva/callback", getAppUrl()).toString();
}
