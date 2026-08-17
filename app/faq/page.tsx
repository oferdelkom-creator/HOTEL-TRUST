import type { Metadata } from "next";
import Link from "next/link";
import { LAUNCH_THRESHOLD } from "@/lib/platformConfig";

export const metadata: Metadata = {
  title: "FAQ - Hotel Trust",
  description:
    "Answers to the most common questions from hotel owners about verification, credits, bookings, perks and taxes on Hotel Trust.",
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Who can join Hotel Trust?",
    a: (
      <>
        Membership is limited to owners - or the officially authorised representative - of hotels
        rated 3 stars and above. One account represents one hotel. The network is not open to
        travellers, agencies or resellers.
      </>
    ),
  },
  {
    q: "How do you verify hotel ownership?",
    a: (
      <>
        You submit a link to your listing on an established channel (Booking.com, Google Business)
        or a hosted ownership document. Our team reviews every application manually and activates
        the hotel only after approval. Nothing on the platform verifies itself.
      </>
    ),
  },
  {
    q: "How are credits calculated?",
    a: (
      <>
        A stay costs <strong>star value × season multiplier × number of nights</strong>. Star value
        is 1.0 per night for a 3-star hotel, 1.5 for 4-star and 2.0 for 5-star. The season
        multiplier is ×0.8 in low season, ×1.0 in regular season and ×1.4 in high season. Credits
        are not a 1:1 room swap, and the season is set by Hotel Trust rather than by the host, so no
        member can inflate their own rate.
      </>
    ),
  },
  {
    q: "Can I use credits for an employee or family member?",
    a: (
      <>
        Yes. When you book, you state whether the stay is for you, a family member or a member of
        your staff. Whoever checks in, your verified hotel account remains financially responsible
        for the booking.
      </>
    ),
  },
  {
    q: "What happens if my hotel has no bookings from members?",
    a: (
      <>
        Nothing is charged for a quiet period. Your open nights simply stay listed and your credit
        balance is unaffected. You can still book stays at other member hotels before you have
        earned credits back - see the next question for how that is handled.
      </>
    ),
  },
  {
    q: "What happens if my credit balance becomes negative?",
    a: (
      <>
        Hotel Trust works as a credit line rather than prepaid currency, so you can spend before you
        earn. If a booking would take your balance below zero, a payment hold is placed for the
        market value of those nights. If real stays at your hotel cover the balance by the time the
        trip ends, the hold is released; if not, it is charged.
      </>
    ),
  },
  {
    q: "Can hotels offer upgrades, breakfast, wine, or other benefits?",
    a: (
      <>
        Yes. Each hotel decides what it offers beyond the room itself and lists it on its own
        profile - a room upgrade subject to availability, breakfast, a welcome bottle, spa access
        and so on. These extras are part of what makes a listing attractive inside the network.
      </>
    ),
  },
  {
    q: "Are upgrades and perks guaranteed?",
    a: (
      <>
        Only what the host hotel states on its own profile applies, and availability-dependent
        extras such as upgrades remain subject to availability on arrival. There is no
        network-wide guarantee, because not every property can offer the same extras. See our{" "}
        <Link href="/cancellations" className="text-brand-gold underline">
          Cancellation &amp; Dispute Policy
        </Link>
        .
      </>
    ),
  },
  {
    q: "How does direct exchange work?",
    a: (
      <>
        Alongside the credit marketplace, you can post a direct exchange request describing where
        and when you would like to travel. Other verified owners signal their interest, and the two
        hotels agree the details in a private chat on the platform.
      </>
    ),
  },
  {
    q: "What happens if a booking is cancelled?",
    a: (
      <>
        Contact the other hotel through the platform as early as possible. The booking is then
        marked as cancelled and the related credit movement is reversed by our team, so neither side
        keeps credits for a stay that did not happen. A detailed cancellation policy will be
        published before the full marketplace opens.
      </>
    ),
  },
  {
    q: "How should my hotel report barter activity for tax purposes?",
    a: (
      <>
        Treat an exchange like any other business transaction and report it according to the rules
        that apply to your business. Your dashboard keeps a full record of every stay - dates,
        nights, credit value and both hotels involved - which you can hand to your accountant. Hotel
        Trust does not act as a tax agent for any member.
      </>
    ),
  },
  {
    q: "When will the full exchange marketplace open?",
    a: (
      <>
        The exchange opens as the founding group of {LAUNCH_THRESHOLD} verified hotels completes.
        Registration, verification and listing your vacant nights are open now, so founding members
        are ready to trade from day one.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Frequently asked questions</h1>
      <p className="text-neutral-500 mb-10 text-sm">
        Short answers to what hotel owners ask us most. Anything missing?{" "}
        <Link href="/contact" className="text-brand-gold underline">
          Contact us
        </Link>
        .
      </p>

      <div className="space-y-8">
        {FAQS.map((faq) => (
          <section key={faq.q}>
            <h2 className="font-medium mb-2 text-brand-green">{faq.q}</h2>
            <p className="text-neutral-600 text-sm">{faq.a}</p>
          </section>
        ))}
      </div>

      <p className="text-neutral-500 text-sm mt-12">
        The full rules are in our{" "}
        <Link href="/terms" className="text-brand-gold underline">
          Terms
        </Link>
        .
      </p>
    </div>
  );
}
