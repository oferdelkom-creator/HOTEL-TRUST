import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedHotelCount } from "@/lib/platformStats";
import LaunchProgress from "@/components/LaunchProgress";

const REASONS_TO_JOIN = [
  {
    title: "Turn vacant rooms into travel value",
    body: "Nights that would have gone empty become credits you can spend at other member hotels.",
  },
  {
    title: "Reward staff and family",
    body: "A stay booked with your credits can go to you, a family member, or a member of your team.",
  },
  {
    title: "Verified hotel-owner network",
    body: "Every member submits proof of ownership and is approved manually. No self-declared members.",
  },
  {
    title: "Direct exchange requests and private chat",
    body: "Post what you're looking for, see which owners are interested, and agree the details privately.",
  },
  {
    title: "Member-only travel opportunities",
    body: "Availability inside the network is offered between owners - it isn't published on public booking channels.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Verify your hotel",
    body: "Submit your OTA listing or an ownership document. An admin reviews it manually before your hotel is activated.",
  },
  {
    step: "2",
    title: "Offer vacant nights and earn credits",
    body: "Open the dates you can spare to the network. Every night another member stays adds credits to your balance.",
  },
  {
    step: "3",
    title: "Travel yourself, send family, or reward staff",
    body: "Spend your credits at any other member hotel and choose who the stay is for.",
  },
];

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
          <p className="text-sm font-medium text-brand-gold mb-3">Founding Member Access</p>
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

      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-semibold mb-2 text-brand-green">Why hotel owners join</h2>
        <p className="text-neutral-600 mb-8">
          Hotel Trust is built around one asset every hotel already has: nights that would otherwise
          stay empty.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REASONS_TO_JOIN.map((reason) => (
            <div
              key={reason.title}
              className="rounded-lg border border-neutral-200 bg-white px-5 py-5"
            >
              <h3 className="font-medium mb-2 text-brand-green">{reason.title}</h3>
              <p className="text-sm text-neutral-600">{reason.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <h2 className="text-2xl font-semibold mb-8 text-brand-green">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step}>
                <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-brand-green text-brand-gold font-medium mb-3">
                  {item.step}
                </span>
                <h3 className="font-medium mb-2 text-brand-green">{item.title}</h3>
                <p className="text-sm text-neutral-600">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-lg border border-neutral-200 bg-neutral-50 px-5 py-5">
            <h3 className="font-medium mb-2 text-brand-green">How credits are valued</h3>
            <p className="text-sm text-neutral-600">
              Credits are not a direct 1:1 room swap. The value of a stay is calculated from the
              host hotel&apos;s star rating, the season of the stay, and the number of nights - so a
              night in high season at a 5-star property is worth more than a low-season night at a
              3-star one. The season is set by Hotel Trust, not by the host, so no member can inflate
              their own rate.{" "}
              <Link href="/faq" className="text-brand-gold underline">
                See the FAQ
              </Link>
              .
            </p>
          </div>
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
          </Link>{" "}
          or the short answers in our{" "}
          <Link href="/faq" className="text-brand-gold underline">
            FAQ
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
