import type { Metadata } from "next";
import Link from "next/link";
import { POLICY_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy - Hotel Trust",
  description:
    "What information Hotel Trust collects from member hotels, why it is used, and how to update or delete it.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Privacy Policy</h1>
      <p className="text-neutral-500 mb-10 text-sm">Last updated: {POLICY_LAST_UPDATED}</p>

      <div className="space-y-10">
        <section>
          <h2 className="font-medium mb-2">1. What we collect</h2>
          <ul className="text-neutral-600 text-sm list-disc pl-5 space-y-1">
            <li>
              <strong>Account details</strong> - name, email address and the login credentials used
              to access the platform.
            </li>
            <li>
              <strong>Hotel details</strong> - hotel and business name, city, country, star rating,
              contact details, accessibility information and the extras your hotel offers guests.
            </li>
            <li>
              <strong>Verification documents</strong> - the listing link or ownership document you
              submit so we can confirm you are a real hotel owner.
            </li>
            <li>
              <strong>Booking and transaction history</strong> - the nights you offer, the stays you
              book, credit movements, and messages exchanged with other members through the
              platform.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-medium mb-2">2. Why we use it</h2>
          <ul className="text-neutral-600 text-sm list-disc pl-5 space-y-1">
            <li>
              <strong>Verification</strong> - to confirm hotel ownership before a hotel is
              activated, which is the basis of trust in the network.
            </li>
            <li>
              <strong>Running the network</strong> - to show your hotel to other verified members,
              price stays in credits, and keep an accurate record of every exchange.
            </li>
            <li>
              <strong>Security</strong> - to protect accounts, prevent fraudulent or duplicate
              registrations, and investigate misuse.
            </li>
            <li>
              <strong>Communication</strong> - to send transactional emails about your verification,
              bookings and messages, and to answer enquiries you send us.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-medium mb-2">3. What we do not do</h2>
          <p className="text-neutral-600 text-sm">
            We do not sell personal information, and we do not share it for third-party advertising.
            Information is shared with other members only to the extent needed to complete an
            exchange - for example, the host hotel sees who booked and who the stay is for.
            Service providers that host the platform and deliver our emails process data on our
            behalf under their own security obligations.
          </p>
        </section>

        <section>
          <h2 className="font-medium mb-2">4. Retention</h2>
          <p className="text-neutral-600 text-sm">
            Transaction records are kept for as long as they are needed as proof of the exchanges
            between members, since both businesses may need them for their own accounting.
            Verification documents are kept while your hotel is an active member.
          </p>
        </section>

        <section>
          <h2 className="font-medium mb-2">5. Updating or deleting your information</h2>
          <p className="text-neutral-600 text-sm">
            You can edit your hotel profile at any time from your dashboard. To correct, export or
            delete other information we hold about you, write to us through our{" "}
            <Link href="/contact" className="text-brand-gold underline">
              Contact page
            </Link>{" "}
            and we will handle the request directly.
          </p>
        </section>

        <section>
          <h2 className="font-medium mb-2">6. Cookies</h2>
          <p className="text-neutral-600 text-sm">
            See our{" "}
            <Link href="/cookies" className="text-brand-gold underline">
              Cookie Policy
            </Link>{" "}
            for what is stored in your browser and why.
          </p>
        </section>
      </div>
    </div>
  );
}
