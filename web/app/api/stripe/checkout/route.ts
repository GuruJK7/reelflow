import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/plans";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { plan?: string } | null;
  const planId = (body?.plan as PlanId) ?? "starter";
  const plan = PLANS[planId];
  if (!plan?.priceEnv) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }
  const priceId = process.env[plan.priceEnv];
  if (!priceId) {
    return NextResponse.json({ error: "Precio no configurado" }, { status: 500 });
  }

  const stripe = getStripe();
  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("reelflow_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  let customerId = sub?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("reelflow_subscriptions")
      .upsert({ user_id: user.id, stripe_customer_id: customerId, plan: "free", status: "active" });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?ok=1`,
    cancel_url: `${appUrl}/billing?canceled=1`,
    metadata: { user_id: user.id, plan: planId },
    subscription_data: { metadata: { user_id: user.id, plan: planId } },
  });

  return NextResponse.json({ url: session.url });
}
