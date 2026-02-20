// /components/Card.tsx
import React from "react";

export default function Card({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm p-5 border border-[#e6d2a8]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="text-lg sm:text-xl font-extrabold text-[#4a2412]">
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}