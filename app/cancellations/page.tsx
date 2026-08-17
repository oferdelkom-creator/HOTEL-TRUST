import type { Metadata } from "next";
import Link from "next/link";
import { POLICY_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Cancellation & Dispute Policy - Hotel Trust",
  description:
    "Who is responsible for room availability and offered extras on Hotel Trust, and how cancellations and disputes between member hotels are handled.",
};

export default function CancellationsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Cancellation &amp; Dispute Policy</h1>
      <p className="text-neutral-500 mb-10 text-sm">Last updated: {POLICY_LAST_UPDATED}</p>

      <div className="space-y-10">
        <section>
          <h2 className="font-medium mb-2">1. Each hotel is responsible for its own listing</h2>
          <p className="text-neutral-600 text-sm">
            The host hotel is responsible for the availability of the room it has offered and for
            the accuracy of everything shown on its profile - star rating, location, contact
            details, accessibility information and any extras. Hotel Trust facilitates the exchange
            between two businesses; it is not the provider of the accommodation.
          </p>
        </section>

        <section>
          <h2 className="font-medium mb-2">2. Upgrades, meals and other extras</h2>
          <p className="text-neutral-600 text-sm">
            Room upgrades, welcome wine, breakfast, spa access and similar benefits depend entirely
            on what the host hotel has committed to offer on its own profile. Extras described as
            subject to availability are exactly that. Nothing beyond the booked room is guaranteed
            network-wide.
          </p>
        </section>

        <section>
          <h2 className="font-medium mb-2">3. Cancellations</h2>
          <p className="text-neutral-600 text-sm">
            If a stay has to be cancelled by either side, notify the other hotel through the
            platform as early as possible. The booking is then marked as cancelled and the related
            credit movement is reversed, so neither side keeps credits for a stay that did not take
            place. Repeated late cancellations by a member may lead to the hotel being suspended
            from the network.
          </p>
        </section>

        <section>
          <h2 className="font-medium mb-2">4. Disputes between members</h2>
          <p className="text-neutral-600 text-sm">
            In a dispute, Hotel Trust holds the record of the transaction - dates, nights, credit
            value and both hotels involved - and can make that record available to both sides and
            help the two hotels communicate. Hotel Trust does not guarantee any commercial outcome,
            does not act as an arbitrator between the businesses, and is not a party to the
            arrangement between them.
          </p>
        </section>

        <section>
          <h2 className="font-medium mb-2">5. Before full trading opens</h2>
          <p className="text-neutral-600 text-sm">
            A detailed cancellation policy - including notice periods and the consequences of a
            no-show - will be published before the full exchange marketplace opens. Until then the
            principles above apply, alongside our{" "}
            <Link href="/terms" className="text-brand-gold underline">
              Terms
            </Link>
            . Questions can be sent through our{" "}
            <Link href="/contact" className="text-brand-gold underline">
              Contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
