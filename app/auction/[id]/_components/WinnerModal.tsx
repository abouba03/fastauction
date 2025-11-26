"use client";
import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  winnerName: string | null;
  amount: number | null;
};

export default function WinnerModal({ open, onClose, winnerName, amount }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-linear-to-br from-yellow-400 to-orange-500 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🏆</span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-wide">Результат</h2>
        </div>
        <div className="p-6 text-center">
          {winnerName && amount !== null ? (
            <div className="space-y-2">
              <p className="text-slate-500 font-medium uppercase tracking-wider text-xs">Победитель</p>
              <p className="text-xl font-bold text-slate-900">{winnerName}</p>
              <div className="w-16 h-1 bg-slate-100 mx-auto my-3 rounded-full"></div>
              <p className="text-slate-500 font-medium uppercase tracking-wider text-xs">Ставка</p>
              <p className="text-3xl font-black text-blue-600">{amount.toFixed(2)} ₽</p>
            </div>
          ) : (
            <p className="text-slate-600">Ставок не было. Победитель не определен.</p>
          )}
          <button onClick={onClose} className="mt-6 w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">Закрыть</button>
        </div>
      </div>
    </div>
  );
}
