
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-up(.*)",
  "/subscribe(.*)",
  "/api/webhook(.*)",
  "/api/check-subscription(.*)",
]);

const isSignUpRoute = createRouteMatcher([
  "/sign-up(.*)",
]);

const isMealPlanRoute = createRouteMatcher([
  "/mealplan(.*)",
]);

export default clerkMiddleware(
  async (auth, req) => {
    const authData = await auth();
    const { userId } = authData;
    const { pathname, origin } = req.nextUrl;
    console.log("Middleware Info: ", userId, pathname, origin);

    if (pathname === "/api/check-subscription") {
      return NextResponse.next();
    }

    if (!isPublicRoute(req) && !userId) {
      return NextResponse.redirect(new URL("/sign-up", origin));
    }

    if (isSignUpRoute(req) && userId) {
      return NextResponse.redirect(new URL("/mealplan", origin));
    }

    if (isMealPlanRoute(req) && userId) {
      try {
        const response = await fetch(`${origin}/api/check-subscription?userId=${userId}`);
        const data = await response.json();

        if (!data.subscriptionActive) {
          return NextResponse.redirect(new URL("/subscribe", origin));
        }
      } catch (error) {
        return NextResponse.redirect(new URL("/subscribe", origin));
      }
    }

    return NextResponse.next();
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and static files except those with specific extensions
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Run for API routes under /api and /trpc
    '/(api|trpc)(.*)',
  ],
};


