import { LAUNCH_THRESHOLD } from "@/lib/platformConfig";

const FOUNDING_BENEFITS = [
  "3-month complimentary trial",
  "Founding Member status",
  "Priority verification",
  "Preferred founding-member pricing when annual membership launches",
];

/**
 * Framed as progress toward the network launch, not as a headcount of who is
 * missing - an early-stage counter reading "0 of 500 joined" reads as a dead
 * network to a hotel owner seeing the site for the first time. The bar keeps a
 * visible sliver at low percentages so it reads as a track being filled; the
 * true percentage is still what's exposed to assistive tech.
 */
export default function LaunchProgress({
  verifiedCount,
  showBenefits = true,
}: {
  verifiedCount: number;
  showBenefits?: boolean;
}) {
  const pct = Math.min(100, Math.round((verifiedCount / LAUNCH_THRESHOLD) * 100));
  const spotsLeft = Math.max(0, LAUNCH_THRESHOLD - verifiedCount);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-5 py-5 text-left">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold mb-1">
        Founding Member Access
      </p>
      <p className="font-medium text-brand-green mb-3">
        Join the first {LAUNCH_THRESHOLD} verified hotels shaping the Hotel Trust network.
      </p>

      {showBenefits && (
        <ul className="text-sm text-neutral-600 space-y-1.5 mb-5">
          {FOUNDING_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex gap-2">
              <span aria-hidden="true" className="text-brand-gold">
                ✓
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium text-brand-green">Progress to network launch</span>
        <span className="text-neutral-500">{pct}%</span>
      </div>
      <div
        className="h-2 rounded-full bg-neutral-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress to network launch"
      >
        <div className="h-full bg-brand-gold" style={{ width: `${Math.max(pct, 3)}%` }} />
      </div>
      <p className="text-xs text-neutral-500 mt-2">
        {spotsLeft > 0
          ? `${spotsLeft} of ${LAUNCH_THRESHOLD} founding-member places are still open. The exchange opens as the founding group completes.`
          : `The founding group of ${LAUNCH_THRESHOLD} hotels is complete.`}
      </p>
    </div>
  );
}
