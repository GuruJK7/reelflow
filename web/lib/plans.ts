export type PlanId = "free" | "starter" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  monthlyQuota: number; // Reels por mes
  priceLabel: string;
  priceEnv?: string; // nombre de la env con el price_id de Stripe
}

export const PLANS: Record<PlanId, Plan> = {
  free: { id: "free", name: "Free", monthlyQuota: 2, priceLabel: "US$0" },
  starter: {
    id: "starter",
    name: "Starter",
    monthlyQuota: 30,
    priceLabel: "US$19/mes",
    priceEnv: "STRIPE_PRICE_STARTER",
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyQuota: 120,
    priceLabel: "US$49/mes",
    priceEnv: "STRIPE_PRICE_PRO",
  },
};
