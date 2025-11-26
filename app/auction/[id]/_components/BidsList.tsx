"use client";
import React from "react";

type Bid = {
  id: string;
  amount: number;
  user?: { name?: string };
  created_at?: string;
  user_id?: string;
  userId?: string;
};

type Props = {
  bids: Bid[];
  currentUserId?: string;
};

export default function BidsList({ bids, currentUserId }: Props) {
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]">
      <div className="w-full px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">История ставок</h3>
        <span className="px-2 py-1 rounded-md bg-slate-100 text-xs font-semibold text-slate-600 tabular-nums">
          {bids.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {bids.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-sm font-medium text-slate-500">История пуста</p>
            <p className="text-xs text-slate-400 mt-1">Сделайте первую ставку!</p>
          </div>
        ) : (
          <div className="w-full">
            {bids.map((bid) => {
              const isMyBid = !!(currentUserId && (bid.userId === currentUserId || bid.user_id === currentUserId));
              const name = isMyBid ? "Вы" : (bid.user?.name || "Участник");
              const date = bid.created_at ? new Date(bid.created_at) : new Date();
              const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
              
              return (
                <div 
                  key={bid.id} 
                  className={`group flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0 transition-all duration-200 hover:bg-slate-50 ${isMyBid ? "bg-blue-50/30 hover:bg-blue-50/50" : ""}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${isMyBid ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-slate-300 group-hover:bg-slate-400"}`}></div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-semibold truncate ${isMyBid ? "text-blue-700" : "text-slate-700"}`}>
                        {name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                        {timeStr}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`text-sm font-bold tabular-nums tracking-tight ${isMyBid ? "text-blue-700" : "text-slate-900"}`}>
                      {bid.amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
