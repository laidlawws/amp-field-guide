// /components/Sidebar.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/calculators/ohms", label: "Ohm’s Law" },
  { href: "/reference/ohms-chart", label: "Ohm’s Law Chart" },
  { href: "/calculators/power", label: "Power" },
  { href: "/calculators/voltage-drop", label: "Voltage Drop" },
  { href: "/reference/quick", label: "Quick Reference" },
  { href: "/reference/conduit", label: "Conduit Bending" },
  { href: "/reference/fill", label: "Conduit Fill" },
  { href: "/reference/ampacity", label: "Ampacity" },
  { href: "/reference/box-fill", label: "Box Fill" },
  { href: "/reference/tables", label: "NEC Tables" },
];

export default function Sidebar({ open, setOpen }: Props) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      <button
        aria-label="Close menu"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/30 z-40 md:hidden ${
          open ? "block" : "hidden"
        }`}
      />

      <aside
        className={`fixed z-50 md:z-auto md:static top-0 left-0 h-dvh w-72 bg-white border-r border-[#e6d2a8]
        p-5 transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <Image src="/logo.png" alt="AMP Logo" width={90} height={40} />
          <div className="leading-tight">
            <div className="font-extrabold text-[#4a2412]">AMP</div>
            <div className="text-sm font-semibold text-[#f26422]">
              Field Reference Guide
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-3 py-2 text-sm font-semibold transition
                ${
                  active
                    ? "bg-[#f26422] text-white"
                    : "hover:bg-[#f7f5f2] text-[#4a2412]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 text-xs text-[#4a2412]/70">
          <div className="font-semibold">Tip:</div>
          <div>Use the search on Home to quickly find formulas.</div>
        </div>
      </aside>
    </>
  );
}