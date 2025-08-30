

export interface Plan {
  name: string;
  amount: number;
  currency: string;
  interval: string;
  priceId: string;
  isPopular?: boolean;
  description: string;
  features: string[];
}

export const availablePlans: Plan[] = [
  {
    name: "Weekly Plan",
    amount: 9.99,
    currency: "USD",
    interval: "week",
    priceId: process.env.STRIPE_PRICE_WEEKLY!,
    description: "Great if you want to try the service before committing longer.",
    features: [
      "Unlimited AI meal plans",
      "AI nutrition insights",
      "Cancel anytime",
    ],
  },
  {
    name: "Monthly Plan",
    amount: 39.99,
    currency: "USD",
    interval: "month",
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    isPopular: true,
    description: "Perfect for ongoing, month-to-month meal planning and features.",
    features: [
      "Unlimited AI meal plans",
      "Priority AI support",
      "Cancel anytime",
    ],
  },
  {
    name: "Yearly Plan",
    amount: 299.99,
    currency: "USD",
    interval: "year",
    priceId: process.env.STRIPE_PRICE_YEARLY!,
    description: "Best value for those committed to improving their diet long-term.",
    features: [
      "Unlimited AI meal plans",
      "All premium features",
      "Cancel anytime",
    ],
  },
];

/**
 * Get Stripe Price ID from the plan type
 */
export function getPriceIdFromType(planType: string): string | null {
  const plan = availablePlans.find(p => p.interval === planType);
  return plan ? plan.priceId : null;
}


