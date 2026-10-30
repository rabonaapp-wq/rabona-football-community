import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '../components/Icons';

export interface CartItem {
  id: string;
  size: string | null;
  q: number;
}

export interface OrderItem {
  no: string;
  tot: number;
  n: number;
  pm: string;
  d: string;
}

export interface Product {
  id: string;
  cat: 'shirt' | 'boot' | 'ball' | 'gear' | 'acc';
  name: string;
  desc: string;
  price: number;
  old?: number;
  sizes?: string[];
  c: string;
  tag?: string;
}

const CATS: Record<string, string> = {
  all: 'الكل',
  shirt: 'تيشرتات',
  boot: 'أحذية (بووت)',
  ball: 'كور',
  gear: 'حماية وقفازات',
  acc: 'إكسسوارات',
};

const SH = ['S', 'M', 'L', 'XL', 'XXL'];
const BO = ['39', '40', '41', '42', '43', '44', '45'];
const GL = ['7', '8', '9', '10'];

const GLY: Record<string, React.ReactNode> = {
  shirt: (
    <path d="M30 20l-20 12 8 14 10-5v39h44V41l10 5 8-14-20-12c-3 6-9 9-20 9s-17-3-20-9z" />
  ),
  boot: (
    <>
      <path d="M12 28h22v24c8 2 14 6 24 10l24 6c4 1 6 4 6 8v4H12z" />
      <path d="M34 52l8 4M42 46l8 4" />
    </>
  ),
  ball: (
    <>
      <circle cx="50" cy="50" r="34" />
      <path d="M50 34l14 10-5 17H41l-5-17z" />
      <path d="M50 34V16M64 44l18-6M59 61l10 15M41 61L31 76M36 44l-18-6" />
    </>
  ),
  gear: (
    <>
      <path d="M50 12l30 10v24c0 20-12 34-30 42-18-8-30-22-30-42V22z" />
      <path d="M50 30v40M34 46h32" />
    </>
  ),
  acc: (
    <>
      <rect x="20" y="34" width="60" height="48" rx="10" />
      <path d="M36 34v-6a14 14 0 0 1 28 0v6M20 54h60" />
    </>
  ),
};

export const PRODUCTS: Product[] = [];

const FREE = 1500;
const SHIP = 60;
const fmt = (n: number) => n.toLocaleString('en-US');

interface StorePageProps {
  onNavigate?: (page: any, params?: Record<string, any>) => void;
  openCartInitially?: boolean;
  openOrdersInitially?: boolean;
}

