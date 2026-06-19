import { checkQuota } from "@/lib/quota";
import { PLANS } from "@/lib/plans";
import { BillingActions } from "./BillingActions";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const { plan, used, quota } = await checkQuota();
  const current = PLANS[plan];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Plan y facturación</h1>

      <div className="rounded-xl border border-reelflow-border bg-reelflow-surface/60 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-reelflow-muted">Plan actual</p>
            <p className="text-xl font-semibold text-reelflow-accent">
              {current.name} · {current.priceLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-reelflow-muted">Uso este mes</p>
            <p className="text-xl font-semibold">
              {used} / {quota} Reels
            </p>
          </div>
        </div>
        <div className="mt-6">
          <BillingActions currentPlan={plan} />
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Object.values(PLANS).map((p) => (
          <div
            key={p.id}
            className={`rounded-xl border p-5 ${
              p.id === plan ? "border-reelflow-accent" : "border-reelflow-border"
            }`}
          >
            <h3 className="font-semibold">{p.name}</h3>
            <p className="mt-1 text-reelflow-accent">{p.priceLabel}</p>
            <p className="mt-2 text-sm text-reelflow-muted">
              {p.monthlyQuota} Reels por mes
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
