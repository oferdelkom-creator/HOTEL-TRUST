import Link from "next/link";
import LaunchProgress from "./LaunchProgress";

export default function LockedUntilLaunch({
  verifiedCount,
  what,
}: {
  verifiedCount: number;
  what: string;
}) {
  return (
    <div className="max-w-lg mx-auto text-center py-8">
      <p className="text-neutral-600 mb-6">
        {what} unlocks once the network reaches critical mass. Your hotel can still register,
        get verified, and list nights in the meantime - everything will be ready the moment it
        opens.
      </p>
      <LaunchProgress verifiedCount={verifiedCount} />
      <Link href="/owner" className="inline-block mt-6 rounded-md bg-brand-green text-brand-gold px-5 py-2.5">
        Go to your dashboard
      </Link>
    </div>
  );
}
