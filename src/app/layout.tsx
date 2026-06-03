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
        <header className="border-b border-archive-ink/10 bg-archive-paper/88 backdrop-blur">
          <nav className="mx-auto grid max-w-7xl gap-3 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <Link href="/" className="font-display text-2xl font-bold leading-none text-archive-oxblood sm:text-2xl">
              Binder Archive
            </Link>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 text-xs font-bold sm:mx-0 sm:items-center sm:overflow-visible sm:p-0 sm:text-sm">
              <Link href="/sets/1989-upper-deck-baseball" className="whitespace-nowrap rounded-md border border-archive-ink/10 bg-white/44 px-3 py-2 hover:text-archive-oxblood sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                1989 UD
              </Link>
              <Link href="/sets/1986-fleer-basketball" className="whitespace-nowrap rounded-md border border-archive-ink/10 bg-white/44 px-3 py-2 hover:text-archive-oxblood sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                1986 Fleer
              </Link>
              <Link href="/comics" className="whitespace-nowrap rounded-md border border-archive-ink/10 bg-white/44 px-3 py-2 hover:text-archive-oxblood sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                Comics
              </Link>
              <Link href="/submit-scan" className="whitespace-nowrap rounded-md border border-archive-ink/10 bg-white/44 px-3 py-2 hover:text-archive-oxblood sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                Submit Scan
              </Link>
              <Link href="/admin/moderation" className="whitespace-nowrap rounded-md border border-archive-ink/10 bg-white/44 px-3 py-2 hover:text-archive-oxblood sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                Admin
              </Link>
              <Link href="/admin/card-image-uploader" className="whitespace-nowrap rounded-md border border-archive-ink/10 bg-white/44 px-3 py-2 hover:text-archive-oxblood sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                Upload
              </Link>
              <Link href="/admin/approved-scan-ingester" className="whitespace-nowrap rounded-md border border-archive-ink/10 bg-white/44 px-3 py-2 hover:text-archive-oxblood sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
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
