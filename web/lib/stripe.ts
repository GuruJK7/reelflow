import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Cliente Stripe lazy: se instancia recién al usarse (no en import-time),
 * para no romper el build cuando STRIPE_SECRET_KEY no está presente.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY no configurada");
    _stripe = new Stripe(key);
  }
  return _stripe;
}
