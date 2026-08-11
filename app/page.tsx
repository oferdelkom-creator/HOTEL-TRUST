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

      <section className="max-w-4xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-3 gap-8">
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

      <section className="bg-white border-y border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div
            aria-hidden
            className="h-64 rounded-2xl bg-gradient-to-br from-teal-700 via-teal-600 to-amber-500 order-2 md:order-1"
          />
          <div className="order-1 md:order-2">
            <h2 className="text-2xl font-semibold mb-4">Who actually gets to use the credits?</h2>
            <p className="text-neutral-600 mb-4">
              Not just you. A stay you book with your credits can go to yourself, a family member,
              or a member of your own staff - it&apos;s a travel perk you can extend to the people
              around your business, not a personal-only benefit.
            </p>
            <p className="text-neutral-600">
              Your hotel&apos;s account stays financially responsible for the booking either way, so
              the trust chain never breaks - whoever checks in, the verified owner behind the
              account is who the network holds accountable.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-semibold mb-4">Taxes and compliance</h2>
        <p className="text-neutral-600 mb-4">
          Hotel Trust facilitates the exchange and keeps a full record of every stay - dates,
          nights, credit value, both hotels involved - but each member business is responsible for
          reporting its own activity to its own accountant, the same way it would for any other
          business transaction.
        </p>
        <p className="text-neutral-600">
          Read the full rules in our <Link href="/terms" className="underline">Terms</Link>.
        </p>
      </section>
    </div>
  );
}
