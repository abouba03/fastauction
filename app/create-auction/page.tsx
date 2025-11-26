// app/create-auction/page.tsx

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Preset = { id: string; label: string; minutes?: number; hours?: number; days?: number };

const PRESETS: Preset[] = [
  { id: "5m", label: "+ 5 мин", minutes: 5 },
  { id: "10m", label: "+ 10 мин", minutes: 10 },
  { id: "30m", label: "+ 30 мин", minutes: 30 },
  { id: "1h", label: "+ 1 ч", hours: 1 },
  { id: "24h", label: "+ 24 ч", hours: 24 },
  { id: "3d", label: "+ 3 дн", days: 3 },
  { id: "7d", label: "+ 7 дн", days: 7 },
  { id: "custom", label: "Свой выбор" },
];

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function addDuration(now: Date, p?: Preset) {
  const d = new Date(now);
  if (!p) return d;
  if (p.minutes) d.setMinutes(d.getMinutes() + p.minutes);
  if (p.hours) d.setHours(d.getHours() + p.hours);
  if (p.days) d.setDate(d.getDate() + p.days);
  return d;
}

function relative(date: Date) {
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "сейчас";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `через ${mins} мин`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `через ${hours} ч`;
  const days = Math.floor(hours / 24);
  return `через ${days} дн`;
}

export default function CreateAuctionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [presetId, setPresetId] = useState<string>("1h");
  const [customEnd, setCustomEnd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedPreset = useMemo(() => PRESETS.find(p => p.id === presetId), [presetId]);
  const computedEndLocal = useMemo(() => {
    if (presetId === "custom" && customEnd) return customEnd;
    const end = addDuration(new Date(), selectedPreset);
    return toLocalInputValue(end);
  }, [presetId, customEnd, selectedPreset]);

  const endDateObj = useMemo(() => new Date(computedEndLocal), [computedEndLocal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validations
    if (!title || title.trim().length < 3) {
      setError("Заголовок должен содержать не менее 3 символов");
      return;
    }
    const price = parseFloat(startPrice);
    if (isNaN(price) || price <= 0) {
      setError("Начальная цена должна быть больше 0");
      return;
    }
    const endIso = new Date(computedEndLocal).toISOString();
    if (Date.parse(endIso) <= Date.now() + 60_000) {
      setError("Время окончания должно быть не менее чем через минуту");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          startPrice: price,
          endTime: endIso,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ошибка при создании аукциона");
        return;
      }

      const auction = await res.json();
      router.push(`/auction/${auction.id}`);
    } catch (error) {
      console.error("Ошибка:", error);
      setError("Ошибка сервера");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Создать новый аукцион</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">Заполните детали вашего лота, установите начальную цену и время окончания торгов.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-8">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Название лота</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Винтажная камера Leica M3" 
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите состояние, комплектацию и особенности товара..."
                  rows={6}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* Pricing */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Начальная цена (₽)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={startPrice}
                    onChange={(e) => setStartPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 pr-12 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₽</span>
                </div>
              </div>

              {/* End time presets */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700">Длительность аукциона</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PRESETS.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPresetId(p.id)}
                      className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                        presetId === p.id
                          ? "bg-blue-900 text-white shadow-md shadow-blue-900/20 scale-[1.02]"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className={`transition-all duration-300 overflow-hidden ${presetId === 'custom' ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-slate-500 mb-2">Точное время завершения</label>
                    <input
                      type="datetime-local"
                      value={computedEndLocal}
                      onChange={(e) => {
                        setPresetId("custom");
                        setCustomEnd(e.target.value);
                      }}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>Завершение: <span className="font-semibold text-slate-900">{endDateObj.toLocaleString('ru-RU')}</span> ({relative(endDateObj)})</span>
                </div>
              </div>
            </form>
          </div>

          {/* Preview / Summary */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Предпросмотр</h3>
                
                <div className="space-y-4 text-sm">
                  <div className="pb-4 border-b border-slate-100">
                    <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Название</span>
                    <span className="font-medium text-slate-900 block wrap-break-word">{title || "—"}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Начальная цена</span>
                    <span className="font-bold text-slate-900 text-lg">{startPrice ? parseFloat(startPrice).toFixed(2) : "0.00"} ₽</span>
                  </div>
                  
                  <div>
                    <span className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Окончание</span>
                    <span className="font-medium text-slate-900">{endDateObj.toLocaleString('ru-RU')}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`mt-8 w-full rounded-xl px-6 py-4 font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    loading 
                      ? "bg-slate-400 cursor-not-allowed shadow-none" 
                      : "bg-linear-to-r from-blue-900 to-blue-700 hover:shadow-blue-900/25"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Создание...
                    </span>
                  ) : "Опубликовать аукцион"}
                </button>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800 border border-blue-100">
                <p>💡 После публикации аукцион станет доступен всем пользователям в реальном времени.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
