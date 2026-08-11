import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedHotelCount } from "@/lib/platformStats";
import LaunchProgress from "@/components/LaunchProgress";

export default async function HomePage() {
  const supabase = await createClient();
  const verifiedCount = await getVerifiedHotelCount(supabase);

  return (
    <div>
      <section className="relative overflow-hidden">
        <Image
          src="/hero-thailand.jpg"
          alt="A quiet tropical bay - the kind of vacation Hotel Trust credits can pay for"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-brand-green-dark/70" />
        <div className="relative max-w-3xl mx-auto px-4 py-28 text-center">
          <p className="text-sm font-medium text-brand-gold mb-3">Currently in trial</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-4 text-white">
            A room exchange network for verified hotel owners
          </h1>
          <p className="text-lg text-white/90 mb-8">
            Offer your vacant nights to other verified hotel owners, earn credits, and use them to
            vacation at member hotels worldwide - for yourself, your family, or your staff.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/login" className="rounded-md bg-brand-gold text-brand-green-dark font-medium px-6 py-3">
              Join as a hotel owner
            </Link>
            <Link href="/marketplace" className="rounded-md border border-white/60 text-white px-6 py-3">
              Browse the marketplace
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-lg mx-auto px-4 -mt-8 relative">
        <LaunchProgress verifiedCount={verifiedCount} />
      </section>

      <section className="max-w-4xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h2 className="font-medium mb-2 text-brand-green">1. Get verified</h2>
          <p className="text-sm text-neutral-600">
            Every member is a real, checked hotel owner. That&apos;s what keeps the exchange safe.
          </p>
        </div>
        <div>
          <h2 className="font-medium mb-2 text-brand-green">2. Offer & earn credits</h2>
          <p className="text-sm text-neutral-600">
            Open your vacant nights to the network. Credits are priced by star rating and season -
            not a rigid 1:1 swap.
          </p>
        </div>
        <div>
          <h2 className="font-medium mb-2 text-brand-green">3. Spend them anywhere</h2>
          <p className="text-sm text-neutral-600">
            Use your credits at any other member hotel, for yourself, a family member, or an
            employee.
          </p>
        </div>
      </section>

      <section className="bg-brand-green">
        <div className="max-w-4xl mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden order-2 md:order-1 relative h-64">
            <Image
              src="/hero-thailand.jpg"
              alt="A beach vacation booked through Hotel Trust credits"
              fill
              className="object-cover"
            />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-2xl font-semibold mb-4 text-brand-gold">
              Who actually gets to use the credits?
            </h2>
            <p className="text-white/90 mb-4">
              Not just you. A stay you book with your credits can go to yourself, a family member,
              or a member of your own staff - it&apos;s a travel perk you can extend to the people
              around your business, not a personal-only benefit.
            </p>
            <p className="text-white/90">
              Your hotel&apos;s account stays financially responsible for the booking either way, so
              the trust chain never breaks - whoever checks in, the verified owner behind the
              account is who the network holds accountable.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-semibold mb-4 text-brand-green">Taxes and compliance</h2>
        <p className="text-neutral-600 mb-4">
          Hotel Trust facilitates the exchange and keeps a full record of every stay - dates,
          nights, credit value, both hotels involved - but each member business is responsible for
          reporting its own activity to its own accountant, the same way it would for any other
          business transaction.
        </p>
        <p className="text-neutral-600">
          Read the full rules in our{" "}
          <Link href="/terms" className="text-brand-gold underline">
            Terms
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
