import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkRateLimit } from "@/lib/ratelimit";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Rate limiting on API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Extract user ID from cookie/auth header for rate limit key
    const cookie = request.cookies.get("sb-auth-token")?.value;
    const key = cookie || request.ip || "anonymous";
    const { success, remaining } = await checkRateLimit(`${key}:${request.nextUrl.pathname}`);

    if (!success) {
      return NextResponse.json({ error: "rate limited" }, { status: 429, headers: { "retry-after": "60" } });
    }

    // Add remaining quota to response headers (informational)
    response.headers.set("x-ratelimit-remaining", String(remaining));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
