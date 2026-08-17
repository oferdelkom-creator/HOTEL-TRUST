import type { Metadata } from "next";
import Link from "next/link";
import { POLICY_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Cookie Policy - Hotel Trust",
  description:
    "Which cookies Hotel Trust uses, why they are needed for sign-in and security, and how the policy will change if analytics are added.",
};

export default function CookiesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Cookie Policy</h1>
      <p className="text-neutral-500 mb-10 text-sm">Last updated: {POLICY_LAST_UPDATED}</p>

      <div className="space-y-10">
        <section>
          <h2 className="font-medium mb-2">1. Essential cookies only</h2>
          <p className="text-neutral-600 text-sm">
            Hotel Trust currently uses only cookies that are strictly necessary to operate the site.
            They keep you signed in as you move between pages, protect the sign-in process, and
            secure form submissions against cross-site request forgery. Without them the platform
            cannot keep you logged in.
          </p>
        </section>

        <section>
          <h2 className="font-medium mb-2">2. What we do not use today</h2>
          <p className="text-neutral-600 text-sm">
            We do not use advertising cookies, cross-site tracking, or third-party marketing
            pixels, and we do not build advertising profiles from your visits.
          </p>
        </section>

        <section>
          <h2 className="font-medium mb-2">3. If analytics are added later</h2>
          <p className="text-neutral-600 text-sm">
            If we introduce analytics tools in the future to understand how the site is used, this
            policy will be updated before they go live, the tools involved will be named here, and
            consent will be requested where the applicable law requires it.
          </p>
        </section>

        <section>
          <h2 className="font-medium mb-2">4. Managing cookies</h2>
          <p className="text-neutral-600 text-sm">
            You can clear or block cookies in your browser settings at any time. Blocking essential
            cookies will prevent you from signing in and using your dashboard. Questions? Reach us
            through the{" "}
            <Link href="/contact" className="text-brand-gold underline">
              Contact page
            </Link>
            , or read our{" "}
            <Link href="/privacy" className="text-brand-gold underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
