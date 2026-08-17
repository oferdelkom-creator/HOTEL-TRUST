import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/cancellations", label: "Cancellation & Dispute Policy" },
  { href: "/accessibility", label: "Accessibility" },
];

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-brand-green-dark">
      <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-white/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p>Hotel Trust - a verified-owner-only room exchange network.</p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-brand-gold hover:text-white underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
