"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

type Auction = {
  id: string;
  title: string;
  description?: string;
  start_price: number;
  current_bid: number;
  end_time: string;
  status: string;
};

type UpdateAuctionPayload = {
  title: string;
  description: string;
  endTime?: string;
};

export default function MyAuctionsPage() {
  const { user, isLoaded } = useUser();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; end_time: string }>({ title: "", description: "", end_time: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMine = async () => {
    try {
      const res = await fetch("/api/auctions?mine=1");
      if (!res.ok) throw new Error("Требуется авторизация или ошибка сервера");
      const data = await res.json();
      setAuctions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("Не удалось загрузить ваши аукционы");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchMine();
  }, [isLoaded, user]);

  const startEdit = (a: Auction) => {
    setEditingId(a.id);
    setForm({ title: a.title, description: a.description || "", end_time: new Date(a.end_time).toISOString().slice(0, 16) });
    setError("");
    setSuccess("");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    try {
      setError("");
      setSuccess("");
      const payload: UpdateAuctionPayload = { title: form.title, description: form.description };
      if (form.end_time) {
        // Convert local input value (yyyy-MM-ddTHH:mm) to ISO
        const iso = new Date(form.end_time).toISOString();
        payload.endTime = iso;
      }
      const res = await fetch(`/api/auctions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка при сохранении изменений");
      }
      setSuccess("Изменения сохранены");
      setEditingId(null);
      fetchMine();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
      setError(msg);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить этот аукцион? Это действие необратимо.")) return;
    try {
      setError("");
      setSuccess("");
      const res = await fetch(`/api/auctions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка при удалении");
      }
      setAuctions((prev) => prev.filter((x) => x.id !== id));
      setSuccess("Аукцион удален");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
      setError(msg);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-bold">
                ← На главную
              </Link>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Мои аукционы</h1>
            </div>
            <Link href="/create-auction" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2">
              <span>+</span> Создать
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 flex-1 w-full">
        <SignedOut>
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <p className="mb-4 text-slate-600">Войдите, чтобы управлять своими аукционами.</p>
            <SignInButton mode="modal">
              <button className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-800 transition">Войти</button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : auctions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                <p className="text-slate-600 mb-4">Вы еще не создали ни одного аукциона.</p>
                <Link href="/create-auction" className="inline-block bg-blue-900 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-800 transition-all shadow-md hover:shadow-lg">Создать аукцион</Link>
            </div>
          ) : (
            <div className="space-y-6">
              {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-100 text-sm">{error}</div>}
              {success && <div className="p-3 rounded-lg bg-green-50 text-green-700 border border-green-100 text-sm">{success}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {auctions.map((a) => {
                  const endsAt = new Date(a.end_time);
                  const ended = endsAt.getTime() <= Date.now() || a.status !== "active";
                  const isEditing = editingId === a.id;
                  return (
                    <div
                      key={a.id}
                      className={`group rounded-xl p-5 border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col relative overflow-hidden ${ended ? 'bg-slate-50 border-slate-200 opacity-90' : 'bg-white border-slate-200'}`}
                    >
                      {/* Status Bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${ended ? 'bg-slate-300' : 'bg-blue-600'}`}></div>

                      {/* Header */}
                      <div className="flex justify-between items-start mb-3 mt-1">
                        {isEditing ? (
                          <input
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        ) : (
                          <h3 className="font-bold text-slate-900 text-lg leading-tight truncate pr-4 group-hover:text-blue-700 transition-colors">{a.title}</h3>
                        )}
                        <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${ended ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'}`}>
                          {ended ? 'Завершен' : 'Активен'}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="space-y-3">
                        {isEditing ? (
                          <textarea
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                            placeholder="Описание"
                          />
                        ) : (
                          <p className="text-sm text-slate-600 line-clamp-3">{a.description || 'Нет описания'}</p>
                        )}

                        <div className="text-xs text-slate-500 grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Начальная цена</p>
                            <span className="text-base font-black tabular-nums tracking-tight text-slate-900">{a.start_price.toFixed(2)}</span>
                            <span className="text-xs font-bold text-slate-400 ml-1">₽</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Текущая ставка</p>
                            <span className="text-base font-black tabular-nums tracking-tight text-slate-900">{a.current_bid.toFixed(2)}</span>
                            <span className="text-xs font-bold text-slate-400 ml-1">₽</span>
                          </div>
                          <div className="col-span-2 mt-1 text-[11px] text-slate-500 font-medium">
                            {ended ? (
                              <span>
                                Завершено: {endsAt.toLocaleDateString('ru-RU')} {endsAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span>
                                Завершение: {endsAt.toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>

                        {isEditing && (
                          <div className="space-y-2">
                            <label className="block text-xs text-slate-500">Изменить дату/время окончания</label>
                            <input
                              type="datetime-local"
                              value={form.end_time}
                              onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button onClick={() => cancelEdit()} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50">Отмена</button>
                            <button onClick={() => saveEdit(a.id)} className="px-3 py-2 rounded-lg bg-blue-900 text-white text-sm hover:bg-blue-800">Сохранить</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(a)} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm hover:bg-slate-50">Редактировать</button>
                            <button onClick={() => remove(a.id)} className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">Удалить</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SignedIn>
      </main>
    </div>
  );
}
