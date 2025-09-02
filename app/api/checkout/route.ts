


  import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getPriceIdFromType } from "@/lib/plans";

export async function POST(request: NextRequest) {
  try {
    const { planType, userId, email } = await request.json();

    if (!planType || !userId || !email) {
      return NextResponse.json(
        { error: "Plan type, User ID, and Email are required." },
        { status: 400 }
      );
    }

    const allowedPlanTypes = ["week", "month", "year"];
    if (!allowedPlanTypes.includes(planType)) {
      return NextResponse.json(
        { error: "Invalid plan type." },
        { status: 400 }
      );
    }

    const priceId = getPriceIdFromType(planType);
    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID for the selected plan not found." },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_BASE_URL environment variable." },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      mode: "subscription",
      metadata: { clerkUserId: userId, planType },
      subscription_data: {
        metadata: { clerkUserId: userId, planType },
      },
      success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscribe`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

