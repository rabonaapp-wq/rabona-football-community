import { useState } from 'react';
import { PageId } from '../components/Navigation';

interface DemoCheckoutPageProps {
  onNavigate: (page: PageId, params?: Record<string, any>) => void;
  academyName: string;
  planName: string;
  amount: number;
}

export function DemoCheckoutPage({
  onNavigate,
  academyName,
  planName,
  amount,
}: DemoCheckoutPageProps) {
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<'review' | 'details' | 'method'>('review');

  return (
    <main style={{ maxWidth: '560px', margin: 'auto', padding: '32px 16px' }}>
      <section className="gl" style={{ padding: '24px' }}>
        <span className="badge amber">وضع تجريبي - لا يوجد تحصيل مالي</span>
        <h1 className="h" style={{ marginTop: '16px' }}>خطوات الاشتراك</h1>
        <p style={{ color: 'var(--muted)', margin: '8px 0 20px' }}>
          بنجرب رحلة الدفع كاملة قبل ربط بوابة الدفع الحقيقية. لن يتم خصم أي مبلغ ولن يتم تفعيل الاشتراك.
        </p>

        {submitted ? (
          <div style={{ marginTop: '20px' }}>
            <p style={{ color: 'var(--amber)', fontWeight: 700 }}>
              تم تسجيل طلب تجريبي بحالة قيد المراجعة فقط.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
              لا يوجد دفع فعلي ولا تفعيل للاشتراك.
            </p>
            <button type="button" className="btn" onClick={() => onNavigate('bookings')}>
              عرض المواعيد
            </button>
          </div>
        ) : (
          <>
            <div className="r-setting">
              <span className="t">
                <b>1. مراجعة الاشتراك</b>
                <small>{academyName} · {planName}</small>
              </span>
              <strong className="num">{amount.toLocaleString('en-US')} ج.م</strong>
            </div>

            {step === 'review' && (
              <div className="acts" style={{ marginTop: '20px' }}>
                <button type="button" className="btn ghost" onClick={() => onNavigate('academies')}>
                  إلغاء
                </button>
                <button type="button" className="btn" onClick={() => setStep('details')}>
                  متابعة
                </button>
              </div>
            )}

            {step === 'details' && (
              <div style={{ marginTop: '20px' }}>
                <p style={{ fontWeight: 700 }}>2. بيانات المشترك</p>
                <div className="fields">
                  <label>
                    الاسم
                    <div className="in"><input placeholder="اكتب الاسم" /></div>
                  </label>
                  <label>
                    رقم الهاتف
                    <div className="in"><input inputMode="tel" placeholder="01xxxxxxxxx" /></div>
                  </label>
                </div>
                <div className="acts">
                  <button type="button" className="btn ghost" onClick={() => setStep('review')}>رجوع</button>
                  <button type="button" className="btn" onClick={() => setStep('method')}>متابعة للدفع</button>
                </div>
              </div>
            )}

            {step === 'method' && (
              <div style={{ marginTop: '20px' }}>
                <p style={{ fontWeight: 700 }}>3. طريقة الدفع التجريبية</p>
                <div className="r-setting">
                  <span className="t">
                    <b>بطاقة بنكية تجريبية</b>
                    <small>لن يتم طلب بيانات بطاقة حقيقية أو حفظها</small>
                  </span>
                  <span className="badge amber">تجريبي</span>
                </div>
                <div className="acts">
                  <button type="button" className="btn ghost" onClick={() => setStep('details')}>رجوع</button>
                  <button type="button" className="btn" onClick={() => setSubmitted(true)}>
                    تأكيد تجريبي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
