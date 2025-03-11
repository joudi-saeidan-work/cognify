import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Make both versions of the API route public
  "/api/getSpeech",
  "/api/getSpeech/(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId, orgId } = await auth();

  // Check if it's the speech API and always let it through
  if (request.nextUrl.pathname.startsWith("/api/getSpeech")) {
    return NextResponse.next();
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  if (userId && isPublicRoute(request)) {
    const path = "/select-org";

    if (orgId) {
      const path = `/organization/${orgId}`;
    }

    const orgSelection = new URL(path, request.url);
    return NextResponse.redirect(orgSelection);
  }

  if (!userId && !isPublicRoute(request)) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", request.url);
    return NextResponse.redirect(signInUrl);
  }

  if (userId && !orgId && request.nextUrl.pathname !== "/select-org") {
    const orgSelection = new URL("/select-org", request.url);
    return NextResponse.redirect(orgSelection);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
