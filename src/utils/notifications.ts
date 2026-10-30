export interface NotificationItem {
  id: string;
  t: 'training' | 'payment' | 'match' | 'store' | 'news';
  title: string;
  body: string;
  m?: number;
  un?: boolean | number;
  ts?: number;
  href?: string;
  go?: string;
}

export const NOTIFICATION_TYPES: Record<
  string,
  { l: string; i: string; c: string }
> = {
  training: { l: 'التمارين', i: 'clock', c: '' },
  payment: { l: 'المدفوعات', i: 'card', c: 'am' },
  match: { l: 'المباريات', i: 'ball', c: '' },
  store: { l: 'المتجر', i: 'bag', c: 'am' },
  news: { l: 'إعلانات', i: 'mega', c: 'gr' },
};

export const NOTIF_SEED: NotificationItem[] = [];

const STORAGE_KEY = 'rabona_notif';

export interface NotifState {
  t0: number;
  read: Record<string, boolean>;
  del: Record<string, boolean>;
}

export function loadNotifState(): NotifState {
  const defaultState: NotifState = {
    t0: Date.now(),
    read: {},
    del: {},
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveNotifState(defaultState);
      return defaultState;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const state = {
        t0: Number(parsed.t0) || defaultState.t0,
        read: parsed.read || {},
        del: parsed.del || {},
      };
      return state;
    }
  } catch {
    // fallback
  }

  saveNotifState(defaultState);
  return defaultState;
}

export function saveNotifState(state: NotifState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('rabona_notif_changed'));
  } catch {
    // ignore quota errors
  }
}

export function getAllNotifications(state?: NotifState): (NotificationItem & { ts: number; un: boolean })[] {
  const S = state || loadNotifState();
  const base: (NotificationItem & { ts: number; un: boolean })[] = NOTIF_SEED.map((n) => ({
    ...n,
    ts: S.t0 - (n.m || 0) * 60000,
    un: Boolean(n.un),
  }));

  // Orders integration from rabona_orders
  try {
    const ordersRaw = localStorage.getItem('rabona_orders');
    if (ordersRaw) {
      const orders = JSON.parse(ordersRaw);
      if (Array.isArray(orders)) {
        orders.forEach((o: any) => {
          base.push({
            id: 'o-' + (o.no || Math.random()),
            t: 'store',
            title: 'تم استلام طلبك ' + (o.no || ''),
            body: `هنكلمك لتأكيد التوصيل. عدد القطع ${o.n || 1}.`,
            ts: Date.parse(o.d) || S.t0,
            un: true,
            href: '#orders',
            go: 'طلباتي',
          });
        });
      }
    }
  } catch {
    // ignore
  }

  return base
    .filter((n) => !S.del[n.id])
    .map((n) => {
      const r = S.read[n.id];
      return {
        ...n,
        un: r === undefined ? n.un : !r,
      };
    })
    .sort((a, b) => b.ts - a.ts);
}

export function getUnreadCount(): number {
  return getAllNotifications().filter((n) => n.un).length;
}

export function formatRelativeTime(ts: number): string {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (m < 1) return 'الآن';
  if (m < 60) {
    if (m === 1) return 'منذ دقيقة';
    if (m === 2) return 'منذ دقيقتين';
    return `منذ ${m} ${m <= 10 ? 'دقائق' : 'دقيقة'}`;
  }
  const h = Math.floor(m / 60);
  if (h < 24) {
    if (h === 1) return 'منذ ساعة';
    if (h === 2) return 'منذ ساعتين';
    return `منذ ${h} ${h <= 10 ? 'ساعات' : 'ساعة'}`;
  }
  const d = Math.floor(h / 24);
  if (d === 1) return 'أمس';
  if (d === 2) return 'منذ يومين';
  return `منذ ${d} ${d <= 10 ? 'أيام' : 'يوم'}`;
}

export function getDayGroupKey(ts: number): 0 | 1 | 2 {
  const a = new Date(ts);
  const b = new Date();
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  const diffDays = Math.round((b.getTime() - a.getTime()) / 864e5);
  if (diffDays <= 0) return 0;
  if (diffDays === 1) return 1;
  return 2;
}
