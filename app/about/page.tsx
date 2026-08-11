export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">About Hotel Trust</h1>

      <div className="space-y-6 text-neutral-600">
        <p>
          Hotel Trust is a room exchange network built exclusively for verified hotel owners.
          Instead of vacant nights going unused, members offer them to each other through a
          credit system - so a stay at your place can turn into a stay for you, your family, or
          your staff somewhere else in the network.
        </p>
        <p>
          We&apos;re not an OTA and we don&apos;t compete with your existing distribution channels.
          Every member is a real, checked hotel owner - that verification is what makes the whole
          exchange work, and it&apos;s the first thing we check before anyone joins.
        </p>
        <p>
          Hotel Trust is currently in a trial phase. The exchange itself unlocks once enough
          verified hotels have joined, but registration is open now - see our{" "}
          <a href="/terms" className="text-brand-gold underline">
            Terms
          </a>{" "}
          for exactly how it works.
        </p>
      </div>
    </div>
  );
}
