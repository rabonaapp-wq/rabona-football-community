import React, { useState } from 'react';
import { PageId } from '../components/Navigation';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onNavigate: (page: PageId, params?: Record<string, any>) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { signInWithGoogle } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const profile = await signInWithGoogle();
      if (profile?.isRegistered) {
        onNavigate('home');
      } else {
        // New user without complete profile yet -> send to signup
        onNavigate('signup');
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError('حدث خطأ أثناء تسجيل الدخول بحساب جوجل. حاول مرة أخرى.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: 'var(--black)' }}>
      <aside className="panel" aria-hidden="true">
        <img className="field-photo" src="/images/football-field.jpg" alt="" />
        <h2>
          كل تمرين
          <br />
          يبدأ من هنا
        </h2>
        <p>اشترك في أكاديميتك، تابع مواعيدك، وشارك لعبك مع لاعبين زيك.</p>
        <div className="pst">
          <div>
            <b>240+</b>
            <span>لاعب</span>
          </div>
          <div>
            <b>06</b>
            <span>أكاديميات</span>
          </div>
          <div>
            <b>4.8</b>
            <span>متوسط التقييم</span>
          </div>
        </div>
      </aside>

      <main className="screen">
        <img
          className="logo"
          src="/images/logo.png"
          alt="Rabona"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.visibility = 'hidden';
          }}
        />
        <p className="tag">BOOK · TRAIN · PLAY</p>

        <section className="auth-card">
          <h1>أهلاً بيك في رابونا</h1>
          <p className="sub">سجّل دخولك بحساب Google لمتابعة تدريباتك وحجوزاتك ونشاطك.</p>

          <div style={{ margin: '24px 0 16px' }}>
            <button
              className="btn"
              type="button"
              id="google"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              style={{
                width: '100%',
                height: 52,
                fontSize: 16,
                fontWeight: 800,
                background: 'var(--green)',
                color: '#04170B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                borderRadius: 14,
                opacity: isLoading ? 0.7 : 1,
                boxShadow: '0 8px 24px rgba(0, 200, 83, 0.25)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
                />
              </svg>
              {isLoading ? 'جاري الاتصال بجوجل...' : 'الدخول بحساب Google'}
            </button>
          </div>

          {authError && (
            <p className="err" style={{ display: 'block', textAlign: 'center', marginBottom: 12 }}>
              {authError}
            </p>
          )}

          <div style={{ textAlign: 'center', marginTop: 18, color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
            تسجيل سريع وآمن بحسابك على Google
          </div>
        </section>

        <p className="signup">
          معندكش حساب؟{' '}
          <button
            type="button"
            onClick={() => onNavigate('signup')}
            style={{
              background: 'none',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              color: 'var(--green)',
              fontWeight: 700,
            }}
          >
            سجّل دلوقتي
          </button>
        </p>
      </main>
    </div>
  );
}
