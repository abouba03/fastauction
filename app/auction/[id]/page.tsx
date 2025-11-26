"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import Countdown from "./_components/Countdown";
import WinnerModal from "./_components/WinnerModal";
import BidsList from "./_components/BidsList";

interface Bid {
  id: string;
  amount: number;
  user?: { name?: string };
  created_at?: string;
  user_id?: string;
  userId?: string; // Handle both cases
}

interface RawBidPayload {
  id: string;
  amount: number;
  auction_id: string;
  user_id: string;
  created_at: string;
}

interface Auction {
  id: string;
  title: string;
  description?: string;
  startPrice: number;
  currentBid: number;
  startTime?: string;
  endTime: string;
  status: string;
  user?: { name?: string };
}

type RawAuction = {
  id: string;
  title: string;
  description?: string;
  start_price?: number;
  startPrice?: number;
  current_bid?: number;
  currentBid?: number;
  start_time?: string;
  startTime?: string;
  end_time: string;
  endTime?: string;
  status?: string;
  user?: { name?: string };
};

export default function AuctionPage() {
  const params = useParams();
  const auctionId = params.id as string;
  const { user: currentUser } = useUser();
  const supabase = createSupabaseBrowserClient();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [newBidAmount, setNewBidAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [winner, setWinner] = useState<{ name: string; amount: number } | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [flashExtend, setFlashExtend] = useState(false);

  const [remaining, setRemaining] = useState({
    total: 0,
    d: 0,
    h: 0,
    m: 0,
    s: 0,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef(0);

  const normalizeAuction = (a: RawAuction): Auction => {
    return {
      id: a.id,
      title: a.title,
      description: a.description ?? "",
      startPrice: a.start_price ?? a.startPrice ?? 0,
      currentBid: a.current_bid ?? a.currentBid ?? 0,
      startTime: a.start_time ?? a.startTime ?? undefined,
      endTime: a.end_time ?? a.endTime!,
      status: a.status ?? "active",
      user: a.user ?? { name: "Аноним" },
    };
  };

  const fetchAuction = useCallback(async () => {
    try {
      const res = await fetch(`/api/auctions`);
      const data = await res.json();
      const list = (Array.isArray(data) ? data : []) as RawAuction[];
      const found = list.find((x) => x.id === auctionId) || null;
      if (found) setAuction(normalizeAuction(found));
      else setAuction(null);
    } catch (error) {
      console.error("Ошибка:", error);
      setError("Не удалось загрузить аукцион");
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  const fetchBids = useCallback(async () => {
    try {
      const res = await fetch(`/api/bids?auctionId=${auctionId}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      // Strict sort: highest amount first, then newest
      list.sort((a: Bid, b: Bid) => {
        if (b.amount !== a.amount) return b.amount - a.amount;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
      setBids(list);
    } catch (error) {
      console.error("Ошибка:", error);
    }
  }, [auctionId]);

  useEffect(() => {
    fetchAuction();
    fetchBids();

    // Polling fallback to ensure data consistency every 1 second
    const interval = setInterval(() => {
        fetchBids();
        fetchAuction(); 
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchAuction, fetchBids]);

  useEffect(() => {
    if (!auctionId) return;
    
    console.log("Setting up Supabase Realtime for auction:", auctionId);

    const bidsChannel = supabase
      .channel(`realtime-bids-${auctionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bids", filter: `auction_id=eq.${auctionId}` },
        async (payload: RealtimePostgresInsertPayload<RawBidPayload>) => {
          console.log("Realtime: New bid received!", payload);
          const newBid = payload.new;
          
          // Optimistic update
          setBids((prev) => {
            if (prev.find((b) => b.id === newBid.id)) return prev;
            // Note: payload.new doesn't have user info, so we add a placeholder or wait for fetchBids
            // We'll add it with a placeholder name to show it instantly
            const optimisticBid: Bid = {
                id: newBid.id,
                amount: newBid.amount,
                created_at: newBid.created_at,
                userId: newBid.user_id,
                user: { name: "Загрузка..." } // Will be updated by fetchBids
            };
            return [optimisticBid, ...prev];
          });

          // Si la nouvelle offre arrive dans les 10 dernières secondes côté client, lancer un flash visuel
          // Utiliser le temps restant déjà calculé pour éviter les dépendances inutiles
          if (remainingRef.current <= 10_000 && remainingRef.current > 0) {
            setFlashExtend(true);
            setTimeout(() => setFlashExtend(false), 500);
          }

          // Fetch full data to get user name
          fetchBids();

          setAuction((prev) => {
            if (!prev) return null;
            if (newBid.amount > prev.currentBid) {
              return { ...prev, currentBid: newBid.amount };
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status (bids):", status);
      });

    const auctionChannel = supabase
      .channel(`realtime-auction-${auctionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "auctions", filter: `id=eq.${auctionId}` },
        (payload: RealtimePostgresUpdatePayload<RawAuction>) => {
          console.log("Realtime: Auction updated!", payload);
          const updated = payload.new as RawAuction;
          const normalized = normalizeAuction(updated);
          setAuction((prev) => {
            if (!prev) return null;
            // Détecter une extension d'endTime (valeur augmentée) pour déclencher le flash
            const prevEnd = new Date(prev.endTime).getTime();
            const nextEnd = new Date(normalized.endTime).getTime();
            if (nextEnd > prevEnd) {
              setFlashExtend(true);
              setTimeout(() => setFlashExtend(false), 500);
            }
            return {
              ...prev,
              currentBid: normalized.currentBid,
              status: normalized.status,
              endTime: normalized.endTime,
            };
          });
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status (auction):", status);
      });

    return () => {
      console.log("Cleaning up Supabase Realtime channels");
      supabase.removeChannel(bidsChannel);
      supabase.removeChannel(auctionChannel);
    };
  }, [auctionId, supabase, fetchBids]);


  useEffect(() => {
    if (!auction?.endTime) return;

    const update = () => {
      const now = new Date().getTime();
      const end = new Date(auction.endTime).getTime();
      const diff = Math.max(end - now, 0);
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setRemaining({ total: diff, d, h, m, s });
    };

    update();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(update, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [auction?.endTime]);

  useEffect(() => {
    remainingRef.current = remaining.total;
  }, [remaining.total]);

  const ended = remaining.total === 0 || auction?.status === "ended";

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (ended) {
      setError("Аукцион завершен");
      return;
    }

    const amount = parseFloat(newBidAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Некорректная сумма");
      return;
    }

    if (auction && amount <= auction.currentBid) {
        setError(`Ставка должна быть выше ${auction.currentBid} ₽`);
        return;
    }

    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId, amount }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ошибка при размещении ставки");
        return;
      }

      setNewBidAmount("");
    } catch (error) {
      console.error("Ошибка:", error);
      setError("Ошибка сервера");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Загрузка аукциона...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Аукцион не найден</h2>
          <p className="text-slate-600">Возможно, он был удален или не существует.</p>
        </div>
      </div>
    );
  }

  const progress = (() => {
    const start = auction.startTime ? new Date(auction.startTime).getTime() : undefined;
    const end = new Date(auction.endTime).getTime();
    const now = Date.now();
    if (!start) return Math.min(100, Math.max(0, ((end - now) / (end - now + 1)) * 100)); // Fallback if no start time
    const pct = ((now - start) / (end - start)) * 100;
    return Math.max(0, Math.min(100, pct));
  })();

  return (
    <>
    <div className={`min-h-screen bg-slate-50 ${flashExtend ? "animate-pulse bg-red-50" : ""}`}> 
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 py-3">
            <div className="flex items-start md:items-center gap-2 md:gap-3 w-full md:w-auto">
              <Link href="/" className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[11px] font-bold">
                ← На главную
              </Link>
              <div className="flex flex-col gap-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">{auction.title}</h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Продавец: <span className="font-medium text-slate-900">{auction.user?.name || "Аноним"}</span>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${ended ? "bg-slate-100 text-slate-600" : "bg-green-100 text-green-700"}`}>
                      {ended ? "Завершен" : "Активен"}
                  </span>
                  <span className="text-[11px] text-green-600 flex items-center gap-1">● Live (Supabase)</span>
                </div>
              </div>
            </div>
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0">
            <Countdown remaining={{ d: remaining.d, h: remaining.h, m: remaining.m, s: remaining.s }} />
            <button
            onClick={() => {
              if (!bids.length) {
              setWinner(null);
              setShowWinner(true);
              return;
              }
              const top = bids.reduce((acc, b) => (b.amount > acc.amount ? b : acc), bids[0]);
              const name = top.user?.name || "Аноним";
              setWinner({ name, amount: top.amount });
              setShowWinner(true);
            }}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
            {ended ? "Показать победителя" : "Показать лидера"}
            </button>
          </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-linear-to-r from-blue-900 to-blue-700 h-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Описание лота</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{auction.description || "Нет описания."}</p>
            </div>
          <BidsList bids={bids} currentUserId={currentUser?.id} />
          </div>

          <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 relative overflow-hidden">
              <div className="relative">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Текущая цена</p>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
                  {auction.currentBid.toFixed(2)} <span className="text-lg text-slate-400 font-bold">₽</span>
                </div>
                <p className="text-[11px] text-slate-400">Начальная цена: {auction.startPrice.toFixed(2)} ₽</p>
              </div>
            </div>

                <div className={`bg-white rounded-xl p-4 shadow-sm border border-slate-100 ${remaining.total > 0 && remaining.total <= 10_000 ? "animate-pulse bg-red-500" : ""}`}>
                    <h3 className="font-bold text-slate-900 mb-4">Сделать ставку</h3>
                    
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handlePlaceBid} className="space-y-4">
                        <div>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newBidAmount}
                                    onChange={(e) => setNewBidAmount(e.target.value)}
                                    placeholder="Сумма ставки"
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                    disabled={ended}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₽</span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {[100, 500, 1000].map(inc => (
                                    <button
                                        key={inc}
                                        type="button"
                                        disabled={ended}
                                        onClick={() => setNewBidAmount((auction.currentBid + inc).toFixed(2))}
                        className="flex-1 px-3 py-2 rounded-lg text-[11px] font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
                                    >
                                        +{inc} ₽
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={ended}
                  className={`w-full rounded-xl px-4 py-3 font-bold text-white shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] ${
                                ended
                                    ? "bg-slate-400 cursor-not-allowed shadow-none"
                                    : "bg-linear-to-r from-blue-900 to-blue-700 hover:shadow-blue-900/25"
                                }`}
                        >
                            {ended ? "Аукцион завершен" : "Разместить ставку"}
                        </button>
                    </form>
                </div>
            </div>
          </div>

        </div>
      </main>
    </div>

    <WinnerModal
      open={showWinner}
      onClose={() => setShowWinner(false)}
      winnerName={winner?.name ?? null}
      amount={winner?.amount ?? null}
    />
    </>
  );
}
