import React, { useState } from 'react';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/Avatar';
import { PageId } from '../components/Navigation';

interface AdminDashboardProps {
  onNavigate: (page: PageId, params?: Record<string, any>) => void;
}

interface Lead {
  id: number;
  n: string;
  age: number;
  gn: string;
  ph: string;
  src: string;
  prog: string;
  by: string;
  status: string;
  trialDate?: string;
  evalRating?: number;
  evalText?: string;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'players' | 'leads' | 'sched' | 'coaches' | 'pay' | 'tasks' | 'settings'
  >('overview');

  const [players, setPlayers] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});

  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerStatusFilter, setPlayerStatusFilter] = useState('all');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');

  const [prices, setPrices] = useState({ m: 800, q: 2160, y: 7200 });
  const [groupCaps, setGroupCaps] = useState({ u10: 15, m: 20, o: 15 });
  const [graceDays, setGraceDays] = useState(7);

  const getGroupName = (age: number) => {
    if (age < 10) return 'تحت 10';
    if (age <= 14) return '10 – 14';
    return '15 فما فوق';
  };

  const getPlanName = (p: string) => {
    if (p === 'm') return 'شهري';
    if (p === 'q') return '3 شهور';
    return 'سنوي';
  };

  const cycleAttendance = (playerId: number) => {
    const cycle = ['', 'p', 'a', 'l', 'e'];
    const current = attendance[playerId] || '';
    const nextIdx = (cycle.indexOf(current) + 1) % cycle.length;
    setAttendance((prev) => ({
      ...prev,
      [playerId]: cycle[nextIdx],
    }));
  };

  const handleRenewPlayer = (id: number) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'ok',
              end: '2026-11-25',
              trial: false,
            }
          : p
      )
    );
    alert('تم تجديد الاشتراك بنجاح وتسجيل المعاملة');
  };

  const navItems = [
    { key: 'overview', label: 'نظرة عامة', icon: 'home' },
    { key: 'players', label: 'اللاعبين', icon: 'users' },
    { key: 'leads', label: 'الاستفسارات', icon: 'phone' },
    { key: 'sched', label: 'الجدول والحضور', icon: 'cal' },
    { key: 'coaches', label: 'المدربين', icon: 'whistle' },
    { key: 'pay', label: 'المدفوعات', icon: 'coin' },
    { key: 'tasks', label: 'التنبيهات والمهام', icon: 'bell' },
    { key: 'settings', label: 'الإعدادات', icon: 'gear' },
  ];

  return (
    <div className="max-w-[1180px] mx-auto px-4 md:px-7 py-4 pb-[calc(var(--bar)+30px)] lg:pb-12">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge">أكاديمية معتمدة</span>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">
              {(() => {
                try {
                  const u = JSON.parse(localStorage.getItem('rabona_user') || 'null');
                  if (u?.academyName) return `${u.academyName} · لوحة الإدارة`;
                } catch {}
                return 'لوحة إدارة الأكاديمية';
              })()}
            </h1>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            إدارة المشتركين والمدربين والجدول المالي
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="btn ghost h-9 px-3.5 text-xs font-bold"
        >
          الرجوع للمنصة
        </button>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-6 border-b border-[var(--line)]">
        {navItems.map((n) => (
          <button
            key={n.key}
            type="button"
            onClick={() => setActiveTab(n.key as any)}
            className={`h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === n.key
                ? 'bg-[var(--green)] text-[#04170B] font-bold shadow-md'
                : 'bg-[var(--surface)] text-[var(--muted)] hover:text-white border border-[var(--line)]'
            }`}
          >
            <Icon name={n.icon} className="w-4 h-4" />
            {n.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Top KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5">
              <small className="text-[var(--muted)] text-xs flex items-center gap-1.5">
                <Icon name="users" className="w-4 h-4 text-[var(--green)]" />
                لاعبين نشطين
              </small>
              <span className="num block text-2xl font-extrabold text-white mt-1">
                {players.filter((p) => p.status === 'ok').length}
                <i className="not-italic text-xs font-normal text-[var(--muted)] ms-1">
                  من {players.length}
                </i>
              </span>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5">
              <small className="text-[var(--muted)] text-xs flex items-center gap-1.5">
                <Icon name="coin" className="w-4 h-4 text-[var(--green)]" />
                صافي الإيراد
              </small>
              <span className="num block text-2xl font-extrabold text-white mt-1">
                {players.reduce((sum, p) => sum + (prices[p.plan as keyof typeof prices] || 800), 0).toLocaleString()}
                <i className="not-italic text-xs font-normal text-[var(--muted)] ms-1">
                  ج
                </i>
              </span>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5">
              <small className="text-[var(--muted)] text-xs flex items-center gap-1.5">
                <Icon name="clock" className="w-4 h-4 text-[var(--amber)]" />
                قرب ينتهي
              </small>
              <span className="num block text-2xl font-extrabold text-[var(--amber)] mt-1">
                {players.filter((p) => p.status === 'soon').length}
              </span>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5">
              <small className="text-[var(--muted)] text-xs flex items-center gap-1.5">
                <Icon name="gift" className="w-4 h-4 text-[var(--green)]" />
                تجريبي
              </small>
              <span className="num block text-2xl font-extrabold text-white mt-1">
                {players.filter((p) => p.trial).length}
              </span>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5">
              <small className="text-[var(--muted)] text-xs flex items-center gap-1.5">
                <Icon name="phone" className="w-4 h-4 text-[var(--green)]" />
                استفسارات
              </small>
              <span className="num block text-2xl font-extrabold text-white mt-1">
                {leads.length}
              </span>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5">
              <small className="text-[var(--muted)] text-xs flex items-center gap-1.5">
                <Icon name="whistle" className="w-4 h-4 text-[var(--green)]" />
                مدربين
              </small>
              <span className="num block text-2xl font-extrabold text-white mt-1">
                {coaches.length}
              </span>
            </div>
          </div>

          {/* Revenue Chart & Today's Sessions */}
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
            <section className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4">
              <h2 className="text-base font-bold text-white mb-3">
                صافي الإيراد آخر 6 شهور
              </h2>
              <div className="chart flex items-end gap-2.5 h-[170px] direction-ltr pt-4">
                {[
                  { m: 'مايو', v: 17200, pct: 50 },
                  { m: 'يونيو', v: 19800, pct: 60 },
                  { m: 'يوليو', v: 21400, pct: 70 },
                  { m: 'أغسطس', v: 20600, pct: 68 },
                  { m: 'سبتمبر', v: 22800, pct: 78 },
                  { m: 'أكتوبر', v: 24300, pct: 90 },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex-1 h-full flex flex-col justify-end items-center gap-1.5"
                  >
                    <small className="num text-[11px] text-[var(--muted)] font-['Montserrat',sans-serif]">
                      {Math.round(item.v / 1000)}k
                    </small>
                    <i
                      className={`block w-full rounded-t-[5px] transition-all ${
                        idx === 5 ? 'bg-[var(--green)]' : 'bg-[var(--line)]'
                      }`}
                      style={{ height: `${item.pct}%` }}
                    />
                    <small className="text-[11px] text-[var(--muted)]">{item.m}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-white mb-3">حصص اليوم</h2>
                <div className="space-y-2.5">
                  <div className="p-4 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-center text-xs text-[var(--muted)]">
                    لا توجد حصص مجدولة اليوم
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--line)] flex justify-between items-center text-xs text-[var(--muted)]">
                <span>إجمالي الحضور المتوقع: 0 لاعب</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('sched')}
                  className="text-[var(--green)] font-bold hover:underline"
                >
                  عرض الجدول الأسبوعي
                </button>
              </div>
            </section>
          </div>

          {/* Need Renewal Alert list */}
          <section className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4">
            <h2 className="text-base font-bold text-white mb-3">
              اشتراكات تحتاج تجديد قريباً
            </h2>
            <div className="divide-y divide-[var(--line)]">
              {players.filter((p) => p.status === 'soon' || p.status === 'end').length === 0 ? (
                <div className="text-center py-6 text-xs text-[var(--muted)]">
                  لا توجد اشتراكات تحتاج تجديد حالياً.
                </div>
              ) : (
                players
                  .filter((p) => p.status === 'soon' || p.status === 'end')
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-2.5 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={p.n} seed={p.id + 3} size={40} />
                        <div>
                          <b className="block text-sm text-white font-bold">{p.n}</b>
                          <small className="text-xs text-[var(--muted)]">
                            ينتهي: {p.end} · {p.ph}
                          </small>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold ${
                            p.status === 'end'
                              ? 'bg-[rgba(255,82,82,0.14)] text-[var(--err)]'
                              : 'bg-[rgba(255,176,32,0.15)] text-[var(--amber)]'
                          }`}
                        >
                          {p.status === 'end' ? 'منتهي' : 'قرب ينتهي'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRenewPlayer(p.id)}
                          className="btn h-8 px-3 text-xs font-bold"
                        >
                          تجديد
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* ── Tab: Players ── */}
      {activeTab === 'players' && (
        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4">
          {/* Tools: Search and Status Filter */}
          <div className="flex flex-wrap gap-2.5 mb-4">
            <input
              type="search"
              placeholder="ابحث باسم اللاعب أو رقم الموبايل"
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              className="flex-1 min-w-[200px] h-11 px-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-sm text-white outline-none focus:border-[var(--green)]"
            />
            <select
              value={playerStatusFilter}
              onChange={(e) => setPlayerStatusFilter(e.target.value)}
              className="h-11 px-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-sm text-white outline-none"
            >
              <option value="all">كل الحالات</option>
              <option value="ok">نشط</option>
              <option value="soon">قرب يخلص</option>
              <option value="end">منتهي</option>
              <option value="try">تجريبي</option>
            </select>
          </div>

          {/* Players Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-[var(--line)] text-xs text-[var(--muted)] font-medium">
                  <th className="p-2.5 text-start">اللاعب</th>
                  <th className="p-2.5 text-start">السن</th>
                  <th className="p-2.5 text-start">المجموعة</th>
                  <th className="p-2.5 text-start">الباقة</th>
                  <th className="p-2.5 text-start">ينتهي في</th>
                  <th className="p-2.5 text-start">الحالة</th>
                  <th className="p-2.5 text-end">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] text-sm">
                {players.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[var(--muted)]">
                      لا يوجد لاعبين مسجلين حتى الآن.
                    </td>
                  </tr>
                ) : (
                  players
                    .filter(
                      (p) =>
                        (playerStatusFilter === 'all' || p.status === playerStatusFilter) &&
                        (p.n + p.ph).includes(playerSearch)
                    )
                    .map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--surface2)] transition-colors">
                      <td className="p-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={p.n} seed={p.id + 3} size={36} />
                          <div>
                            <b className="block text-white font-bold">{p.n}</b>
                            <small className="text-xs text-[var(--muted)]">{p.ph}</small>
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5 font-['Montserrat',sans-serif] text-white">
                        {p.age}
                      </td>
                      <td className="p-2.5 text-[var(--muted)]">{getGroupName(p.age)}</td>
                      <td className="p-2.5 text-white">
                        {p.trial ? 'حصة تجريبية' : getPlanName(p.plan)}
                      </td>
                      <td className="p-2.5 font-['Montserrat',sans-serif] text-xs text-[var(--muted)]">
                        {p.end}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`text-[11.5px] font-bold px-2 py-0.5 rounded ${
                            p.status === 'ok'
                              ? 'bg-[rgba(0,200,83,0.14)] text-[var(--green)]'
                              : p.status === 'soon'
                              ? 'bg-[rgba(255,176,32,0.15)] text-[var(--amber)]'
                              : p.status === 'end'
                              ? 'bg-[rgba(255,82,82,0.14)] text-[var(--err)]'
                              : 'bg-[var(--surface2)] text-[var(--muted)]'
                          }`}
                        >
                          {p.status === 'ok'
                            ? 'نشط'
                            : p.status === 'soon'
                            ? 'قرب يخلص'
                            : p.status === 'end'
                            ? 'منتهي'
                            : 'تجريبي'}
                        </span>
                      </td>
                      <td className="p-2.5 text-end">
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleRenewPlayer(p.id)}
                            className="btn sm h-8 px-2.5 text-xs font-bold"
                          >
                            تجديد
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedPlayer(p)}
                            className="btn sm ghost h-8 px-2.5 text-xs font-bold"
                          >
                            الملف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Tab: Leads & Trials CRM ── */}
      {activeTab === 'leads' && (
        <section className="space-y-4">
          {/* Status chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { k: 'all', l: 'الكل' },
              { k: 'new', l: 'جديد' },
              { k: 'contacted', l: 'تم التواصل' },
              { k: 'trial_s', l: 'تجربة محجوزة' },
              { k: 'trial_d', l: 'تمت التجربة' },
            ].map((f) => (
              <button
                key={f.k}
                type="button"
                onClick={() => setLeadStatusFilter(f.k)}
                className={`h-8 px-3.5 rounded-full text-xs font-medium border transition-colors ${
                  leadStatusFilter === f.k
                    ? 'bg-[var(--green)] border-[var(--green)] text-[#04170B] font-bold'
                    : 'bg-[var(--surface)] border-[var(--line)] text-[var(--muted)]'
                }`}
              >
                {f.l}
              </button>
            ))}
          </div>

          <div className="grid gap-3">
            {leads.length === 0 ? (
              <div className="text-center py-10 text-[var(--muted)] border border-dashed border-[var(--line)] rounded-xl">
                لا توجد استفسارات مسجلة حتى الآن.
              </div>
            ) : (
              leads
                .filter(
                  (l) => leadStatusFilter === 'all' || l.status === leadStatusFilter
                )
                .map((l) => (
                <div
                  key={l.id}
                  className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-white font-bold text-base">{l.n}</b>
                      <span className="text-xs text-[var(--muted)]">
                        {l.age} سنة · {l.prog}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--muted)] mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                      <span>ولي الأمر: {l.gn}</span>
                      <span>الموبايل: {l.ph}</span>
                      <span>المصدر: {l.src}</span>
                      <span>المسؤول: {l.by}</span>
                    </div>
                    {l.trialDate && (
                      <div className="text-xs text-[var(--green)] mt-1 font-bold">
                        موعد الحصة التجريبية: {l.trialDate}
                      </div>
                    )}
                    {l.evalText && (
                      <div className="text-xs text-[#cfcfcf] mt-1 bg-[var(--surface2)] p-2 rounded-lg">
                        تقييم المدرب ({l.evalRating}/5): {l.evalText}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 self-end md:self-center">
                    {l.status === 'new' && (
                      <button
                        type="button"
                        onClick={() => {
                          setLeads((prev) =>
                            prev.map((x) =>
                              x.id === l.id ? { ...x, status: 'contacted' } : x
                            )
                          );
                        }}
                        className="btn ghost h-8 px-3 text-xs font-bold"
                      >
                        تم التواصل
                      </button>
                    )}
                    {(l.status === 'new' || l.status === 'contacted') && (
                      <button
                        type="button"
                        onClick={() => {
                          const date = prompt('اكتب تاريخ التجربة (مثال: 2026-10-28):');
                          if (date) {
                            setLeads((prev) =>
                              prev.map((x) =>
                                x.id === l.id
                                  ? { ...x, status: 'trial_s', trialDate: date }
                                  : x
                              )
                            );
                          }
                        }}
                        className="btn ghost h-8 px-3 text-xs font-bold"
                      >
                        جدولة تجربة
                      </button>
                    )}
                    {l.status === 'trial_s' && (
                      <button
                        type="button"
                        onClick={() => {
                          const rating = prompt('التقييم من 1 لـ 5:');
                          const text = prompt('ملاحظات الأداء:');
                          if (rating) {
                            setLeads((prev) =>
                              prev.map((x) =>
                                x.id === l.id
                                  ? {
                                      ...x,
                                      status: 'trial_d',
                                      evalRating: Number(rating),
                                      evalText: text || '',
                                    }
                                  : x
                              )
                            );
                          }
                        }}
                        className="btn ghost h-8 px-3 text-xs font-bold"
                      >
                        تسجيل التقييم
                      </button>
                    )}
                    {l.status === 'trial_d' && (
                      <button
                        type="button"
                        onClick={() => {
                          // Convert to player
                          setPlayers((prev) => [
                            ...prev,
                            {
                              id: prev.length + 1,
                              n: l.n,
                              age: l.age,
                              ph: l.ph,
                              gn: l.gn,
                              plan: 'm',
                              status: 'ok',
                              end: '2026-11-25',
                              trial: false,
                              notes: [],
                            },
                          ]);
                          setLeads((prev) => prev.filter((x) => x.id !== l.id));
                          alert(`تم تحويل ${l.n} إلى لاعب مسجل باشتراك شهري!`);
                        }}
                        className="btn h-8 px-3 text-xs font-bold"
                      >
                        تحويل للاعب مسجل
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ── Tab: Schedule & Attendance ── */}
      {activeTab === 'sched' && (
        <section className="space-y-4">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-white">تسجيل الحضور</h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  حصة اليوم: 5:00 – 6:30 م · مجموعة تحت 10 سنين
                </p>
              </div>

              <div className="flex gap-2">
                <span className="text-xs px-2.5 py-1 rounded-md bg-[rgba(0,200,83,0.12)] text-[var(--green)] font-bold">
                  حاضر: {Object.values(attendance).filter((s) => s === 'p').length}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-md bg-[rgba(255,82,82,0.12)] text-[var(--err)] font-bold">
                  غائب: {Object.values(attendance).filter((s) => s === 'a').length}
                </span>
              </div>
            </div>

            <p className="text-xs text-[var(--muted)] mb-3">
              اضغط على كارت اللاعب لتغيير حالته (حاضر / غائب / متأخر / بعذر).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {players.filter((p) => p.age < 10).length === 0 ? (
                <div className="col-span-full text-center py-6 text-xs text-[var(--muted)] border border-dashed border-[var(--line)] rounded-xl">
                  لا يوجد لاعبين في هذه الفئة لتسجيل الحضور.
                </div>
              ) : (
                players
                  .filter((p) => p.age < 10)
                  .map((p) => {
                    const status = attendance[p.id] || '';
                    const statusLabels: Record<string, string> = {
                      p: 'حاضر',
                      a: 'غائب',
                      l: 'متأخر',
                      e: 'بعذر',
                    };

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => cycleAttendance(p.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-start transition-all ${
                          status === 'p'
                            ? 'border-[var(--green)] bg-[rgba(0,200,83,0.08)]'
                            : status === 'a'
                            ? 'border-[var(--err)] bg-[rgba(255,82,82,0.08)]'
                            : status === 'l'
                            ? 'border-[var(--amber)] bg-[rgba(255,176,32,0.08)]'
                            : 'border-[var(--line)] bg-[var(--surface2)]'
                        }`}
                      >
                        <Avatar name={p.n} seed={p.id + 3} size={36} />
                        <div className="flex-1 min-w-0">
                          <b className="block text-sm text-white font-bold truncate">
                            {p.n}
                          </b>
                          <small className="text-xs text-[var(--muted)]">
                            {p.age} سنة
                          </small>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold ${
                            status === 'p'
                              ? 'bg-[var(--green)] text-[#04170B]'
                              : status === 'a'
                              ? 'bg-[var(--err)] text-white'
                              : status === 'l'
                              ? 'bg-[var(--amber)] text-black'
                              : 'bg-[var(--line)] text-[var(--muted)]'
                          }`}
                        >
                          {statusLabels[status] || 'لم يسجل'}
                        </span>
                      </button>
                    );
                  })
              )}
            </div>
          </div>

          {/* Weekly Recurring Schedule Table */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4">
            <h2 className="text-base font-bold text-white mb-3">
              جدول الحصص الأسبوعية الثابتة
            </h2>
            <div className="text-center py-6 text-xs text-[var(--muted)]">
              لا توجد حصص أسبوعية مسجلة بعد.
            </div>
          </div>
        </section>
      )}

      {/* ── Tab: Coaches ── */}
      {activeTab === 'coaches' && (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white">المدربين والجهاز الفني</h2>
            <button
              type="button"
              onClick={() => {
                const name = prompt('اسم المدرب:');
                const role = prompt('التخصص (مثال: مدرب حراس):');
                const phone = prompt('رقم الموبايل:');
                if (name) {
                  setCoaches((prev) => [
                    ...prev,
                    {
                      id: prev.length + 1,
                      n: name,
                      r: role || 'مدرب',
                      ph: phone || '01000000000',
                      sessions: 3,
                    },
                  ]);
                }
              }}
              className="btn sm h-9 px-3.5 text-xs font-bold"
            >
              + مدرب جديد
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {coaches.length === 0 ? (
              <div className="col-span-full text-center py-10 text-[var(--muted)] border border-dashed border-[var(--line)] rounded-xl">
                لا يوجد مدربين مضافين حتى الآن. اضغط "+ مدرب جديد" لإضافة مدرب.
              </div>
            ) : (
              coaches.map((c) => (
                <div
                  key={c.id}
                  className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 text-center relative"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`هل تريد حذف ${c.n}؟`)) {
                        setCoaches((prev) => prev.filter((x) => x.id !== c.id));
                      }
                    }}
                    className="absolute top-3 start-3 text-[var(--muted)] hover:text-[var(--err)]"
                    title="حذف المدرب"
                  >
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                  <Avatar
                    name={c.n.replace('كابتن ', '')}
                    seed={c.id + 30}
                    size={64}
                    className="mx-auto"
                  />
                  <b className="block mt-2.5 text-base font-bold text-white">{c.n}</b>
                  <small className="block text-xs text-[var(--muted)] mt-0.5">
                    {c.r}
                  </small>
                  <small className="num block text-xs text-[#a0a0a0] mt-1">{c.ph}</small>
                  <span className="inline-block mt-3 text-xs bg-[var(--surface2)] px-2.5 py-1 rounded-full text-[var(--green)]">
                    {c.sessions} حصص أسبوعياً
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ── Tab: Payments & Finance ── */}
      {activeTab === 'pay' && (
        <section className="space-y-4">
          {(() => {
            const totalRev = players.reduce(
              (sum, p) => sum + (prices[p.plan as keyof typeof prices] || 800),
              0
            );
            const comm = Math.round(totalRev * 0.1);
            const net = totalRev - comm;

            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5">
                  <small className="text-[var(--muted)] text-xs">اشتراكات التطبيق</small>
                  <span className="num block text-2xl font-extrabold text-white mt-1">
                    {totalRev.toLocaleString()} ج
                  </span>
                </div>
                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5">
                  <small className="text-[var(--muted)] text-xs">عمولة رابونا (10%)</small>
                  <span className="num block text-2xl font-extrabold text-[var(--amber)] mt-1">
                    {comm.toLocaleString()} ج
                  </span>
                </div>
                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5">
                  <small className="text-[var(--muted)] text-xs">صافي المحصّل للأكاديمية</small>
                  <span className="num block text-2xl font-extrabold text-[var(--green)] mt-1">
                    {net.toLocaleString()} ج
                  </span>
                </div>
                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-3.5">
                  <small className="text-[var(--muted)] text-xs">المصروفات الشهرية</small>
                  <span className="num block text-2xl font-extrabold text-[var(--err)] mt-1">
                    0 ج
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4">
            <h2 className="text-base font-bold text-white mb-3">سجل المعاملات</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm border-collapse min-w-[550px]">
                <thead>
                  <tr className="border-b border-[var(--line)] text-xs text-[var(--muted)]">
                    <th className="p-2 text-start">اللاعب</th>
                    <th className="p-2 text-start">الباقة</th>
                    <th className="p-2 text-start">المبلغ</th>
                    <th className="p-2 text-start">العمولة</th>
                    <th className="p-2 text-start">الصافي</th>
                    <th className="p-2 text-start">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {players.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[var(--muted)]">
                        لا توجد معاملات مسجلة بعد.
                      </td>
                    </tr>
                  ) : (
                    players.map((p, i) => (
                      <tr key={i} className="hover:bg-[var(--surface2)]">
                        <td className="p-2 text-white font-bold">{p.n}</td>
                        <td className="p-2 text-[var(--muted)]">{getPlanName(p.plan)}</td>
                        <td className="p-2 font-['Montserrat',sans-serif]">800 ج</td>
                        <td className="p-2 font-['Montserrat',sans-serif] text-[var(--muted)]">
                          80 ج
                        </td>
                        <td className="p-2 font-['Montserrat',sans-serif] text-[var(--green)] font-bold">
                          720 ج
                        </td>
                        <td className="p-2">
                          <span className="text-xs bg-[rgba(0,200,83,0.12)] text-[var(--green)] px-2 py-0.5 rounded font-bold">
                            تم التحويل
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── Tab: Tasks & Alerts ── */}
      {activeTab === 'tasks' && (
        <section className="space-y-4">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-white">قائمة المهام</h2>
              <button
                type="button"
                onClick={() => {
                  const t = prompt('المهمة المطلوبة:');
                  const who = prompt('المسؤول:');
                  if (t) {
                    setTasks((prev) => [
                      ...prev,
                      {
                        id: prev.length + 1,
                        t,
                        who: who || 'الاستقبال',
                        pri: 'mid',
                        due: '2026-10-30',
                        done: false,
                      },
                    ]);
                  }
                }}
                className="btn sm h-8 px-3 text-xs font-bold"
              >
                + مهمة جديدة
              </button>
            </div>

            <div className="divide-y divide-[var(--line)]">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--muted)]">
                  لا توجد مهام أو تنبيهات معلقة.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 py-3 ${
                      task.done ? 'line-through opacity-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => {
                        setTasks((prev) =>
                          prev.map((t) =>
                            t.id === task.id ? { ...t, done: !t.done } : t
                          )
                        );
                      }}
                      className="w-5 h-5 accent-[var(--green)] rounded cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <b className="block text-sm text-white font-bold">{task.t}</b>
                      <small className="text-xs text-[var(--muted)]">
                        المسؤول: {task.who} {task.due && `· التسليم: ${task.due}`}
                      </small>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold ${
                        task.pri === 'high'
                          ? 'bg-[rgba(255,82,82,0.14)] text-[var(--err)]'
                          : 'bg-[rgba(255,176,32,0.15)] text-[var(--amber)]'
                      }`}
                    >
                      {task.pri === 'high' ? 'عالية' : 'متوسطة'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Tab: Settings ── */}
      {activeTab === 'settings' && (
        <section className="space-y-4">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4">
            <h2 className="text-base font-bold text-white mb-3">الباقات والأسعار</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">
                  الاشتراك الشهري (ج)
                </label>
                <input
                  type="number"
                  value={prices.m}
                  onChange={(e) =>
                    setPrices({ ...prices, m: Number(e.target.value) })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-white outline-none focus:border-[var(--green)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">
                  اشتراك 3 شهور (ج)
                </label>
                <input
                  type="number"
                  value={prices.q}
                  onChange={(e) =>
                    setPrices({ ...prices, q: Number(e.target.value) })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-white outline-none focus:border-[var(--green)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">
                  الاشتراك السنوي (ج)
                </label>
                <input
                  type="number"
                  value={prices.y}
                  onChange={(e) =>
                    setPrices({ ...prices, y: Number(e.target.value) })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-white outline-none focus:border-[var(--green)]"
                />
              </div>
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4">
            <h2 className="text-base font-bold text-white mb-3">سعة المجموعات</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">
                  تحت 10 سنين
                </label>
                <input
                  type="number"
                  value={groupCaps.u10}
                  onChange={(e) =>
                    setGroupCaps({ ...groupCaps, u10: Number(e.target.value) })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-white outline-none focus:border-[var(--green)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">
                  من 10 لـ 14 سنة
                </label>
                <input
                  type="number"
                  value={groupCaps.m}
                  onChange={(e) =>
                    setGroupCaps({ ...groupCaps, m: Number(e.target.value) })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-white outline-none focus:border-[var(--green)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--muted)] mb-1">
                  15 فما فوق
                </label>
                <input
                  type="number"
                  value={groupCaps.o}
                  onChange={(e) =>
                    setGroupCaps({ ...groupCaps, o: Number(e.target.value) })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[var(--surface2)] border border-[var(--line)] text-white outline-none focus:border-[var(--green)]"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Player Profile Details Modal */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={selectedPlayer.n} seed={selectedPlayer.id + 3} size={50} />
              <div>
                <h3 className="text-lg font-bold text-white">{selectedPlayer.n}</h3>
                <p className="text-xs text-[var(--muted)]">
                  {selectedPlayer.age} سنة · {getGroupName(selectedPlayer.age)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4 bg-[var(--surface2)] p-3 rounded-xl border border-[var(--line)]">
              <div>
                <span className="text-[var(--muted)] block">ولي الأمر:</span>
                <span className="text-white font-bold">{selectedPlayer.gn}</span>
              </div>
              <div>
                <span className="text-[var(--muted)] block">الموبايل:</span>
                <span className="text-white font-bold">{selectedPlayer.ph}</span>
              </div>
              <div>
                <span className="text-[var(--muted)] block">الباقة:</span>
                <span className="text-white font-bold">
                  {getPlanName(selectedPlayer.plan)}
                </span>
              </div>
              <div>
                <span className="text-[var(--muted)] block">تاريخ الانتهاء:</span>
                <span className="text-white font-bold">{selectedPlayer.end}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleRenewPlayer(selectedPlayer.id);
                  setSelectedPlayer(null);
                }}
                className="btn flex-1 text-xs font-bold"
              >
                تجديد الاشتراك
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="btn ghost flex-1 text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
