export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Terms</h1>
      <p className="text-neutral-500 mb-10 text-sm">
        Hotel Trust is currently in a trial phase. These terms describe how the exchange works
        today and may be updated as the platform develops.
      </p>

      <div className="space-y-10">
        <section>
          <h2 className="font-medium mb-2">1. Who can join</h2>
          <p className="text-neutral-600 text-sm">
            Membership is limited to real, verified owners of 3-star-and-above hotels. Every
            applicant submits proof of ownership (an OTA listing link or an ownership document),
            which an admin reviews manually before the hotel is activated. Nothing on the platform
            self-verifies.
          </p>
        </section>

        <section>
          <h2 className="font-medium mb-2">2. How credits work</h2>
          <p className="text-neutral-600 text-sm mb-2">
            Exchanges run on credits, not direct 1:1 swaps. A stay&apos;s credit cost is calculated
            from the host hotel&apos;s star rating and the season of the stay:
          </p>
          <ul className="text-neutral-600 text-sm list-disc pl-5 space-y-1">
            <li>3★ = 1.0 credit/night, 4★ = 1.5, 5★ = 2.0</li>
            <li>Low season ×0.8, regular season ×1.0, high season ×1.4</li>
          </ul>
          <p className="text-neutral-600 text-sm mt-2">
            The season multiplier is set by Hotel Trust, not self-declared by the host, so no
            member can inflate their own exchange rate.
          </p>
        </section>

        <section>
          <h2 className="font-medium mb-2">3. Who can use a booking</h2>
          <p className="text-neutral-600 text-sm">
            A stay booked with your hotel&apos;s credits can be used by you, a family member, or a
            member of your staff. Regardless of who checks in, your verified hotel account remains
            financially responsible for that booking.
          </p>
        </section>

        <section>
          <h2 className="font-medium mb-2">4. Unfulfilled balances and payment holds</h2>
          <p className="text-neutral-600 text-sm">
            Credits can be spent before they&apos;re earned back through real stays at your own
            hotel. If a booking would take your balance negative, a payment hold is placed for the
            market value of those nights at check-in. If the balance is covered by the time the
            stay ends (through a real stay at your hotel in the meantime), the hold is released.
            Otherwise, it is charged.
          </p>
        </section>

        <section>
          <h2 className="font-medium mb-2">5. Taxes and reporting</h2>
          <p className="text-neutral-600 text-sm">
            Hotel Trust keeps a full record of every exchange - dates, nights, credit value, both
            hotels involved - available to each member as a transaction history. Each member
            business is responsible for reporting its own activity to its own accountant or tax
            authority; Hotel Trust does not act as a tax agent for any member.
          </p>
        </section>
      </div>
    </div>
  );
}
