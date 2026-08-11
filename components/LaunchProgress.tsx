import { LAUNCH_THRESHOLD } from "@/lib/platformConfig";

export default function LaunchProgress({ verifiedCount }: { verifiedCount: number }) {
  const pct = Math.min(100, Math.round((verifiedCount / LAUNCH_THRESHOLD) * 100));

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-5 py-4">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium text-brand-green">
          {verifiedCount} of {LAUNCH_THRESHOLD} hotels joined
        </span>
        <span className="text-neutral-500">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
        <div className="h-full bg-brand-gold" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-neutral-500 mt-2">
        The exchange unlocks once {LAUNCH_THRESHOLD} hotels have verified. Join now to be counted.
      </p>
    </div>
  );
}
