
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    console.log("API check-subscription received userId:", userId);

    if (!userId) {
      console.error("check-subscription error: Missing userId");
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { subscriptionActive: true },
    });

    console.log("DB profile subscriptionActive:", profile?.subscriptionActive);

    if (!profile?.subscriptionActive) {
      return NextResponse.json({ subscriptionActive: false });
    }

    return NextResponse.json({ subscriptionActive: true });
  } catch (err: any) {
    console.error("check-subscription error:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
