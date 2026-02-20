import "./globals.css";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "AMP Field Reference Guide",
  description: "Electrical field reference calculators and NEC import-ready tables",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f7f5f2] text-[#4a2412] antialiased">
        {/* SVG HEADER */}
        <header className="md:hidden sticky top-0 z-50 border-b border-[#e6d2a8] bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-center">
  <Link href="/" className="block w-[420px] max-w-full">
    <Image
      src="/amp-header.svg"
      alt="AMP Field Reference Guide"
      width={320}
      height={70}
      priority
      className="w-full h-auto"
    />
  </Link>
</div>
          </div>
        </header>

        {/* Interactive shell (sidebar, mobile menu, etc.) */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}