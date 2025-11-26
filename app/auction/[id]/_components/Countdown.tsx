"use client";
import React from "react";

type Props = { remaining: { d: number; h: number; m: number; s: number } };

export default function Countdown({ remaining }: Props) {
  const items = [
    { label: "Д", value: remaining.d },
    { label: "Ч", value: remaining.h },
    { label: "М", value: remaining.m },
    { label: "С", value: remaining.s },
  ];
  return (
    <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl">
      {items.map((item) => (
        <div key={item.label} className="px-3 py-2 rounded-lg bg-white shadow-sm text-center min-w-[50px]">
          <div className="text-lg font-bold text-slate-900 leading-none">{String(item.value).padStart(2, "0")}</div>
          <div className="text-[10px] text-slate-500 font-medium">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
