import React, { useState, useEffect } from 'react';
import { PageId } from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageCompressor';

interface SignupPageProps {
  onNavigate: (page: PageId, params?: Record<string, any>) => void;
  initialAccountType?: 'academy';
}

interface PlanItem {
  id: string;
  name: string;
  price: string;
  months: number;
}

interface FormerPlayerItem {
  id: string;
  name: string;
  photoUrl: string | null;
  errMsg: string;
  isBad: boolean;
}

const DUR: [number, string][] = [
  [1, 'شهر'],
  [2, 'شهرين'],
  [3, '3 شهور'],
  [6, '6 شهور'],
  [12, 'سنة'],
];

const GOVS = [
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

const POSITIONS = [
  { id: '1', label: 'مهاجم', val: 'مهاجم', left: '50%', top: '15%' },
  { id: '2', label: 'جناح', val: 'جناح', left: '15%', top: '30%' },
  { id: '3', label: 'جناح', val: 'جناح', left: '85%', top: '30%' },
  { id: '4', label: 'وسط', val: 'لاعب وسط', left: '50%', top: '47%' },
  { id: '5', label: 'ظهير', val: 'ظهير', left: '13%', top: '64%' },
  { id: '6', label: 'ظهير', val: 'ظهير', left: '87%', top: '64%' },
  { id: '7', label: 'مدافع', val: 'مدافع', left: '50%', top: '72%' },
  { id: '8', label: 'حارس', val: 'حارس مرمى', left: '50%', top: '90%' },
];

const ACADEMY_FEATURES = [
  'بطولات ودية',
  'بطولات رسمية',
  'اتحاد الكورة',
  'مدربين معروفين',
  'لاعبين سابقين',
];

const COACH_SPECIALTIES = [
  'تدريب فردي (Private)',
  'لياقة وبدني',
  'تطوير مهارات وتكنيك',
  'تدريب حراس مرمى',
  'ناشئين وبراعم',
  'تأهيل بعد الإصابة',
];

const COACH_LICENSES = [
  'بدون رخصة حالياً (خبرة ميدانية)',
  'رخصة تدريب C معتمدة (CAF)',
  'رخصة تدريب B معتمدة (CAF)',
  'رخصة تدريب A معتمدة (CAF)',
  'بكالوريوس تربية رياضية',
  'دبلومة إعداد بدني ولياقة',
  'لاعب محترف سابق',
];

const EX_FEATURE = 'لاعبين سابقين';
const MAX_EX = 10;
const MAX_MB = 5;
const DEF_EX_MSG = 'صورة JPG بحد أقصى ' + MAX_MB + ' ميجا';

function okMap(u: string): boolean {
  if (!u.trim()) return true;
  let val = u.trim();
  if (!/^https?:\/\//i.test(val)) val = 'https://' + val;
  try {
    const x = new URL(val);
    const h = x.hostname.replace(/^www\./, '');
    return (
      (/^(maps\.)?google\.[a-z.]+$/.test(h) &&
        (h.startsWith('maps.') || x.pathname.startsWith('/maps'))) ||
      h === 'maps.app.goo.gl' ||
      (h === 'goo.gl' && x.pathname.startsWith('/maps'))
    );
  } catch {
    return false;
  }
}

export function SignupPage({ onNavigate, initialAccountType }: SignupPageProps) {
  const { currentUser, signInWithGoogle, registerProfile } = useAuth();
  const [accountType, setAccountType] = useState<'player' | 'coach' | 'academy' | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doneTxt, setDoneTxt] = useState('');

  // Player fields
  const [fn, setFn] = useState('');
  const [ln, setLn] = useState('');

  useEffect(() => {
    if (currentUser?.displayName) {
      const parts = currentUser.displayName.trim().split(' ');
      if (parts[0] && !fn) setFn(parts[0]);
      if (parts.slice(1).join(' ') && !ln) setLn(parts.slice(1).join(' '));
    }
  }, [currentUser]);
  const [dob, setDob] = useState('');
  const [foot, setFoot] = useState('');
  const [pos, setPos] = useState('');
  const [pgov, setPgov] = useState('');
  const [pcity, setPcity] = useState('');
  const [padr, setPadr] = useState('');

  // Player errors
  const [badFn, setBadFn] = useState(false);
  const [badLn, setBadLn] = useState(false);
  const [badDob, setBadDob] = useState(false);
  const [badFoot, setBadFoot] = useState(false);
  const [badPos, setBadPos] = useState(false);
  const [badPgov, setBadPgov] = useState(false);
  const [badPcity, setBadPcity] = useState(false);
  const [badPadr, setBadPadr] = useState(false);

  // Coach fields
  const [cfn, setCfn] = useState('');
  const [cln, setCln] = useState('');
  const [ctitle, setCtitle] = useState('');
  const [cexp, setCexp] = useState('');
  const [c_feats, setCfeats] = useState<string[]>([]);
  const [clicense, setClicense] = useState('');
  const [cgov, setCgov] = useState('');
  const [ccity, setCcity] = useState('');
  const [cvenues, setCvenues] = useState('');
  const [cplans, setCplans] = useState<PlanItem[]>([]);
  const [cagemin, setCagemin] = useState('');
  const [cagemax, setCagemax] = useState('');

  // Coach errors
  const [badCfn, setBadCfn] = useState(false);
  const [badCln, setBadCln] = useState(false);
  const [badCtitle, setBadCtitle] = useState(false);
  const [badCexp, setBadCexp] = useState(false);
  const [badCfeats, setBadCfeats] = useState(false);
  const [badCgov, setBadCgov] = useState(false);
  const [badCcity, setBadCcity] = useState(false);
  const [badCvenues, setBadCvenues] = useState(false);
  const [badCplans, setBadCplans] = useState(false);
  const [badCages, setBadCages] = useState(false);

  // Academy fields
  const [an, setAn] = useState('');
  const [agov, setAgov] = useState('');
  const [acity, setAcity] = useState('');
  const [aadr, setAadr] = useState('');
  const [amap, setAmap] = useState('');

  const [plans, setPlans] = useState<PlanItem[]>([]);

  const [features, setFeatures] = useState<string[]>([]);
  const [formerPlayers, setFormerPlayers] = useState<FormerPlayerItem[]>([]);
  const [badExBox, setBadExBox] = useState(false);

  const [agemin, setAgemin] = useState('');
  const [agemax, setAgemax] = useState('');

  // Academy errors
  const [badAn, setBadAn] = useState(false);
  const [badAgov, setBadAgov] = useState(false);
  const [badAcity, setBadAcity] = useState(false);
  const [badAadr, setBadAadr] = useState(false);
  const [badAmap, setBadAmap] = useState(false);
  const [badPlans, setBadPlans] = useState(false);
  const [badAges, setBadAges] = useState(false);
  const [globalError, setGlobalError] = useState('');

  useEffect(() => {
    if (initialAccountType === 'academy' && currentUser && accountType === null) {
      setAccountType('academy');
      setStepIndex(0);
    }
  }, [initialAccountType, currentUser, accountType]);

  // Profile & Cover photos step
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [coverPhoto, setCoverPhoto] = useState<string>('');
  const [profileBio, setProfileBio] = useState<string>('');

  const flows = {
    player: ['p1', 'p2', 'p3', 'photos'],
    coach: ['c1', 'c2', 'c3', 'c4', 'c5', 'photos'],
    academy: ['a1', 'a2', 'a3', 'a4', 'a5', 'photos'],
  };

  const currentFlow = accountType ? flows[accountType] : [];

  // Keyboard navigation on Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && stepIndex >= 0 && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleNext = () => {
    if (accountType === 'player') {
      if (stepIndex === 0) {
        const okFn = fn.trim().length > 1;
        const okLn = ln.trim().length > 1;
        let okDob = false;
        if (dob) {
          const d = new Date(dob);
          const n = new Date();
          const diff = n.getFullYear() - d.getFullYear();
          okDob = d < n && diff >= 5 && diff <= 60;
        }
        setBadFn(!okFn);
        setBadLn(!okLn);
        setBadDob(!okDob);
        if (!okFn || !okLn || !okDob) return;
        setStepIndex(1);
      } else if (stepIndex === 1) {
        const okFoot = Boolean(foot);
        const okPos = Boolean(pos);
        setBadFoot(!okFoot);
        setBadPos(!okPos);
        if (!okFoot || !okPos) return;
        setStepIndex(2);
      } else if (stepIndex === 2) {
        const okGov = pgov.trim().length > 1;
        const okCity = pcity.trim().length > 1;
        const okAdr = padr.trim().length > 1;
        setBadPgov(!okGov);
        setBadPcity(!okCity);
        setBadPadr(!okAdr);
        if (!okGov || !okCity || !okAdr) return;

        // Move to photos step
        setStepIndex(3);
      } else if (stepIndex === 3) {
        // Photos step completed
        finish();
      }
    } else if (accountType === 'coach') {
      if (stepIndex === 0) {
        const okFn = cfn.trim().length > 1;
        const okLn = cln.trim().length > 1;
        const okTitle = ctitle.trim().length > 1;
        const expNum = Number(cexp);
        const okExp = !isNaN(expNum) && expNum >= 0 && expNum <= 50;

        setBadCfn(!okFn);
        setBadCln(!okLn);
        setBadCtitle(!okTitle);
        setBadCexp(!okExp);

        if (!okFn || !okLn || !okTitle || !okExp) return;
        setStepIndex(1);
      } else if (stepIndex === 1) {
        const okFeats = c_feats.length > 0;
        setBadCfeats(!okFeats);
        if (!okFeats) return;
        setStepIndex(2);
      } else if (stepIndex === 2) {
        const okGov = cgov.trim().length > 1;
        const okCity = ccity.trim().length > 1;
        const okVenues = cvenues.trim().length > 1;

        setBadCgov(!okGov);
        setBadCcity(!okCity);
        setBadCvenues(!okVenues);

        if (!okGov || !okCity || !okVenues) return;
        setStepIndex(3);
      } else if (stepIndex === 3) {
        const okPlans =
          cplans.length > 0 &&
          cplans.every((p) => p.name.trim().length > 0 && Number(p.price) > 0);
        setBadCplans(!okPlans);
        if (!okPlans) return;
        setStepIndex(4);
      } else if (stepIndex === 4) {
        const a = cagemin.trim();
        const b = cagemax.trim();
        const x = Number(a);
        const y = Number(b);
        const ok =
          /^\d{1,2}$/.test(a) &&
          /^\d{1,2}$/.test(b) &&
          x >= 3 &&
          y <= 60 &&
          x <= y;
        setBadCages(!ok);
        if (!ok) return;

        // Move to photos step
        setStepIndex(5);
      } else if (stepIndex === 5) {
        // Photos step completed
        finish();
      }
    } else if (accountType === 'academy') {
      if (stepIndex === 0) {
        const okAn = an.trim().length > 1;
        setBadAn(!okAn);
        if (!okAn) return;
        setStepIndex(1);
      } else if (stepIndex === 1) {
        const okGov = agov.trim().length > 1;
        const okCity = acity.trim().length > 1;
        const okAdr = aadr.trim().length > 1;
        const okM = okMap(amap);
        setBadAgov(!okGov);
        setBadAcity(!okCity);
        setBadAadr(!okAdr);
        setBadAmap(!okM);
        if (!okGov || !okCity || !okAdr || !okM) return;
        setStepIndex(2);
      } else if (stepIndex === 2) {
        const okPlans =
          plans.length > 0 &&
          plans.every((p) => p.name.trim().length > 0 && Number(p.price) > 0);
        setBadPlans(!okPlans);
        if (!okPlans) return;
        setStepIndex(3);
      } else if (stepIndex === 3) {
        if (features.includes(EX_FEATURE)) {
          let countValid = 0;
          let allFilledOk = true;

          const updated = formerPlayers.map((r) => {
            const hasName = Boolean(r.name.trim());
            const hasPhoto = Boolean(r.photoUrl);
            if (!hasName && !hasPhoto) {
              return { ...r, isBad: true, errMsg: 'اكتب اسم اللاعب واضف صورته.' };
            }
            if (hasName && hasPhoto) {
              countValid++;
              return { ...r, isBad: false, errMsg: DEF_EX_MSG };
            }
            allFilledOk = false;
            return {
              ...r,
              isBad: true,
              errMsg: hasName ? 'اختار صورة JPG للاعب.' : 'اكتب اسم اللاعب.',
            };
          });

          setFormerPlayers(updated);
          const ok = countValid > 0 && allFilledOk;
          setBadExBox(!ok);
          if (!ok) return;
        }
        setStepIndex(4);
      } else if (stepIndex === 4) {
        const a = agemin.trim();
        const b = agemax.trim();
        const x = Number(a);
        const y = Number(b);
        const ok =
          /^\d{1,2}$/.test(a) &&
          /^\d{1,2}$/.test(b) &&
          x >= 3 &&
          y <= 60 &&
          x <= y;
        setBadAges(!ok);
        if (!ok) return;

        // Move to photos step
        setStepIndex(5);
      } else if (stepIndex === 5) {
        // Photos step completed
        finish();
      }
    }
  };

  const handleBack = () => {
    if (stepIndex >= 0) {
      if (stepIndex === 0) {
        setStepIndex(-1);
        setAccountType(null);
      } else {
        setStepIndex((prev) => prev - 1);
      }
    } else {
      onNavigate('login');
    }
  };

  const finish = async () => {
    setIsSubmitting(true);
    try {
      if (!currentUser) {
        await signInWithGoogle();
      }

      if (accountType === 'player') {
        await registerProfile('player', {
          firstName: fn.trim(),
          lastName: ln.trim(),
          dob,
          foot,
          position: pos,
          governorate: pgov,
          city: pcity,
          address: padr,
          photoURL: profilePhoto || currentUser?.photoURL || '',
          coverURL: coverPhoto || '',
          bio: profileBio.trim(),
        });
        setDoneTxt(
          `أهلاً يا ${fn}، حسابك جاهز وتقدر تبدأ تنشر وتدور على أكاديميتك.`
        );
      } else if (accountType === 'coach') {
        await registerProfile('coach', {
          firstName: cfn.trim(),
          lastName: cln.trim(),
          title: ctitle.trim(),
          experienceYears: Number(cexp) || 0,
          specialties: c_feats,
          license: clicense,
          governorate: cgov,
          city: ccity,
          venues: cvenues,
          plans: cplans,
          ageMin: Number(cagemin) || 6,
          ageMax: Number(cagemax) || 18,
          photoURL: profilePhoto || currentUser?.photoURL || '',
          coverURL: coverPhoto || '',
          bio: profileBio.trim(),
        });
        setDoneTxt(
          `أهلاً يا كابتن ${cfn}، حسابك التدريبي جاهز وتقدر تستقبل طلبات اللاعبين.`
        );
      } else if (accountType === 'academy') {
        const academyDetails = {
          name: an.trim(),
          governorate: agov,
          city: acity,
          address: aadr,
          mapUrl: amap,
          plans,
          features,
          formerPlayers,
          ageMin: Number(agemin) || 6,
          ageMax: Number(agemax) || 18,
          photoURL: profilePhoto || currentUser?.photoURL || '',
          coverURL: coverPhoto || '',
          bio: profileBio.trim(),
        };
        await registerProfile('academy', academyDetails);
        setDoneTxt(`أكاديمية ${an} بقت على رابونا وتقدر تستقبل لاعبين.`);
      }

      setIsCompleted(true);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setGlobalError('حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى.');
      setTimeout(() => setGlobalError(''), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Academy Plan actions
  const addPlan = () => {
    setPlans((prev) => [
      ...prev,
      { id: 'p-' + Date.now(), name: '', price: '', months: 1 },
    ]);
    setBadPlans(false);
  };

  const removePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePlan = (
    id: string,
    field: 'name' | 'price' | 'months',
    val: any
  ) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
    setBadPlans(false);
  };

  // Coach Plan actions
  const addCoachPlan = () => {
    setCplans((prev) => [
      ...prev,
      { id: 'cp-' + Date.now(), name: '', price: '', months: 1 },
    ]);
    setBadCplans(false);
  };

  const removeCoachPlan = (id: string) => {
    setCplans((prev) => prev.filter((p) => p.id !== id));
  };

  const updateCoachPlan = (
    id: string,
    field: 'name' | 'price' | 'months',
    val: any
  ) => {
    setCplans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
    setBadCplans(false);
  };

  // Feature toggle
  const toggleFeature = (feat: string) => {
    setFeatures((prev) => {
      const exists = prev.includes(feat);
      const next = exists ? prev.filter((f) => f !== feat) : [...prev, feat];
      if (feat === EX_FEATURE) {
        if (!exists && formerPlayers.length === 0) {
          addFormerPlayer();
        }
        setBadExBox(false);
      }
      return next;
    });
  };

  const toggleCoachSpecialty = (sp: string) => {
    setCfeats((prev) => {
      const exists = prev.includes(sp);
      const next = exists ? prev.filter((s) => s !== sp) : [...prev, sp];
      setBadCfeats(false);
      return next;
    });
  };

  // Former Player actions
  const addFormerPlayer = () => {
    if (formerPlayers.length >= MAX_EX) return;
    setFormerPlayers((prev) => [
      ...prev,
      {
        id: 'ex-' + Date.now() + Math.random(),
        name: '',
        photoUrl: null,
        errMsg: DEF_EX_MSG,
        isBad: false,
      },
    ]);
    setBadExBox(false);
  };

  const removeFormerPlayer = (id: string) => {
    setFormerPlayers((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (filtered.length === 0) {
        setBadExBox(false);
      }
      return filtered;
    });
  };

  const updateFormerPlayerName = (id: string, val: string) => {
    setFormerPlayers((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, name: val, isBad: false, errMsg: DEF_EX_MSG }
          : item
      )
    );
    setBadExBox(false);
  };

  const handlePhotoUpload = (id: string, file: File | undefined) => {
    if (!file) return;

    if (!/\.jpe?g$/i.test(file.name) || file.type !== 'image/jpeg' || file.size > MAX_MB * 1048576) {
      setFormerPlayers((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                photoUrl: null,
                isBad: true,
                errMsg: `الصورة لازم تكون JPG وحجمها أقل من ${MAX_MB} ميجا.`,
              }
            : item
        )
      );
      return;
    }

    const url = URL.createObjectURL(file);
    setFormerPlayers((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              photoUrl: url,
              isBad: false,
              errMsg: DEF_EX_MSG,
            }
          : item
      )
    );
    setBadExBox(false);
  };


  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: 'var(--black)' }}>
      {/* Desktop side panel */}
      <aside className="panel" aria-hidden="true">
        <img className="field-photo" src="/images/football-field.jpg" alt="" />
        <h2>
          كل تمرين
          <br />
          يبدأ من هنا
        </h2>
        <p>اشترك في أكاديميتك، تابع مواعيدك، وشارك لعبك مع لاعبين ومدربين زيك.</p>
        <div className="pst">
          <div>
            <b>240+</b>
            <span>لاعب</span>
          </div>
          <div>
            <b>45+</b>
            <span>مدرب معتمد</span>
          </div>
          <div>
            <b>06</b>
            <span>أكاديميات</span>
          </div>
        </div>
      </aside>

      {/* Main wizard screen */}
      <main className="screen">
        <div className="top" style={{ position: 'relative' }}>
          <button
            className="back"
            id="back"
            aria-label="رجوع"
            onClick={handleBack}
            style={{ visibility: isCompleted ? 'hidden' : 'visible' }}
          >
            <svg viewBox="0 0 24 24">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
          <img className="brand-logo" src="/images/logo.png" alt="Rabona" />
          {accountType && currentFlow[stepIndex] === 'photos' && !isCompleted && (
            <button
              type="button"
              onClick={finish}
              disabled={isSubmitting}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--green)',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                padding: '6px 12px',
              }}
            >
              تخطي
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className={`prog ${stepIndex >= 0 && !isCompleted ? 'on' : ''}`} id="prog">
          <div className="bars" id="bars">
            {currentFlow.map((_, k) => (
              <i key={k} className={k <= stepIndex ? 'on' : ''} />
            ))}
          </div>
          <p id="ptxt">
            الخطوة {stepIndex + 1} من {currentFlow.length}
          </p>
        </div>

        {/* 0: Account Type */}
        <section className={`step ${stepIndex === -1 && !isCompleted ? 'on' : ''}`} id="s-type">
          <h1>أهلاً بيك في رابونا</h1>
          <p className="sub">اختار نوع حسابك عشان نجهّز لك التجربة المناسبة.</p>

          {!currentUser && (
            <button
              type="button"
              className="btn ghost"
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (e) {
                  console.error(e);
                }
              }}
              style={{ width: '100%', margin: '14px 0', height: 46, gap: 10, fontSize: 14 }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/>
                <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/>
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
              </svg>
              المتابعة بحساب جوجل أولاً
            </button>
          )}

          <div className="fields">
            <button
              className="opt type"
              data-t="player"
              type="button"
              onClick={() => {
                setAccountType('player');
                setStepIndex(0);
              }}
            >
              <svg viewBox="0 0 24 24" style={{ fill: 'var(--green)', stroke: 'none' }}>
                <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2ZM5.15,9.77l-1,.8a7.93,7.93,0,0,1,.67-2Zm1.38,1.46,1.63.54.73,2.92L7.76,15.82l-2.84-.11a7.93,7.93,0,0,1-.83-2.55Zm1.23,6.6L8.22,19a8,8,0,0,1-1.74-1.27Zm2.37-6.39L12,10.2l1.86,1.24L13.22,14H10.78Zm6.09,6.39,1.29-.05A8,8,0,0,1,15.78,19Zm2.85-2.12-2.84.11-1.13-1.13.73-2.92,1.63-.54,2.44,1.93A7.93,7.93,0,0,1,19.08,15.71Zm-.23-5.94.35-1.24a7.93,7.93,0,0,1,.67,2ZM17.72,6.41l-.81,2.9-1.75.58L13,8.47V6.54l2.54-1.7A8,8,0,0,1,17.72,6.41ZM13.08,4.08,12,4.8l-1.08-.72A8,8,0,0,1,12,4,8,8,0,0,1,13.08,4.08Zm-4.62.76L11,6.54V8.47L8.85,9.9,7.1,9.31l-.81-2.9A8,8,0,0,1,8.46,4.84Zm2.2,15-1.11-3,.87-.87h3.17l.87.87-1.11,3a7.46,7.46,0,0,1-2.68,0Z" />
              </svg>
              <span>
                لاعب
                <small>انشر صورك وأخبارك واشترك في الأكاديميات ومع المدربين</small>
              </span>
            </button>
            <button
              className="opt type"
              data-t="coach"
              type="button"
              onClick={() => {
                setAccountType('coach');
                setStepIndex(0);
              }}
            >
              <svg viewBox="0 0 256 190" style={{ fill: 'var(--green)', stroke: 'none' }}>
                <path d="M48.12,27.903C48.12,13.564,59.592,2,74.023,2c14.339,0,25.903,11.564,25.903,25.903 C99.834,42.335,88.27,53.806,74.023,53.806C59.684,53.806,48.12,42.242,48.12,27.903z M191,139h-47V97c0-20.461-17.881-37-38-37H43 C20.912,60,1.99,79.14,2,98v77c-0.026,8.533,6.001,12.989,12,13c6.014,0.011,12-4.445,12-13v-75h8v88h78v-88h8l0.081,50.37 c-0.053,8.729,5.342,12.446,10.919,12.63h60C207.363,163,207.363,139,191,139z M254,79.761c0,26.94-21.918,48.858-48.858,48.858 s-48.858-21.918-48.858-48.858c0-25.024,18.912-45.711,43.193-48.528v-6.184h-6.755V13.34h25.667v11.708h-7.205v6.228 c5.431,0.673,10.588,2.24,15.319,4.55l4.113-6.524l9.904,6.243l-4.186,6.639C247.121,51.154,254,64.669,254,79.761z M242.301,79.761 c0-20.489-16.669-37.159-37.159-37.159s-37.159,16.669-37.159,37.159s16.669,37.159,37.159,37.159S242.301,100.25,242.301,79.761z M205.331,49.365v30.17h30.17C235.322,62.93,221.959,49.444,205.331,49.365z" />
              </svg>
              <span>
                مدرب
                <small>قدّم تدريباتك الخاصة وحدد أسعارك واستقبل اللاعبين</small>
              </span>
            </button>
          </div>
          <p className="foot">
            عندك حساب؟{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              style={{
                background: 'none',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                color: 'var(--green)',
                fontWeight: 700,
              }}
            >
              سجّل دخولك
            </button>
          </p>
        </section>

        {/* ── PLAYER FLOW ── */}
        {/* p1 */}
        <section
          className={`step ${accountType === 'player' && stepIndex === 0 && !isCompleted ? 'on' : ''}`}
          id="p1"
        >
          <h1>إحنا نعرفك</h1>
          <p className="sub">اكتب اسمك وتاريخ ميلادك.</p>
          <div className="fields">
            <div className="two">
              <div className={badFn ? 'bad' : ''} data-f>
                <label htmlFor="fn">الاسم الأول</label>
                <div className="in">
                  <input
                    id="fn"
                    autoComplete="given-name"
                    value={fn}
                    onChange={(e) => {
                      setFn(e.target.value);
                      setBadFn(false);
                    }}
                  />
                </div>
                <p className="err">اكتب الاسم الأول.</p>
              </div>
              <div className={badLn ? 'bad' : ''} data-f>
                <label htmlFor="ln">الاسم الأخير</label>
                <div className="in">
                  <input
                    id="ln"
                    autoComplete="family-name"
                    value={ln}
                    onChange={(e) => {
                      setLn(e.target.value);
                      setBadLn(false);
                    }}
                  />
                </div>
                <p className="err">اكتب الاسم الأخير.</p>
              </div>
            </div>
            <div className={badDob ? 'bad' : ''} data-f>
              <label htmlFor="dob">تاريخ الميلاد</label>
              <div className="in">
                <input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value);
                    setBadDob(false);
                  }}
                />
              </div>
              <p className="err" id="dobErr">
                اختار تاريخ ميلاد صحيح.
              </p>
            </div>
          </div>
        </section>

        {/* p2 */}
        <section
          className={`step ${accountType === 'player' && stepIndex === 1 && !isCompleted ? 'on' : ''}`}
          id="p2"
        >
          <h1>إزاي بتلعب؟</h1>
          <p className="sub">اختار قدمك المفضلة ومركزك في الملعب.</p>
          <div className="fields">
            <div className={`opts ${badFoot ? 'bad' : ''}`} id="foot" data-f>
              <div className="lb" style={{ gridColumn: '1/-1', margin: 0 }}>
                القدم المفضلة
              </div>
              <button
                className={`opt ${foot === 'يمنى' ? 'on' : ''}`}
                type="button"
                onClick={() => {
                  setFoot('يمنى');
                  setBadFoot(false);
                }}
              >
                يمنى
              </button>
              <button
                className={`opt ${foot === 'يسرى' ? 'on' : ''}`}
                type="button"
                onClick={() => {
                  setFoot('يسرى');
                  setBadFoot(false);
                }}
              >
                يسرى
              </button>
              <p className="err" style={{ gridColumn: '1/-1' }}>
                اختار القدم المفضلة.
              </p>
            </div>

            <div className={badPos ? 'bad' : ''} id="pos" data-f>
              <div className="lb">المركز · اضغط على مكانك في الملعب</div>
              <div className="pitchbox">
                <svg viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden="true">
                  <rect x="10" y="10" width="280" height="380" />
                  <line x1="10" y1="200" x2="290" y2="200" />
                  <circle cx="150" cy="200" r="38" />
                  <rect x="75" y="10" width="150" height="62" />
                  <rect x="75" y="328" width="150" height="62" />
                  <rect x="115" y="10" width="70" height="26" />
                  <rect x="115" y="364" width="70" height="26" />
                </svg>
                {POSITIONS.map((p) => (
                  <button
                    key={p.id}
                    className={`pp ${pos === p.val ? 'on' : ''}`}
                    type="button"
                    style={{ left: p.left, top: p.top }}
                    onClick={() => {
                      setPos(p.val);
                      setBadPos(false);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="possel" id="posSel">
                {pos ? (
                  <span>
                    مركزك: <b>{pos}</b>
                  </span>
                ) : (
                  'لسه ما اخترتش مركزك'
                )}
              </p>
              <p className="err">اختار مركزك.</p>
            </div>
          </div>
        </section>

        {/* p3 */}
        <section
          className={`step ${accountType === 'player' && stepIndex === 2 && !isCompleted ? 'on' : ''}`}
          id="p3"
        >
          <h1>ساكن فين؟</h1>
          <p className="sub">بنستخدم عنوانك عشان نقترح عليك أقرب الأكاديميات والمدربين.</p>
          <div className="fields">
            <div className={badPgov ? 'bad' : ''} data-f>
              <label htmlFor="pgov">المحافظة</label>
              <div className="in">
                <select
                  id="pgov"
                  value={pgov}
                  onChange={(e) => {
                    setPgov(e.target.value);
                    setBadPgov(false);
                  }}
                >
                  <option value="">اختار المحافظة</option>
                  {GOVS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <p className="err">اختار المحافظة.</p>
            </div>

            <div className={badPcity ? 'bad' : ''} data-f>
              <label htmlFor="pcity">المنطقة / المدينة</label>
              <div className="in">
                <input
                  id="pcity"
                  value={pcity}
                  onChange={(e) => {
                    setPcity(e.target.value);
                    setBadPcity(false);
                  }}
                />
              </div>
              <p className="err">اكتب المنطقة أو المدينة.</p>
            </div>

            <div className={badPadr ? 'bad' : ''} data-f>
              <label htmlFor="padr">عنوان البيت</label>
              <div className="in">
                <input
                  id="padr"
                  placeholder="الحي، الشارع، رقم العمارة"
                  value={padr}
                  onChange={(e) => {
                    setPadr(e.target.value);
                    setBadPadr(false);
                  }}
                />
              </div>
              <p className="err">اكتب العنوان بالتفصيل.</p>
            </div>
          </div>
        </section>

        {/* ── COACH FLOW ── */}
        {/* c1: Coach personal info */}
        <section
          className={`step ${accountType === 'coach' && stepIndex === 0 && !isCompleted ? 'on' : ''}`}
          id="c1"
        >
          <h1>إحنا نعرفك يا كابتن</h1>
          <p className="sub">اكتب اسمك، مسمّاك التدريبي، وسنوات خبرتك في الملاعب.</p>
          <div className="fields">
            <div className="two">
              <div className={badCfn ? 'bad' : ''} data-f>
                <label htmlFor="cfn">الاسم الأول</label>
                <div className="in">
                  <input
                    id="cfn"
                    autoComplete="given-name"
                    placeholder="كابتن أحمد"
                    value={cfn}
                    onChange={(e) => {
                      setCfn(e.target.value);
                      setBadCfn(false);
                    }}
                  />
                </div>
                <p className="err">اكتب الاسم الأول.</p>
              </div>
              <div className={badCln ? 'bad' : ''} data-f>
                <label htmlFor="cln">الاسم الأخير</label>
                <div className="in">
                  <input
                    id="cln"
                    autoComplete="family-name"
                    placeholder="فؤاد"
                    value={cln}
                    onChange={(e) => {
                      setCln(e.target.value);
                      setBadCln(false);
                    }}
                  />
                </div>
                <p className="err">اكتب الاسم الأخير.</p>
              </div>
            </div>

            <div className={badCtitle ? 'bad' : ''} data-f>
              <label htmlFor="ctitle">المسمى التدريبي</label>
              <div className="in">
                <input
                  id="ctitle"
                  placeholder="مثال: مدرب مهارات وهجوم / مدرب لياقة وبدني"
                  value={ctitle}
                  onChange={(e) => {
                    setCtitle(e.target.value);
                    setBadCtitle(false);
                  }}
                />
              </div>
              <p className="err">اكتب المسمى التدريبي.</p>
            </div>

            <div className={badCexp ? 'bad' : ''} data-f>
              <label htmlFor="cexp">سنوات الخبرة التدريبية</label>
              <div className="in">
                <input
                  id="cexp"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={50}
                  placeholder="مثال: 5"
                  value={cexp}
                  onChange={(e) => {
                    setCexp(e.target.value);
                    setBadCexp(false);
                  }}
                />
              </div>
              <p className="err">اكتب عدد سنوات خبرة صحيح.</p>
            </div>
          </div>
        </section>

        {/* c2: Coach specialties and license */}
        <section
          className={`step ${accountType === 'coach' && stepIndex === 1 && !isCompleted ? 'on' : ''}`}
          id="c2"
        >
          <h1>التخصص والشهادات</h1>
          <p className="sub">اختار تخصصاتك التدريبية ورخصتك عشان يسهل على اللاعبين العثور عليك.</p>
          <div className="fields">
            <div data-f className={badCfeats ? 'bad' : ''}>
              <div className="lb">التخصصات التدريبية (اختار ما ينطبق)</div>
              <div
                className="chips"
                id="cfeats"
                role="group"
                aria-label="تخصصات المدرب"
              >
                {COACH_SPECIALTIES.map((sp) => {
                  const isOn = c_feats.includes(sp);
                  return (
                    <button
                      key={sp}
                      className={`chip ${isOn ? 'on' : ''}`}
                      type="button"
                      data-v={sp}
                      aria-pressed={isOn}
                      onClick={() => toggleCoachSpecialty(sp)}
                    >
                      {sp}
                    </button>
                  );
                })}
              </div>
              <p className="err">اختار تخصص تدريبي واحد على الأقل.</p>
            </div>

            <div data-f>
              <label htmlFor="clicense">الشهادة أو الرخصة التدريبية</label>
              <div className="in">
                <select
                  id="clicense"
                  value={clicense}
                  onChange={(e) => setClicense(e.target.value)}
                >
                  <option value="">اختار الشهادة أو الرخصة التدريبية (اختياري)</option>
                  {COACH_LICENSES.map((lic) => (
                    <option key={lic} value={lic}>
                      {lic}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* c3: Coach locations & venues */}
        <section
          className={`step ${accountType === 'coach' && stepIndex === 2 && !isCompleted ? 'on' : ''}`}
          id="c3"
        >
          <h1>أماكن التدريب</h1>
          <p className="sub">حدد المحافظة والمنطقة والملاعب اللي بتقدّم فيها حصصك التدريبية.</p>
          <div className="fields">
            <div className={badCgov ? 'bad' : ''} data-f>
              <label htmlFor="cgov">المحافظة</label>
              <div className="in">
                <select
                  id="cgov"
                  value={cgov}
                  onChange={(e) => {
                    setCgov(e.target.value);
                    setBadCgov(false);
                  }}
                >
                  <option value="">اختار المحافظة</option>
                  {GOVS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <p className="err">اختار المحافظة.</p>
            </div>

            <div className={badCcity ? 'bad' : ''} data-f>
              <label htmlFor="ccity">المنطقة / المدينة</label>
              <div className="in">
                <input
                  id="ccity"
                  placeholder="مثال: مدينة نصر / التجمع الخامس"
                  value={ccity}
                  onChange={(e) => {
                    setCcity(e.target.value);
                    setBadCcity(false);
                  }}
                />
              </div>
              <p className="err">اكتب المنطقة أو المدينة.</p>
            </div>

            <div className={badCvenues ? 'bad' : ''} data-f>
              <label htmlFor="cvenues">الملاعب وأماكن التدريب المفضلة</label>
              <div className="in">
                <input
                  id="cvenues"
                  placeholder="مثال: ملاعب النادي الأهلي، مركز شباب الجزيرة، أو ملعب يختاره اللاعب"
                  value={cvenues}
                  onChange={(e) => {
                    setCvenues(e.target.value);
                    setBadCvenues(false);
                  }}
                />
              </div>
              <p className="hint">اكتب الملاعب اللي متعود تدرب فيها أو لو متاح تدرب في ملعب يختاره اللاعب.</p>
              <p className="err">اكتب أماكن أو ملاعب التدريب.</p>
            </div>
          </div>
        </section>

        {/* c4: Coach pricing plans */}
        <section
          className={`step ${accountType === 'coach' && stepIndex === 3 && !isCompleted ? 'on' : ''}`}
          id="c4"
        >
          <h1>أسعار الحصص والاشتراكات</h1>
          <p className="sub">حدد أسعار حصص التدريب الفردي (Private) أو باقات التدريب الشهرية.</p>
          <div className="fields">
            <div className={badCplans ? 'bad' : ''} data-f id="cplans">
              <div id="cplist">
                {cplans.map((p) => (
                  <div key={p.id} className="plan">
                    <div className="plan-h">
                      <span className="lb">باقة تدريب</span>
                      <button
                        className="del"
                        type="button"
                        aria-label="حذف الباقة"
                        onClick={() => removeCoachPlan(p.id)}
                      >
                        ×
                      </button>
                    </div>
                    <div>
                      <span className="lb">اسم الباقة أو الحصة</span>
                      <div className="in">
                        <input
                          className="pn"
                          aria-label="اسم الباقة"
                          placeholder="مثال: حصة برايفت فردية"
                          value={p.name}
                          onChange={(e) =>
                            updateCoachPlan(p.id, 'name', e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="two">
                      <div>
                        <span className="lb">السعر (ج)</span>
                        <div className="in">
                          <input
                            className="pv"
                            aria-label="سعر الباقة بالجنيه"
                            type="number"
                            inputMode="numeric"
                            min="0"
                            placeholder="0"
                            value={p.price}
                            onChange={(e) =>
                              updateCoachPlan(p.id, 'price', e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <span className="lb">مدة الاشتراك</span>
                        <div className="in">
                          <select
                            className="pd"
                            aria-label="مدة الاشتراك"
                            value={p.months}
                            onChange={(e) =>
                              updateCoachPlan(p.id, 'months', Number(e.target.value))
                            }
                          >
                            {DUR.map(([v, t]) => (
                              <option key={v} value={v}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="add"
                id="addCoachPlan"
                type="button"
                onClick={addCoachPlan}
              >
                + إضافة باقة تدريب
              </button>
              <p className="err" id="cplanErr">
                أضف باقة واحدة على الأقل باسم وسعر صحيحين.
              </p>
            </div>
          </div>
        </section>

        {/* c5: Coach age group */}
        <section
          className={`step ${accountType === 'coach' && stepIndex === 4 && !isCompleted ? 'on' : ''}`}
          id="c5"
        >
          <h1>الأعمار المقبولة</h1>
          <p className="sub">من سن كام لسن كام بتستقبل لاعبين للتدريب الخاص؟</p>
          <div className="fields">
            <div className={badCages ? 'bad' : ''} data-f id="cages">
              <div className="two">
                <div>
                  <label htmlFor="cagemin">من سن</label>
                  <div className="in">
                    <input
                      id="cagemin"
                      type="number"
                      inputMode="numeric"
                      min={3}
                      max={60}
                      placeholder="مثال: 7"
                      value={cagemin}
                      onChange={(e) => {
                        setCagemin(e.target.value);
                        setBadCages(false);
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="cagemax">إلى سن</label>
                  <div className="in">
                    <input
                      id="cagemax"
                      type="number"
                      inputMode="numeric"
                      min={3}
                      max={60}
                      placeholder="مثال: 22"
                      value={cagemax}
                      onChange={(e) => {
                        setCagemax(e.target.value);
                        setBadCages(false);
                      }}
                    />
                  </div>
                </div>
              </div>
              <p className="err">
                اكتب سن صحيح بين 3 و60، والسن الأول لازم يكون أصغر من أو يساوي الأخير.
              </p>
            </div>
          </div>
        </section>

        {/* ── ACADEMY FLOW ── */}
        {/* a1 */}
        <section
          className={`step ${accountType === 'academy' && stepIndex === 0 && !isCompleted ? 'on' : ''}`}
          id="a1"
        >
          <h1>اسم أكاديميتك</h1>
          <p className="sub">ده الاسم اللي هيظهر للاعبين.</p>
          <div className="fields">
            <div className={badAn ? 'bad' : ''} data-f>
              <label htmlFor="an">اسم الأكاديمية</label>
              <div className="in">
                <input
                  id="an"
                  placeholder="مثال: أكاديمية النجوم"
                  value={an}
                  onChange={(e) => {
                    setAn(e.target.value);
                    setBadAn(false);
                  }}
                />
              </div>
              <p className="err">اكتب اسم الأكاديمية.</p>
            </div>
          </div>
        </section>

        {/* a2 */}
        <section
          className={`step ${accountType === 'academy' && stepIndex === 1 && !isCompleted ? 'on' : ''}`}
          id="a2"
        >
          <h1>مكان الأكاديمية</h1>
          <p className="sub">عشان اللاعبين يوصلولك بسهولة.</p>
          <div className="fields">
            <div className={badAgov ? 'bad' : ''} data-f>
              <label htmlFor="agov">المحافظة</label>
              <div className="in">
                <select
                  id="agov"
                  value={agov}
                  onChange={(e) => {
                    setAgov(e.target.value);
                    setBadAgov(false);
                  }}
                >
                  <option value="">اختار المحافظة</option>
                  {GOVS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <p className="err">اختار المحافظة.</p>
            </div>

            <div className={badAcity ? 'bad' : ''} data-f>
              <label htmlFor="acity">المنطقة / المدينة</label>
              <div className="in">
                <input
                  id="acity"
                  value={acity}
                  onChange={(e) => {
                    setAcity(e.target.value);
                    setBadAcity(false);
                  }}
                />
              </div>
              <p className="err">اكتب المنطقة أو المدينة.</p>
            </div>

            <div className={badAadr ? 'bad' : ''} data-f>
              <label htmlFor="aadr">عنوان الأكاديمية</label>
              <div className="in">
                <input
                  id="aadr"
                  placeholder="اسم الشارع أو أقرب علامة مميزة"
                  value={aadr}
                  onChange={(e) => {
                    setAadr(e.target.value);
                    setBadAadr(false);
                  }}
                />
              </div>
              <p className="err">اكتب العنوان بالتفصيل.</p>
            </div>

            <div className={badAmap ? 'bad' : ''} data-f>
              <label htmlFor="amap">
                لينك جوجل مابس{' '}
                <span style={{ color: 'var(--muted)', fontWeight: 400 }}>
                  (اختياري)
                </span>
              </label>
              <div className="in">
                <input
                  id="amap"
                  type="text"
                  inputMode="url"
                  dir="ltr"
                  autoComplete="off"
                  placeholder="https://maps.app.goo.gl/..."
                  style={{ textAlign: 'left' }}
                  value={amap}
                  onChange={(e) => {
                    setAmap(e.target.value);
                    setBadAmap(false);
                  }}
                />
              </div>
              <p className="hint">
                افتح مكان الأكاديمية على جوجل مابس، اضغط مشاركة، وانسخ اللينك.
              </p>
              <p className="err">اللينك ده مش لينك جوجل مابس صحيح.</p>
            </div>
          </div>
        </section>

        {/* a3 */}
        <section
          className={`step ${accountType === 'academy' && stepIndex === 2 && !isCompleted ? 'on' : ''}`}
          id="a3"
        >
          <h1>الأسعار ومدة الاشتراك</h1>
          <p className="sub">
            أضف الباقات اللي بتقدمها، وحدد سعر ومدة كل باقة. تقدر تعدّلها بعدين.
          </p>
          <div className="fields">
            <div className={badPlans ? 'bad' : ''} data-f id="plans">
              <div id="plist">
                {plans.map((p) => (
                  <div key={p.id} className="plan">
                    <div className="plan-h">
                      <span className="lb">باقة</span>
                      <button
                        className="del"
                        type="button"
                        aria-label="حذف الباقة"
                        onClick={() => removePlan(p.id)}
                      >
                        ×
                      </button>
                    </div>
                    <div>
                      <span className="lb">اسم الباقة</span>
                      <div className="in">
                        <input
                          className="pn"
                          aria-label="اسم الباقة"
                          placeholder="اشتراك شهري"
                          value={p.name}
                          onChange={(e) =>
                            updatePlan(p.id, 'name', e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="two">
                      <div>
                        <span className="lb">السعر (ج)</span>
                        <div className="in">
                          <input
                            className="pv"
                            aria-label="سعر الباقة بالجنيه"
                            type="number"
                            inputMode="numeric"
                            min="0"
                            placeholder="0"
                            value={p.price}
                            onChange={(e) =>
                              updatePlan(p.id, 'price', e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <span className="lb">مدة الاشتراك</span>
                        <div className="in">
                          <select
                            className="pd"
                            aria-label="مدة الاشتراك"
                            value={p.months}
                            onChange={(e) =>
                              updatePlan(p.id, 'months', Number(e.target.value))
                            }
                          >
                            {DUR.map(([v, t]) => (
                              <option key={v} value={v}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="add"
                id="addPlan"
                type="button"
                onClick={addPlan}
              >
                + إضافة باقة
              </button>
              <p className="err" id="planErr">
                أضف باقة واحدة على الأقل باسم وسعر صحيحين.
              </p>
            </div>
          </div>
        </section>

        {/* a4 */}
        <section
          className={`step ${accountType === 'academy' && stepIndex === 3 && !isCompleted ? 'on' : ''}`}
          id="a4"
        >
          <h1>مميزات الأكاديمية</h1>
          <p className="sub">
            اختار اللي بتقدمه أكاديميتك. الاختيار اختياري، ولو مفيش ممكن تكمّل عادي.
          </p>
          <div className="fields">
            <div
              className="chips"
              id="feats"
              role="group"
              aria-label="مميزات الأكاديمية"
            >
              {ACADEMY_FEATURES.map((feat) => {
                const isOn = features.includes(feat);
                return (
                  <button
                    key={feat}
                    className={`chip ${isOn ? 'on' : ''}`}
                    type="button"
                    data-v={feat}
                    aria-pressed={isOn}
                    onClick={() => toggleFeature(feat)}
                  >
                    {feat}
                  </button>
                );
              })}
            </div>

            {/* Former players box */}
            {features.includes(EX_FEATURE) && (
              <div className={`exbox ${badExBox ? 'bad' : ''}`} id="exBox" data-f>
                <div className="lb">اللاعبين السابقين</div>
                <p className="hint" style={{ margin: '-4px 0 12px' }}>
                  اكتب اسم اللاعب وأضف صورته بصيغة JPG.
                </p>
                <div id="exlist">
                  {formerPlayers.map((r) => (
                    <div key={r.id} className={`ex ${r.isBad ? 'bad' : ''}`}>
                      <label className={`ph ${r.photoUrl ? 'has' : ''}`}>
                        {r.photoUrl ? (
                          <img src={r.photoUrl} alt="" />
                        ) : (
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                            <circle cx="12" cy="13" r="3.5" />
                          </svg>
                        )}
                        <input
                          className="exf"
                          type="file"
                          accept=".jpg,.jpeg,image/jpeg"
                          aria-label="صورة اللاعب (JPG)"
                          onChange={(e) =>
                            handlePhotoUpload(r.id, e.target.files?.[0])
                          }
                        />
                      </label>
                      <div className="in">
                        <input
                          className="exn"
                          placeholder="اسم اللاعب"
                          aria-label="اسم اللاعب"
                          value={r.name}
                          onChange={(e) =>
                            updateFormerPlayerName(r.id, e.target.value)
                          }
                        />
                      </div>
                      <button
                        className="del"
                        type="button"
                        aria-label="حذف اللاعب"
                        onClick={() => removeFormerPlayer(r.id)}
                      >
                        ×
                      </button>
                      <p className="exm">{r.errMsg}</p>
                    </div>
                  ))}
                </div>
                {formerPlayers.length < MAX_EX && (
                  <button
                    className="add"
                    id="addEx"
                    type="button"
                    onClick={addFormerPlayer}
                  >
                    + إضافة لاعب
                  </button>
                )}
                <p className="err">
                  أضف لاعب واحد على الأقل باسمه وصورته، أو الغي اختيار &quot;لاعبين سابقين&quot;.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* a5 */}
        <section
          className={`step ${accountType === 'academy' && stepIndex === 4 && !isCompleted ? 'on' : ''}`}
          id="a5"
        >
          <h1>الأعمار المقبولة</h1>
          <p className="sub">من سن كام لسن كام بتستقبل لاعبين؟</p>
          <div className="fields">
            <div className={badAges ? 'bad' : ''} data-f id="ages">
              <div className="two">
                <div>
                  <label htmlFor="agemin">من سن</label>
                  <div className="in">
                    <input
                      id="agemin"
                      type="number"
                      inputMode="numeric"
                      min={3}
                      max={60}
                      placeholder="مثال: 6"
                      value={agemin}
                      onChange={(e) => {
                        setAgemin(e.target.value);
                        setBadAges(false);
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="agemax">إلى سن</label>
                  <div className="in">
                    <input
                      id="agemax"
                      type="number"
                      inputMode="numeric"
                      min={3}
                      max={60}
                      placeholder="مثال: 18"
                      value={agemax}
                      onChange={(e) => {
                        setAgemax(e.target.value);
                        setBadAges(false);
                      }}
                    />
                  </div>
                </div>
              </div>
              <p className="err">
                اكتب سن صحيح بين 3 و60، والسن الأول لازم يكون أصغر من أو يساوي الأخير.
              </p>
            </div>
          </div>
        </section>

        {/* ── PHOTOS & COVER STEP ── */}
        <section
          className={`step ${currentFlow[stepIndex] === 'photos' && !isCompleted ? 'on' : ''}`}
          id="photos"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>صورة الحساب والغلاف</h1>
            <button
              type="button"
              onClick={finish}
              disabled={isSubmitting}
              style={{
                background: 'transparent',
                border: 0,
                color: 'var(--green)',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              تخطي
            </button>
          </div>
          <p className="sub">أضف صورتك الشخصية وصورة الغلاف لتمييز حسابك (اختياري).</p>

          <div className="fields" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Cover Upload */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 700 }}>
                صورة الغلاف (Cover Photo)
              </label>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '140px',
                  borderRadius: '14px',
                  background: 'var(--surface2)',
                  border: '1px dashed var(--line)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {coverPhoto ? (
                  <img
                    src={coverPhoto}
                    alt="Cover"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 6px', display: 'block' }}>
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                    <span>اضغط هنا لاختيار صورة الغلاف</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const compressed = await compressImage(file, 1000, 450, 0.82);
                        setCoverPhoto(compressed);
                      } catch {
                        const reader = new FileReader();
                        reader.onload = () => setCoverPhoto(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                  }}
                />
              </div>
            </div>

            {/* Profile Picture Upload */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 700 }}>
                صورة البروفايل
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'var(--surface2)',
                    border: '1px dashed var(--line)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const compressed = await compressImage(file, 400, 400, 0.82);
                          setProfilePhoto(compressed);
                        } catch {
                          const reader = new FileReader();
                          reader.onload = () => setProfilePhoto(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }
                    }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  اضغط على الدائرة لاختيار صورتك الشخصية. تقدر تغيرها في أي وقت من ملفك الشخصي.
                </div>
              </div>
            </div>

            {/* Bio textarea */}
            <div>
              <label htmlFor="bioInput" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 700 }}>
                نبذة تعريفية (Bio)
              </label>
              <div className="in">
                <textarea
                  id="bioInput"
                  rows={3}
                  placeholder="اكتب نبذة قصيرة عنك أو عن مهاراتك وأهدافك..."
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 0,
                    outline: 'none',
                    color: 'var(--white)',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    padding: '8px 0',
                    resize: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── DONE SCREEN ── */}
        <section className={`step done ${isCompleted ? 'on' : ''}`} id="done">
          <div className="ok">
            <svg viewBox="0 0 24 24">
              <path d="m5 12 5 5 9-10" />
            </svg>
          </div>
          <h1 style={{ marginTop: '12px' }}>تم إنشاء حسابك</h1>
          <p className="sub" id="doneTxt">
            {doneTxt}
          </p>
          <div
            className="nav"
            style={{
              justifyContent: 'center',
              width: '100%',
              maxWidth: '300px',
              margin: '24px auto 0',
            }}
          >
            <button
              className="btn"
              type="button"
              onClick={() => onNavigate('home')}
            >
              ابدأ الآن
            </button>
          </div>
        </section>

        {/* ── Bottom Stepper Button ── */}
        {stepIndex >= 0 && !isCompleted && (
          <div className="nav" id="nav">
            <button
              className="btn"
              id="next"
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'جاري حفظ البيانات...'
                : stepIndex === currentFlow.length - 1
                ? 'إنشاء الحساب'
                : 'التالي'}
            </button>
            {globalError && (
              <p className="err" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
                {globalError}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
