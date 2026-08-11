import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-brand-green-dark">
      <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-white/70 flex items-center justify-between">
        <p>Hotel Trust - a verified-owner-only room exchange network. Currently in trial.</p>
        <Link href="/terms" className="text-brand-gold hover:text-white underline">
          Terms
        </Link>
      </div>
    </footer>
  );
}
