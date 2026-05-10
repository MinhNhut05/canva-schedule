import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { connectCanvaWithAuthorizationCode } from "@/lib/canva/oauth";

import { getCanvaOAuthSession } from "../actions";

const CANVA_OAUTH_STATE_COOKIE = "canva_oauth_state";
const CANVA_OAUTH_VERIFIER_COOKIE = "canva_oauth_verifier";
const CANVA_OAUTH_REDIRECT_URI_COOKIE = "canva_oauth_redirect_uri";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const error = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get("error_description");

  if (error) {
    return clearCookiesAndRedirect(
      request,
      `/admin/canva?error=${encodeURIComponent(errorDescription ?? error)}`,
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return clearCookiesAndRedirect(
      request,
      "/admin/canva?error=Canva callback thiếu authorization code hoặc state.",
    );
  }

  const oauthSession = await getCanvaOAuthSession();

  if (!oauthSession.state || !oauthSession.verifier || oauthSession.state !== state) {
    return clearCookiesAndRedirect(
      request,
      "/admin/canva?error=Canva OAuth state không hợp lệ. Vui lòng thử kết nối lại.",
    );
  }

  try {
    await connectCanvaWithAuthorizationCode({
      code,
      codeVerifier: oauthSession.verifier,
      redirectUri: oauthSession.redirectUri,
    });
  } catch (exchangeError) {
    const message = exchangeError instanceof Error ? exchangeError.message : "Không thể đổi authorization code lấy token.";
    return clearCookiesAndRedirect(
      request,
      `/admin/canva?error=${encodeURIComponent(message)}`,
    );
  }

  return clearCookiesAndRedirect(request, "/admin/canva?connected=1");
}

function clearCookiesAndRedirect(request: NextRequest, path: string) {
  const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  const response = NextResponse.redirect(new URL(path, baseUrl));

  response.cookies.delete(CANVA_OAUTH_STATE_COOKIE);
  response.cookies.delete(CANVA_OAUTH_VERIFIER_COOKIE);
  response.cookies.delete(CANVA_OAUTH_REDIRECT_URI_COOKIE);

  return response;
}
