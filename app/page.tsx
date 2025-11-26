// app/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

interface Auction {
  id: string;
  title: string;
  description: string;
  start_price: number;
  current_bid: number;
  end_time: string;
  status: string;
  user: { name: string };
}

export default function Home() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const formatRemaining = (ms: number) => {
    const sec = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (d > 0) return `${d} д ${h} ч`;
    if (h > 0) return `${h} ч ${m} м`;
    return `${m} м ${s} с`;
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const res = await fetch("/api/auctions");
      const data = await res.json();
      setAuctions(data || []);
    } catch (error) {
      console.error("Ошибка при загрузке аукционов:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center space-x-2 group">
                <span className="text-xl font-bold text-slate-900 tracking-tight">
                    Fast<span className="text-blue-800">Auction</span>
                </span>
                </Link>
                
                <button 
                    onClick={() => setShowInfo(true)}
                    className="text-sm font-medium text-slate-500 hover:text-blue-900 transition-colors flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    О проекте
                </button>
            </div>

            <div className="flex items-center gap-4">
              <SignedIn>
                <Link
                  href="/my-auctions"
                  className="text-slate-600 hover:text-blue-900 text-sm font-medium transition-colors"
                >
                  Мои аукционы
                </Link>
                <Link
                  href="/create-auction"
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <span>+</span> Создать
                </Link>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 border-2 border-blue-100"
                    }
                  }}
                />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-slate-600 hover:text-blue-900 text-sm font-medium transition-colors">
                    Войти
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-all duration-200 shadow-md hover:shadow-lg">
                    Регистрация
                  </button>
                </SignUpButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </header>

      {/* Auctions Grid */}
      <main id="auctions" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 flex-1 w-full">
        <div className="flex justify-between items-end mb-8 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Активные лоты</h2>
            <p className="text-slate-500 text-sm mt-1">Всего доступно: {auctions.length}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50 disabled:opacity-50"
              disabled={page === 1}
            >
              ← Предыдущая
            </button>
            <span className="text-sm text-slate-500">Стр. {page}</span>
            <button
              onClick={() => {
                const totalPages = Math.max(1, Math.ceil(auctions.length / pageSize));
                setPage((p) => Math.min(totalPages, p + 1));
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50 disabled:opacity-50"
              disabled={page >= Math.ceil(auctions.length / pageSize)}
            >
              Следующая →
            </button>
          </div>
        </div>

        {auctions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Пока нет активных аукционов</h3>
            <p className="text-slate-500 text-sm mb-6">Будьте первым, кто создаст лот!</p>
            <SignedIn>
              <Link
                href="/create-auction"
                className="inline-block bg-blue-50 text-blue-700 px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
              >
                Создать аукцион
              </Link>
            </SignedIn>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {(() => {
              const now = Date.now();
              const sorted = [...auctions].sort((a, b) => {
                const aEnds = Date.parse(a.end_time);
                const bEnds = Date.parse(b.end_time);
                const aEnded = !isNaN(aEnds) && aEnds <= now || a.status !== 'active';
                const bEnded = !isNaN(bEnds) && bEnds <= now || b.status !== 'active';
                if (aEnded !== bEnded) return aEnded ? 1 : -1; // live first
                // Within each group, show newest ending sooner first
                return (aEnds || 0) - (bEnds || 0);
              });
              return sorted.slice((page - 1) * pageSize, page * pageSize).map((auction) => {
                const endsAt = Date.parse(auction.end_time);
                const isEndedByTime = !isNaN(endsAt) && endsAt <= now;
                const isActive = auction.status === 'active' && !isEndedByTime;
                return (
                  <Link
                    key={auction.id}
                    href={`/auction/${auction.id}`}
                    className={`group rounded-xl p-5 border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col relative overflow-hidden ${isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200'} ${isActive ? '' : 'opacity-90'}`}
                  >
                    {/* Status Bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${isActive ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                    {!isActive && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 bg-linear-to-br from-slate-50 to-transparent" />
                        <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-slate-200 text-slate-800 text-[10px] font-bold uppercase tracking-wide">Завершен</div>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-3 mt-1">
                        <h3 className="font-bold text-slate-900 text-lg leading-tight truncate pr-4 group-hover:text-blue-700 transition-colors">
                            {auction.title}
                        </h3>
                        <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isActive ? 'Активен' : 'Завершен'}
                        </span>
                    </div>

                    <div className="mb-4">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Текущая ставка</p>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-black tabular-nums tracking-tight ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                                {auction.current_bid.toLocaleString('ru-RU')}
                            </span>
                            <span className="text-sm font-bold text-slate-400">₽</span>
                        </div>
                        <div className="mt-2 text-[11px] text-slate-500 font-medium">
                          {isActive ? (
                            <span>
                              Осталось: {formatRemaining(endsAt - now)}
                            </span>
                          ) : (
                            <span>
                              Завершено: {new Date(endsAt).toLocaleDateString('ru-RU')} {new Date(endsAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                    </div>
                      
                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-700'}`}>
                                {auction.user?.name?.[0] || 'U'}
                            </div>
                            <span className="text-xs text-slate-500 font-medium truncate max-w-[100px]">
                                {auction.user?.name || "Аноним"}
                            </span>
                        </div>
                        {isActive ? (
                          <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                            Сделать ставку →
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-500">Завершено</span>
                        )}
                    </div>
                  </Link>
                );
              });
            })()}
          </div>
        )}

        <div className="mt-8 flex justify-center items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50 disabled:opacity-50"
            disabled={page === 1}
          >
            ← Предыдущая
          </button>
          <span className="text-sm text-slate-500">Страница {page} из {Math.max(1, Math.ceil(auctions.length / pageSize))}</span>
          <button
            onClick={() => {
              const totalPages = Math.max(1, Math.ceil(auctions.length / pageSize));
              setPage((p) => Math.min(totalPages, p + 1));
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50 disabled:opacity-50"
            disabled={page >= Math.ceil(auctions.length / pageSize)}
          >
            Следующая →
          </button>
        </div>
      </main>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowInfo(false)}></div>
            <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-slate-900 p-6 text-white flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold">Информация о проекте</h2>
                        <p className="text-slate-400 text-sm mt-1">Учебная работа</p>
                    </div>
                    <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Студент</p>
                                <p className="text-lg font-bold text-slate-900">Aboubacar Kaba</p>
                                <p className="text-slate-600">Группа: <span className="font-medium text-blue-700">М24-ИСТ-3</span></p>
                            </div>
                        </div>
                        
                        <div className="h-px bg-slate-100"></div>

                        <div className="flex items-start gap-4">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Университет</p>
                                <p className="text-base font-bold text-slate-900">НГТУ им. Р.Е. Алексеева</p>
                                <p className="text-sm text-slate-600 mt-1">Кафедра «Компьютерные технологии в проектировании и производстве»</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600">
                        <p>Проект разработан с использованием <strong>Next.js 15</strong>, <strong>Supabase Realtime</strong> , <strong>TailwindCSS</strong> <strong>итд...</strong></p>
                    </div>

                    <button 
                        onClick={() => setShowInfo(false)}
                        className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-blue-900 transition-colors"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
