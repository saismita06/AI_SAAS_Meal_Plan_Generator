
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const endpointSecret =process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  console.log("📩 Webhook hit");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    console.log("✅ Stripe event:", event.type);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("❌ Webhook signature verification failed:", errorMsg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.clerkUserId;
        if (!userId) {
          console.warn("⚠️ No clerkUserId found in session metadata");
          break;
        }
        const planType = session.metadata?.planType || "basic";
        const customerEmail = session.customer_email || "";
        const stripeSubId =
          typeof session.subscription === "string" ? session.subscription : null;

        await prisma.profile.upsert({
          where: { userId },
          update: {
            email: customerEmail,
            subscriptionActive: true,
            subscriptionTier: planType,
            stripeSubscriptionId: stripeSubId,
          },
          create: {
            userId,
            email: customerEmail,
            subscriptionActive: true,
            subscriptionTier: planType,
            stripeSubscriptionId: stripeSubId,
          },
        });

        const updated = await prisma.profile.findUnique({ where: { userId } });
        console.log("Post-update subscriptionActive (checkout):", updated?.subscriptionActive);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
        const subscriptionId = invoice.subscription;

        if (!subscriptionId) {
          console.warn("⚠️ Invoice subscription ID is missing");
          break;
        }
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.clerkUserId;
        if (!userId) {
          console.warn("⚠️ No clerkUserId found in subscription metadata (invoice.paid)");
          break;
        }

        await prisma.profile.updateMany({
          where: { userId },
          data: { subscriptionActive: true },
        });

        const updated = await prisma.profile.findUnique({ where: { userId } });
        console.log("Post-update subscriptionActive (invoice.paid):", updated?.subscriptionActive);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.clerkUserId;
        if (!userId) {
          console.warn("⚠️ No clerkUserId found in subscription metadata (subscription.updated)");
          break;
        }

        const isActive = subscription.status === "active" || subscription.status === "trialing";

        await prisma.profile.updateMany({
          where: { userId },
          data: { subscriptionActive: isActive },
        });

        const updated = await prisma.profile.findUnique({ where: { userId } });
        console.log("Post-update subscriptionActive (sub.updated):", updated?.subscriptionActive);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.clerkUserId;
        if (!userId) {
          console.warn("⚠️ No clerkUserId found in subscription metadata (subscription.deleted)");
          break;
        }

        await prisma.profile.updateMany({
          where: { userId },
          data: { subscriptionActive: false },
        });

        const updated = await prisma.profile.findUnique({ where: { userId } });
        console.log("Post-update subscriptionActive (sub.deleted):", updated?.subscriptionActive);
        break;
      }

      default: {
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
        break;
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("❌ Error handling webhook event:", errorMsg);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
