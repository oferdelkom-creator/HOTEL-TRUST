import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-sm font-medium text-neutral-500 mb-3">Currently in trial</p>
        <h1 className="text-4xl font-semibold tracking-tight mb-4">
          A room exchange network for verified hotel owners
        </h1>
        <p className="text-lg text-neutral-600 mb-8">
          Offer your vacant nights to other verified hotel owners, earn credits, and use them to
          vacation at member hotels worldwide - for yourself, your family, or your staff.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/login" className="rounded-md bg-neutral-900 text-white px-6 py-3">
            Join as a hotel owner
          </Link>
          <Link href="/marketplace" className="rounded-md border border-neutral-300 px-6 py-3">
            Browse the marketplace
          </Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h2 className="font-medium mb-2">1. Get verified</h2>
          <p className="text-sm text-neutral-600">
            Every member is a real, checked hotel owner. That&apos;s what keeps the exchange safe.
          </p>
        </div>
        <div>
          <h2 className="font-medium mb-2">2. Offer & earn credits</h2>
          <p className="text-sm text-neutral-600">
            Open your vacant nights to the network. Credits are priced by star rating and season -
            not a rigid 1:1 swap.
          </p>
        </div>
        <div>
          <h2 className="font-medium mb-2">3. Spend them anywhere</h2>
          <p className="text-sm text-neutral-600">
            Use your credits at any other member hotel, for yourself, a family member, or an
            employee.
          </p>
        </div>
      </section>
    </div>
  );
}
