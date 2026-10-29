import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../components/Icons';
import {
  loadNotifState,
  saveNotifState,
  getAllNotifications,
  formatRelativeTime,
  getDayGroupKey,
  NOTIFICATION_TYPES,
  NotificationItem,
} from '../utils/notifications';

interface NotificationsPageProps {
  onNavigate?: (page: any, params?: Record<string, any>) => void;
}

const DAYS = ['اليوم', 'أمس', 'أقدم'];

export function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  const [filter, setFilter] = useState<string>('all');
  const [toastMsg, setToastMsg] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [, setTick] = useState<number>(0);

  // Trigger toast
  const triggerToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  }, []);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [showToast]);

  // Update relative time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Listen to changes from other tabs/events
  useEffect(() => {
    const handleNotifChange = () => {
      setTick((t) => t + 1);
    };
    window.addEventListener('rabona_notif_changed', handleNotifChange);
    return () => window.removeEventListener('rabona_notif_changed', handleNotifChange);
  }, []);

  const allList = getAllNotifications();
  const unreadCount = allList.filter((n) => n.un).length;
  const hasReadItems = allList.some((n) => !n.un);

  // Toggle read status of a notification
  const handleToggleRead = (id: string) => {
    const current = allList.find((x) => x.id === id);
    if (!current) return;
    const s = loadNotifState();
    s.read[id] = current.un ? true : false;
    saveNotifState(s);
    setTick((t) => t + 1);
  };

  // Delete single notification
  const handleDelete = (id: string) => {
    const s = loadNotifState();
    s.del[id] = true;
    saveNotifState(s);
    setTick((t) => t + 1);
    triggerToast('تم حذف الإشعار');
  };

  // Mark all as read
  const handleReadAll = () => {
    const s = loadNotifState();
    allList.forEach((n) => {
      if (n.un) {
        s.read[n.id] = true;
      }
    });
    saveNotifState(s);
    setTick((t) => t + 1);
    triggerToast('تم تعليم الكل كمقروء');
  };

  // Clear read notifications
  const handleClearRead = () => {
    const s = loadNotifState();
    allList.forEach((n) => {
      if (!n.un) {
        s.del[n.id] = true;
      }
    });
    saveNotifState(s);
    setTick((t) => t + 1);
    triggerToast('تم مسح الإشعارات المقروءة');
  };

  // Count by category
  const getCount = (k: string) => {
    if (k === 'all') return allList.length;
    if (k === 'unread') return unreadCount;
    return allList.filter((n) => n.t === k).length;
  };

  const tabs: [string, string][] = [
    ['all', 'الكل'],
    ['unread', 'غير مقروء'],
    ...Object.entries(NOTIFICATION_TYPES).map(([k, v]) => [k, v.l] as [string, string]),
  ];

  const filteredList = allList.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return n.un;
    return n.t === filter;
  });

  // Group notifications by day
  const groupedByDay: { day: string; items: typeof filteredList }[] = [];
  let currentDayGroup = -1;

  filteredList.forEach((n) => {
    const g = getDayGroupKey(n.ts);
    if (g !== currentDayGroup) {
      currentDayGroup = g;
      groupedByDay.push({
        day: DAYS[g],
        items: [n],
      });
    } else {
      groupedByDay[groupedByDay.length - 1].items.push(n);
    }
  });

  return (
    <main className="wrap-notif">
      {/* ── Page Header ── */}
      <div className="head">
        <h1 className="h">
          الإشعارات{' '}
          {unreadCount > 0 && (
            <span className="badge" id="unreadBadge">
              {unreadCount} جديد
            </span>
          )}
        </h1>
        <div className="acts">
          <button
            type="button"
            className="btn ghost sm"
            id="readAll"
            onClick={handleReadAll}
            disabled={unreadCount === 0}
          >
            <Icon name="check" style={{ width: 18, height: 18 }} />
            قراءة الكل
          </button>
          <button
            type="button"
            className="btn ghost sm"
            id="clearRead"
            onClick={handleClearRead}
            disabled={!hasReadItems}
          >
            <Icon name="trash" style={{ width: 18, height: 18 }} />
            مسح المقروء
          </button>
        </div>
      </div>

      {/* ── Filter Chips ── */}
      <div className="chips" role="group" aria-label="تصفية الإشعارات">
        {tabs.map(([k, label]) => {
          const isPressed = filter === k;
          return (
            <button
              key={k}
              type="button"
              className={`chip ${isPressed ? 'on' : ''}`}
              aria-pressed={isPressed}
              onClick={() => setFilter(k)}
            >
              {label}
              <span className="num">{getCount(k)}</span>
            </button>
          );
        })}
      </div>

      {/* ── Notifications Output / Groups ── */}
      <div aria-live="polite">
        {filteredList.length === 0 ? (
          <div className="empty">
            <Icon name="bell" />
            <div>
              {filter === 'unread'
                ? 'مفيش إشعارات جديدة. كله متابَع.'
                : 'مفيش إشعارات هنا.'}
            </div>
          </div>
        ) : (
          groupedByDay.map((group, gIdx) => (
            <React.Fragment key={gIdx}>
              <div className="day">{group.day}</div>
              <div className="list">
                {group.items.map((n) => {
                  const T = NOTIFICATION_TYPES[n.t] || {
                    l: 'إشعار',
                    i: 'bell',
                    c: '',
                  };

                  return (
                    <article
                      key={n.id}
                      className={`n ${n.un ? 'un' : ''}`}
                    >
                      {/* Icon */}
                      <div className={`ic ${T.c}`} aria-hidden="true">
                        <Icon name={T.i} />
                      </div>

                      {/* Content Body */}
                      <div
                        className="nb"
                        role="button"
                        tabIndex={0}
                        aria-label={`${n.un ? 'تعليم كمقروء' : 'تعليم كغير مقروء'}: ${n.title}`}
                        onClick={() => handleToggleRead(n.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggleRead(n.id);
                          }
                        }}
                      >
                        <b>{n.title}</b>
                        <p>{n.body}</p>
                        <time>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: formatRelativeTime(n.ts),
                            }}
                          />
                        </time>
                        {n.href && (
                          <button
                            type="button"
                            className="go"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (n.href === '#orders' || n.href === 'Store.html#orders') {
                                if (onNavigate) onNavigate('store', { openOrders: true });
                              } else if (n.href === '#store' || n.href === 'Store.html') {
                                if (onNavigate) onNavigate('store');
                              } else if (onNavigate) {
                                onNavigate('home');
                              }
                            }}
                          >
                            {n.go || 'فتح'}
                          </button>
                        )}
                      </div>

                      {/* Tools: Toggle Read & Delete */}
                      <div className="tools">
                        <button
                          type="button"
                          className="tb"
                          aria-label={n.un ? 'تعليم كمقروء' : 'تعليم كغير مقروء'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRead(n.id);
                          }}
                        >
                          <Icon name={n.un ? 'check' : 'dot'} />
                        </button>
                        <button
                          type="button"
                          className="tb del"
                          aria-label="حذف"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(n.id);
                          }}
                        >
                          <Icon name="trash" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </React.Fragment>
          ))
        )}
      </div>

      {/* ── Toast Feedback ── */}
      <div className={`toast ${showToast ? 'show' : ''}`} role="status">
        {toastMsg}
      </div>
    </main>
  );
}
