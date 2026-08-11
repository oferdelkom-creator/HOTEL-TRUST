import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-brand-green-dark">
      <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-white/70 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>Hotel Trust - a verified-owner-only room exchange network. Currently in trial.</p>
        <div className="flex items-center gap-4">
          <Link href="/about" className="text-brand-gold hover:text-white underline">
            About
          </Link>
          <Link href="/contact" className="text-brand-gold hover:text-white underline">
            Contact
          </Link>
          <Link href="/terms" className="text-brand-gold hover:text-white underline">
            Terms
          </Link>
          <Link href="/accessibility" className="text-brand-gold hover:text-white underline">
            Accessibility
          </Link>
        </div>
      </div>
    </footer>
  );
}
