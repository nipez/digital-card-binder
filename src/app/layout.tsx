import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Binder Archive",
  description: "A nostalgic digital trading card binder for premium set archiving."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-archive-ink/10 bg-archive-paper/82 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
            <Link href="/" className="font-display text-2xl font-bold text-archive-oxblood">
              Binder Archive
            </Link>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <Link href="/sets/1989-upper-deck-baseball" className="hover:text-archive-oxblood">
                Set
              </Link>
              <Link href="/submit-scan" className="hover:text-archive-oxblood">
                Submit Scan
              </Link>
              <Link href="/admin/moderation" className="hover:text-archive-oxblood">
                Admin
              </Link>
              <Link href="/admin/approved-scan-ingester" className="hover:text-archive-oxblood">
                Ingest
              </Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
