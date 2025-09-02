

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    // Get the currently signed-in user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user profile from your Prisma database
    const profile = await prisma.profile.findUnique({
      where: { userId: clerkUser.id },
      // Select both required properties!
      select: {
        subscriptionActive: true,    // boolean (e.g. true/false)
        subscriptionTier: true        // string (e.g. "week", "month", "year")
      }
    });

    // If profile is missing, respond as not subscribed
    if (!profile) {
      return NextResponse.json({
        subscription: {
          subscription_tier: null,
          subscription_active: false
        }
      });
    }

    // Respond with the exact data structure frontend expects!
    return NextResponse.json({
      subscription: {
        subscription_tier: profile.subscriptionTier || null,
        subscription_active: !!profile.subscriptionActive
      }
    });
  } 

  catch (error) {
  console.error("Error fetching subscription status:", error);
  return NextResponse.json(
    { error: "Failed to fetch subscription status." },
    { status: 500 }
  );
}

}
