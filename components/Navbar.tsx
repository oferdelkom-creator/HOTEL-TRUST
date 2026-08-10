import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Hotel Trust
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/marketplace" className="hover:text-neutral-600">
            Marketplace
          </Link>
          <Link href="/owner" className="hover:text-neutral-600">
            Owner Dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-neutral-900 text-white px-4 py-2 hover:bg-neutral-700"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
