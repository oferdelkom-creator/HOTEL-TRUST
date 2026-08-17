import Link from "next/link";
import Logo from "./Logo";

export default function Navbar() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/marketplace" className="text-brand-green hover:text-brand-gold">
            Marketplace
          </Link>
          <Link href="/exchange" className="text-brand-green hover:text-brand-gold">
            Direct Exchange
          </Link>
          <Link href="/owner" className="text-brand-green hover:text-brand-gold">
            Owner Dashboard
          </Link>
          <Link href="/faq" className="text-brand-green hover:text-brand-gold">
            FAQ
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-brand-green text-brand-gold px-4 py-2 hover:bg-brand-green-dark"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