export function StorePage({
  openCartInitially = false,
  openOrdersInitially = false,
}: StorePageProps) {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('def');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  const [products] = useState<Product[]>(() => {
    try {
      const s = JSON.parse(localStorage.getItem('rabona_store_products') || '[]');
      if (Array.isArray(s) && s.length > 0) return s;
    } catch {}
    return PRODUCTS;
  });

  // Cart & Orders state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const s = JSON.parse(localStorage.getItem('rabona_cart') || '[]');
      if (Array.isArray(s)) {
        return s.filter((l) => l.q > 0);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [orders, setOrders] = useState<OrderItem[]>(() => {
    try {
      const s = JSON.parse(localStorage.getItem('rabona_orders') || '[]');
      if (Array.isArray(s)) return s;
    } catch {
      // ignore
    }
    return [];
  });

  // UI Drawer and Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(openCartInitially);
  const [modalType, setModalType] = useState<'checkout' | 'orders' | 'success' | null>(
    openOrdersInitially ? 'orders' : null
  );
  const [lastPlacedOrder, setLastPlacedOrder] = useState<{
    no: string;
    tot: number;
    phone: string;
    pm: string;
  } | null>(null);

  // Checkout form fields (empty defaults)
  const [formName, setFormName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formAddress, setFormAddress] = useState<string>('');
  const [formPm, setFormPm] = useState<string>('الدفع عند الاستلام');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Toast
  const [toastMsg, setToastMsg] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);

  const triggerToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  }, []);

  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 2300);
    return () => clearTimeout(t);
  }, [showToast]);

  // Sync cart to localStorage and dispatch event
  useEffect(() => {
    try {
      localStorage.setItem('rabona_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('rabona_cart_changed'));
    } catch {
      // ignore
    }
  }, [cart]);

  // Sync orders to localStorage and dispatch event
  useEffect(() => {
    try {
      localStorage.setItem('rabona_orders', JSON.stringify(orders));
      window.dispatchEvent(new Event('rabona_orders_changed'));
      window.dispatchEvent(new Event('rabona_notif_changed'));
    } catch {
      // ignore
    }
  }, [orders]);

  // Open cart / orders if requested via events or props
  useEffect(() => {
    if (openCartInitially) setIsDrawerOpen(true);
    if (openOrdersInitially) setModalType('orders');
  }, [openCartInitially, openOrdersInitially]);

  useEffect(() => {
    const handleOpenCart = () => setIsDrawerOpen(true);
    const handleOpenOrders = () => setModalType('orders');

    window.addEventListener('rabona_open_cart', handleOpenCart);
    window.addEventListener('rabona_open_orders', handleOpenOrders);
    return () => {
      window.removeEventListener('rabona_open_cart', handleOpenCart);
      window.removeEventListener('rabona_open_orders', handleOpenOrders);
    };
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalType) setModalType(null);
        else if (isDrawerOpen) setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalType, isDrawerOpen]);

  const getProduct = useCallback((id: string) => {
    return products.find((p) => p.id === id);
  }, [products]);

  // Filtered & sorted products
  const displayProducts = useMemo(() => {
    const q = searchQuery.trim();
    let list = products.filter(
      (p) =>
        (selectedCat === 'all' || p.cat === selectedCat) &&
        (!q || p.name.includes(q) || p.desc.includes(q))
    );
    if (sortOption === 'lo') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortOption === 'hi') {
      list = [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, selectedCat, searchQuery, sortOption]);

  // Totals
  const { subTotal, shipping, total, totalCount } = useMemo(() => {
    const sub = cart.reduce((s, l) => {
      const p = getProduct(l.id);
      return s + (p ? p.price * l.q : 0);
    }, 0);
    const count = cart.reduce((s, l) => s + l.q, 0);
    const ship = !cart.length || sub >= FREE ? 0 : SHIP;
    return { subTotal: sub, shipping: ship, total: sub + ship, totalCount: count };
  }, [cart, getProduct]);

  // Add to cart
  const handleAddToCart = (id: string) => {
    const p = getProduct(id);
    if (!p) return;
    if (p.sizes && !selectedSizes[id]) {
      triggerToast('اختار المقاس الأول');
      return;
    }
    const size = p.sizes ? selectedSizes[id] : null;
    setCart((prev) => {
      const ex = prev.find((l) => l.id === id && l.size === size);
      if (ex) {
        return prev.map((l) =>
          l.id === id && l.size === size ? { ...l, q: Math.min(l.q + 1, 9) } : l
        );
      }
      return [...prev, { id, size, q: 1 }];
    });
    triggerToast('تمت الإضافة للسلة');
  };

  const handleUpdateQty = (index: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      const item = copy[index];
      if (!item) return prev;
      const nextQ = item.q + delta;
      if (nextQ < 1) {
        copy.splice(index, 1);
        return copy;
      }
      copy[index] = { ...item, q: Math.min(nextQ, 9) };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Place order
  const handlePlaceOrder = () => {
    const n = formName.trim();
    const ph = formPhone.trim().replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    const a = formAddress.trim();

    const newErrors: Record<string, string> = {};
    if (!n) newErrors.name = 'اكتب اسمك';
    if (!/^01[0125]\d{8}$/.test(ph)) newErrors.phone = 'اكتب رقم موبايل مصري صحيح';
    if (a.length < 6) newErrors.address = 'اكتب عنوان تفصيلي';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const no = 'RB-' + Math.floor(100000 + Math.random() * 900000);
    const orderData: OrderItem = {
      no,
      tot: total,
      n: totalCount,
      pm: formPm,
      d: new Date().toISOString(),
    };

    setOrders((prev) => [orderData, ...prev.slice(0, 9)]);
    setLastPlacedOrder({
      no,
      tot: total,
      phone: ph,
      pm: formPm,
    });

    setCart([]);
    setIsDrawerOpen(false);
    setModalType('success');

    // Reset fields
    setFormName('');
    setFormPhone('');
    setFormAddress('');
  };

  return (
    <main className="wrap-store">
      {/* ── Hero Banner ── */}
      <div className="hero diag">
        <h1 className="h">كل اللي محتاجه للملعب</h1>
        <p>تيشرتات، أحذية، كور، وحماية وإكسسوارات للاعب الجاد. اطلب وإحنا نوصلك.</p>
        <div className="perks">
          <span className="badge">
            شحن مجاني فوق <span className="num" style={{ margin: '0 4px' }}>1,500</span> ج.م
          </span>
          <span className="badge amber">الدفع عند الاستلام</span>
          <span className="badge dark">استبدال خلال 14 يوم</span>
        </div>
      </div>

      {/* ── Products Section ── */}
      <section className="sec" id="shop">
        <div className="flex items-center justify-between mb-3">
          <h2 className="h">المنتجات</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => setModalType('orders')}
            >
              <Icon name="rec" style={{ width: 16, height: 16 }} />
              طلباتي
            </button>
            <button
              type="button"
              className="btn sm"
              onClick={() => setIsDrawerOpen(true)}
            >
              <Icon name="cart" style={{ width: 16, height: 16 }} />
              السلة ({totalCount})
            </button>
          </div>
        </div>

        <div className="bar2">
          <div className="row1">
            <label className="sbox">
              <Icon name="search" />
              <input
                id="q"
                type="search"
                placeholder="ابحث عن منتج"
                aria-label="بحث"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
            <select
              className="sortsel"
              id="sort"
              aria-label="الترتيب"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="def">الافتراضي</option>
              <option value="lo">الأرخص</option>
              <option value="hi">الأغلى</option>
            </select>
          </div>

          <div className="chips" id="tabs" role="group" aria-label="التصنيفات">
            {Object.entries(CATS).map(([k, label]) => {
              const isSelected = selectedCat === k;
              return (
                <button
                  key={k}
                  type="button"
                  className={`chip ${isSelected ? 'on' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedCat(k)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Grid ── */}
        <div className="grid" id="items">
          {displayProducts.length === 0 ? (
            <div className="empty" style={{ gridColumn: '1 / -1', padding: '48px 20px', textAlign: 'center' }}>
              {searchQuery ? 'مفيش منتجات مطابقة للبحث.' : 'لا توجد منتجات متوفرة حالياً في المتجر.'}
            </div>
          ) : (
            displayProducts.map((p) => {
              const selectedSize = selectedSizes[p.id];
              return (
                <article key={p.id} className="card">
                  <div
                    className="pic"
                    style={{
                      background: `linear-gradient(135deg, ${p.c}, #06150d)`,
                    }}
                  >
                    <svg className="g" viewBox="0 0 100 100" aria-hidden="true">
                      {GLY[p.cat]}
                    </svg>
                    {p.tag && (
                      <span
                        className={`over badge ${p.tag === 'خصم' ? 'amber' : ''}`}
                      >
                        {p.tag}
                      </span>
                    )}
                  </div>

                  <div className="bd">
                    <h3>{p.name}</h3>
                    <p>{p.desc}</p>

                    {p.sizes && (
                      <div className="sizes" role="group" aria-label="المقاس">
                        {p.sizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className="sz"
                            aria-pressed={selectedSize === s}
                            onClick={() =>
                              setSelectedSizes((prev) => ({ ...prev, [p.id]: s }))
                            }
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="pr">
                      <span>
                        {p.old && <span className="o">{fmt(p.old)}</span>}
                        <b className="num p">{fmt(p.price)}</b>{' '}
                        <small>ج.م</small>
                      </span>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => handleAddToCart(p.id)}
                      >
                        أضف
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <footer className="mt-8">
        الطلب والدفع تجريبيين في هذه النسخة، ومفيش أي مبالغ بتتحصل فعليًا.
      </footer>

      {/* ── Cart Drawer & Scrim ── */}
      <div
        className={`scrim ${isDrawerOpen ? 'open' : ''}`}
        id="scrim"
        onClick={() => setIsDrawerOpen(false)}
      />

      <aside
        className={`drawer ${isDrawerOpen ? 'open' : ''}`}
        id="drawer"
        aria-label="سلة المشتريات"
      >
        <div className="dh">
          <h2 className="h">سلتك</h2>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => setIsDrawerOpen(false)}
          >
            إغلاق
          </button>
        </div>

        <div className="lines" id="lines">
          {cart.length === 0 ? (
            <div className="empty">السلة فاضية. ضيف حاجة من المتجر.</div>
          ) : (
            cart.map((l, i) => {
              const p = getProduct(l.id);
              if (!p) return null;
              return (
                <div key={`${l.id}-${l.size || 'default'}-${i}`} className="ln">
                  <div
                    className="pic"
                    style={{
                      background: `linear-gradient(135deg, ${p.c}, #06150d)`,
                    }}
                  >
                    <svg className="g" viewBox="0 0 100 100" aria-hidden="true">
                      {GLY[p.cat]}
                    </svg>
                  </div>

                  <div>
                    <b>{p.name}</b>
                    <br />
                    <small>
                      {l.size ? (
                        <>
                          المقاس <span className="num" style={{ fontSize: 12 }}>{l.size}</span> ·{' '}
                        </>
                      ) : null}
                      <span className="num" style={{ fontSize: 12 }}>
                        {fmt(p.price)}
                      </span>{' '}
                      ج.م
                    </small>
                    <div className="qty">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(i, -1)}
                        aria-label="تقليل"
                      >
                        −
                      </button>
                      <span className="num">{l.q}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(i, 1)}
                        aria-label="زيادة"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="rm"
                    onClick={() => handleRemoveItem(i)}
                  >
                    حذف
                  </button>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="ft" id="foot">
            <div className="r">
              <span>المجموع</span>
              <span>
                <b className="num">{fmt(subTotal)}</b> ج.م
              </span>
            </div>
            <div className="r">
              <span>الشحن</span>
              <span>
                {shipping ? (
                  <>
                    <b className="num">{shipping}</b> ج.م
                  </>
                ) : (
                  'مجاني'
                )}
              </span>
            </div>
            <div className="meter" aria-hidden="true">
              <i
                style={{
                  width: `${Math.min(100, (subTotal / FREE) * 100)}%`,
                }}
              />
            </div>
            {shipping > 0 ? (
              <div className="hint">
                ضيف{' '}
                <span className="num" style={{ fontSize: 12 }}>
                  {fmt(FREE - subTotal)}
                </span>{' '}
                ج.م وتاخد شحن مجاني.
              </div>
            ) : (
              <div className="hint">مبروك، الشحن مجاني.</div>
            )}
            <div className="r t">
              <span>الإجمالي</span>
              <span>
                <span className="num">{fmt(total)}</span> ج.م
              </span>
            </div>
            <button
              type="button"
              className="btn lg"
              onClick={() => {
                setModalType('checkout');
              }}
            >
              إتمام الطلب
            </button>
          </div>
        )}
      </aside>

      {/* ── Modal Dialogs ── */}
      {modalType && (
        <div
          className="modal open"
          id="modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalType(null);
          }}
        >
          <div className="sheet" id="sheet">
            {modalType === 'checkout' && (
              <>
                <h3 className="h" id="mTitle">
                  بيانات التوصيل
                </h3>
                <label className="f">
                  الاسم
                  <input
                    type="text"
                    id="fn"
                    autoComplete="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={errors.name ? 'bad' : ''}
                  />
                  <span className="err" id="e1">
                    {errors.name}
                  </span>
                </label>

                <label className="f">
                  رقم الموبايل
                  <input
                    type="tel"
                    id="fp"
                    inputMode="numeric"
                    placeholder="01XXXXXXXXX"
                    autoComplete="tel"
                    style={{ direction: 'ltr', textAlign: 'right' }}
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className={errors.phone ? 'bad' : ''}
                  />
                  <span className="err" id="e2">
                    {errors.phone}
                  </span>
                </label>

                <label className="f">
                  العنوان
                  <input
                    type="text"
                    id="fa"
                    autoComplete="street-address"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className={errors.address ? 'bad' : ''}
                  />
                  <span className="err" id="e3">
                    {errors.address}
                  </span>
                </label>

                <div className="meth" role="radiogroup" aria-label="طريقة الدفع">
                  {[
                    'الدفع عند الاستلام',
                    'بطاقة بنكية',
                    'فودافون كاش',
                    'إنستاباي',
                  ].map((pm) => (
                    <label key={pm} className="mt">
                      <input
                        type="radio"
                        name="pm"
                        value={pm}
                        checked={formPm === pm}
                        onChange={(e) => setFormPm(e.target.value)}
                      />
                      {pm}
                    </label>
                  ))}
                </div>

                <div className="sum">
                  <span>الإجمالي</span>
                  <span>
                    <span className="num">{fmt(total)}</span> ج.م
                  </span>
                </div>

                <div className="acts">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setModalType(null)}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={handlePlaceOrder}
                  >
                    تأكيد الطلب
                  </button>
                </div>
              </>
            )}

            {modalType === 'success' && lastPlacedOrder && (
              <>
                <h3 className="h" id="mTitle">
                  تم استلام طلبك
                </h3>
                <p style={{ marginTop: 10, lineHeight: 1.6 }}>
                  رقم الطلب <b className="num">{lastPlacedOrder.no}</b>
                  <br />
                  هنكلمك على <span className="num">{lastPlacedOrder.phone}</span> لتأكيد التوصيل.
                </p>
                <div className="sum">
                  <span>{lastPlacedOrder.pm}</span>
                  <span>
                    <span className="num">{fmt(lastPlacedOrder.tot)}</span> ج.م
                  </span>
                </div>
                <div className="acts">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setModalType(null)}
                  >
                    تمام
                  </button>
                </div>
              </>
            )}

            {modalType === 'orders' && (
              <>
                <h3 className="h" id="mTitle">
                  طلباتي
                </h3>
                {orders.length ? (
                  orders.map((o) => (
                    <div key={o.no} className="ord">
                      <div>
                        <b className="num">{o.no}</b>
                        <br />
                        <small>
                          {o.pm} · <span className="num" style={{ fontSize: 12 }}>{o.n}</span> قطعة
                        </small>
                      </div>
                      <div>
                        <b className="num">{fmt(o.tot)}</b> ج.م
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty" style={{ marginTop: 12 }}>
                    لسه معملتش أي طلب.
                  </div>
                )}
                <div className="acts">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setModalType(null)}
                  >
                    إغلاق
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      <div className={`toast ${showToast ? 'show' : ''}`} role="status">
        {toastMsg}
      </div>
    </main>
  );
}
