import { useState } from 'react';
import { Icon } from '../components/Icons';
import { PageId } from '../components/Navigation';
import { useAuth } from '../context/AuthContext';

interface SettingsPageProps {
  onNavigate: (page: PageId, params?: Record<string, any>) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { signOut } = useAuth();
  const [search, setSearch] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [settings, setSettings] = useState({
    privateAccount: false,
    whoPosts: 'all',
    whoFollow: 'all',
    whoComment: 'all',
    showStats: true,
    showCity: true,
    allowTag: true,
    showOnline: true,
    notif: true,
    nLikes: true,
    nComments: true,
    nFollows: true,
    nAcademy: true,
    nTrain: true,
    trainBefore: '3h',
    nRenew: true,
    nOffers: false,
    autoRenew: false,
    hideFull: false,
    city: '',
    useLoc: true,
    lang: 'ar',
    textSize: 'md',
    reduceMotion: false,
    sounds: true,
    biometric: false,
    dataSaver: false,
  });

  const updateSetting = (key: keyof typeof settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const govs = [
    'القاهرة',
    'الجيزة',
    'الإسكندرية',
    'القليوبية',
    'الشرقية',
    'الدقهلية',
    'الغربية',
    'المنوفية',
    'البحيرة',
    'كفر الشيخ',
    'دمياط',
    'بورسعيد',
    'الإسماعيلية',
    'السويس',
    'الفيوم',
    'بني سويف',
    'المنيا',
    'أسيوط',
    'سوهاج',
    'قنا',
    'الأقصر',
    'أسوان',
    'البحر الأحمر',
    'الوادي الجديد',
    'مطروح',
    'شمال سيناء',
    'جنوب سيناء',
  ];

  const matchesSearch = (text: string) => {
    if (!search.trim()) return true;
    return text.toLowerCase().includes(search.trim().toLowerCase());
  };

  return (
    <main style={{ maxWidth: '720px', margin: 'auto', padding: '18px 16px calc(var(--bar) + 32px + env(safe-area-inset-bottom))' }}>
      <h1 className="h">الإعدادات</h1>
      <p style={{ color: 'var(--muted)', margin: '6px 0 14px', fontSize: '14px' }}>
        تحكم في حسابك وخصوصيتك والإشعارات. التغييرات بتتحفظ تلقائياً.
      </p>

      {/* Find Box */}
      <label className="find">
        <Icon name="search" />
        <input
          id="q"
          type="search"
          placeholder="ابحث في الإعدادات"
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      {/* Account */}
      {matchesSearch('الحساب الملف الشخصي كلمة السر الأكاديمية') && (
        <section style={{ marginTop: '22px' }}>
          <h2 className="h" style={{ fontSize: '15px', marginBottom: '10px' }}>الحساب</h2>
          <div className="gl">
            <button
              type="button"
              className="r-setting"
              onClick={() => onNavigate('profile')}
            >
              <span className="t">
                <b>تعديل الملف الشخصي</b>
                <small>الاسم والصورة والمركز</small>
              </span>
              <Icon name="back" />
            </button>
            <button
              type="button"
              className="r-setting"
              onClick={() => onNavigate('admin')}
            >
              <span className="t">
                <b>لوحة إدارة الأكاديمية</b>
                <small>لأصحاب الأكاديميات</small>
              </span>
              <Icon name="back" />
            </button>
            <button
              type="button"
              className="r-setting"
              onClick={() => {}}
            >
              <span className="t">
                <b>تغيير كلمة السر</b>
              </span>
              <Icon name="back" />
            </button>
          </div>
        </section>
      )}

      {/* Privacy */}
      {matchesSearch('الخصوصية حساب خاص منشوراتي تعليق إحصائيات') && (
        <section style={{ marginTop: '22px' }}>
          <h2 className="h" style={{ fontSize: '15px', marginBottom: '10px' }}>الخصوصية</h2>
          <div className="gl">
            <div className="r-setting">
              <span className="t">
                <b>حساب خاص</b>
                <small>المتابعين المعتمدين بس يشوفوا منشوراتك</small>
              </span>
              <button
                type="button"
                role="switch"
                className="sw"
                aria-checked={settings.privateAccount}
                onClick={() => updateSetting('privateAccount', !settings.privateAccount)}
              />
            </div>

            <div className="r-setting">
              <span className="t">
                <b>مين يشوف منشوراتي</b>
              </span>
              <select
                value={settings.whoPosts}
                onChange={(e) => updateSetting('whoPosts', e.target.value)}
              >
                <option value="all">الكل</option>
                <option value="fol">المتابعين</option>
                <option value="me">أنا بس</option>
              </select>
            </div>

            <div className="r-setting">
              <span className="t">
                <b>مين يعلّق على منشوراتي</b>
              </span>
              <select
                value={settings.whoComment}
                onChange={(e) => updateSetting('whoComment', e.target.value)}
              >
                <option value="all">الكل</option>
                <option value="fol">المتابعين</option>
                <option value="off">محدش</option>
              </select>
            </div>

            <div className="r-setting">
              <span className="t">
                <b>إظهار إحصائيات اللعب</b>
                <small>الماتشات والأهداف في ملفك</small>
              </span>
              <button
                type="button"
                role="switch"
                className="sw"
                aria-checked={settings.showStats}
                onClick={() => updateSetting('showStats', !settings.showStats)}
              />
            </div>
          </div>
        </section>
      )}

      {/* Notifications */}
      {matchesSearch('الإشعارات تذكير تمرين اشتراك') && (
        <section style={{ marginTop: '22px' }}>
          <h2 className="h" style={{ fontSize: '15px', marginBottom: '10px' }}>الإشعارات</h2>
          <div className="gl">
            <div className="r-setting">
              <span className="t">
                <b>تشغيل الإشعارات</b>
                <small>إيقافه بيقفل كل الإشعارات</small>
              </span>
              <button
                type="button"
                role="switch"
                className="sw"
                aria-checked={settings.notif}
                onClick={() => updateSetting('notif', !settings.notif)}
              />
            </div>

            <div className="r-setting">
              <span className="t">
                <b>تذكير بمواعيد التمرين</b>
              </span>
              <button
                type="button"
                role="switch"
                className="sw"
                aria-checked={settings.nTrain}
                onClick={() => updateSetting('nTrain', !settings.nTrain)}
              />
            </div>

            <div className="r-setting">
              <span className="t">
                <b>تذكير بتجديد الاشتراك</b>
                <small>قبل ما ينتهي بـ 3 أيام</small>
              </span>
              <button
                type="button"
                role="switch"
                className="sw"
                aria-checked={settings.nRenew}
                onClick={() => updateSetting('nRenew', !settings.nRenew)}
              />
            </div>
          </div>
        </section>
      )}

      {/* Location */}
      {matchesSearch('الموقع المحافظة الأكاديميات') && (
        <section style={{ marginTop: '22px' }}>
          <h2 className="h" style={{ fontSize: '15px', marginBottom: '10px' }}>الموقع</h2>
          <div className="gl">
            <div className="r-setting">
              <span className="t">
                <b>المحافظة</b>
              </span>
              <select
                value={settings.city}
                onChange={(e) => updateSetting('city', e.target.value)}
              >
                <option value="">اختار المحافظة</option>
                {govs.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="r-setting">
              <span className="t">
                <b>استخدام موقعي</b>
                <small>لاقتراح أقرب أكاديميات</small>
              </span>
              <button
                type="button"
                role="switch"
                className="sw"
                aria-checked={settings.useLoc}
                onClick={() => updateSetting('useLoc', !settings.useLoc)}
              />
            </div>
          </div>
        </section>
      )}

      {/* Danger Zone */}
      {matchesSearch('تسجيل الخروج حذف الحساب') && (
        <section style={{ marginTop: '22px' }}>
          <h2 className="h" style={{ fontSize: '15px', marginBottom: '10px' }}>منطقة حساسة</h2>
          <div className="gl">
            <button
              type="button"
              className="r-setting danger"
              onClick={async () => {
                await signOut();
                onNavigate('login');
              }}
            >
              <span className="t">
                <b>تسجيل الخروج</b>
              </span>
              <Icon name="back" />
            </button>
            <button
              type="button"
              className="r-setting danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <span className="t">
                <b>حذف الحساب</b>
                <small>بيمسح حسابك وبياناتك نهائياً</small>
              </span>
              <Icon name="back" />
            </button>
          </div>
        </section>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="mo" onClick={() => setShowDeleteModal(false)}>
          <div className="md" onClick={(e) => e.stopPropagation()}>
            <h2 className="h">حذف الحساب</h2>
            <p>
              الحذف نهائي ومش هتقدر ترجعه: هتتمسح منشوراتك وبياناتك وسجل اشتراكاتك. اكتب كلمة{' '}
              <b style={{ color: 'var(--white)' }}>حذف</b> للتأكيد.
            </p>
            <input
              type="text"
              autoComplete="off"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="اكتب حذف"
            />
            <div className="acts">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setShowDeleteModal(false)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: 'var(--err)', color: '#fff' }}
                disabled={deleteConfirmText.trim() !== 'حذف'}
                onClick={() => {
                  setShowDeleteModal(false);
                  onNavigate('signup');
                }}
              >
                احذف حسابي
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
