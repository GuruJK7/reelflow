import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// El webhook necesita el body crudo para verificar la firma.
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Falta firma/secret" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.user_id;
        const plan = s.metadata?.plan;
        if (!userId || !plan) {
          console.error(`[webhook] ${event.type} sin user_id/plan (${event.id})`);
          break;
        }
        const { error } = await admin.from("reelflow_subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: typeof s.customer === "string" ? s.customer : null,
          stripe_subscription_id:
            typeof s.subscription === "string" ? s.subscription : null,
          plan,
          status: "active",
        });
        if (error) {
          console.error(`[webhook] upsert falló: ${error.message}`);
          return NextResponse.json({ error: "db" }, { status: 500 });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) {
          console.error(`[webhook] ${event.type} sin user_id (${event.id})`);
          break;
        }
        const status =
          event.type === "customer.subscription.deleted"
            ? "canceled"
            : mapStatus(sub.status);
        const plan = sub.metadata?.plan;
        const { error } = await admin.from("reelflow_subscriptions").upsert({
          user_id: userId,
          ...(plan ? { plan } : {}),
          status,
          stripe_customer_id:
            typeof sub.customer === "string" ? sub.customer : null,
          stripe_subscription_id: sub.id,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
        });
        if (error) {
          console.error(`[webhook] upsert falló: ${error.message}`);
          return NextResponse.json({ error: "db" }, { status: 500 });
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(
      `[webhook] handler error: ${err instanceof Error ? err.message : String(err)}`,
    );
    return NextResponse.json({ error: "handler" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function mapStatus(s: string): string {
  if (["active", "trialing", "past_due", "canceled", "incomplete"].includes(s)) {
    return s;
  }
  if (s === "unpaid") return "past_due";
  return "canceled";
}
