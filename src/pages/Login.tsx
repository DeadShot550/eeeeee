import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, GraduationCap, Lock, ShieldCheck, User } from 'lucide-react';
import Crest from '../components/Crest';
import FloatingObjects from '../components/FloatingObjects';
import { Button, Field, Input } from '../components/ui';
import { useAuth, type Role } from '../lib/auth';
import { errMsg } from '../lib/api';

export default function Login() {
  const [params] = useSearchParams();
  const [role, setRole] = useState<Role>(params.get('as') === 'admin' ? 'admin' : 'student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const auth = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!auth.loading && auth.user && auth.role) nav(auth.role === 'admin' ? '/admin' : '/student', { replace: true });
  }, [auth.loading, auth.user, auth.role, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!username.trim() || !password) {
      setErr('Please enter your username and password.');
      return;
    }
    setBusy(true);
    try {
      const r = await auth.login(role, username.trim(), password);
      nav(r === 'admin' ? '/admin' : '/student', { replace: true });
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy text-cream grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-14 overflow-hidden border-r border-gold/15">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(201,169,97,0.16),transparent_55%)]" />
        <div className="absolute inset-0 grid-pattern" />
        <FloatingObjects />
        <Link to="/" className="relative flex items-center gap-3">
          <Crest size={48} />
          <div>
            <p className="font-display text-2xl font-semibold leading-none">Aurelius</p>
            <p className="text-[9px] uppercase tracking-[0.35em] text-gold">Academy · Est. 1924</p>
          </div>
        </Link>
        <div className="relative">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9 }} className="font-display text-6xl leading-[0.95]">
            One portal.<br />Every <em className="gold-text not-italic">chapter</em> of the journey.
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-mist mt-6 max-w-md">
            Scholars access syllabi, timetables, results and fees. Administrators steward the whole academy from a single console.
          </motion.p>
        </div>
        <p className="relative text-[10px] uppercase tracking-[0.3em] text-mist/60">Secure access · Sessions expire after 7 days</p>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center p-6 sm:p-12 dark-inputs">
        <div className="absolute inset-0 lg:hidden">
          <FloatingObjects density="light" />
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="relative w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-10">
            <Crest size={40} />
            <p className="font-display text-2xl font-semibold">Aurelius Academy</p>
          </Link>

          <div className="inline-flex p-1 rounded-full border border-gold/30 bg-navy-2/70 mb-8">
            {(['student', 'admin'] as Role[]).map((r) => (
              <button key={r} type="button" onClick={() => { setRole(r); setErr(''); }} className={`relative px-5 py-2 rounded-full text-xs uppercase tracking-[0.18em] flex items-center gap-2 transition-colors ${role === r ? 'text-navy' : 'text-cream/70'}`}>
                {role === r && <motion.span layoutId="role-pill" className="absolute inset-0 bg-gold rounded-full" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
                <span className="relative flex items-center gap-2">
                  {r === 'student' ? <GraduationCap className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  {r === 'student' ? 'Student' : 'Administrator'}
                </span>
              </button>
            ))}
          </div>

          <p className="text-[11px] uppercase tracking-[0.3em] text-gold">{role === 'student' ? 'Student Portal' : 'Administration'}</p>
          <h1 className="font-display text-4xl sm:text-5xl mt-2">{role === 'student' ? 'Welcome back, scholar.' : 'Sign in as Administrator'}</h1>
          <p className="text-mist text-sm mt-3">{role === 'student' ? 'Use the unique login issued by the school office.' : 'Complete control over students, classes, admissions and results.'}</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <Field label={role === 'admin' ? 'Admin username' : 'Username'}>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mist" />
                <Input value={username} onChange={(e) => setUsername(e.target.value)} className="pl-11" placeholder={role === 'admin' ? 'admin' : 'e.g. aarav.mehta'} autoComplete="username" />
              </div>
            </Field>
            <Field label="Password">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mist" />
                <Input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-11" placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-mist hover:text-gold" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            {err && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-ruby bg-ruby/10 border border-ruby/30 rounded-xl px-4 py-2.5">
                {err}
              </motion.p>
            )}
            <Button type="submit" size="lg" loading={busy} className="w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-8 rounded-2xl border border-gold/15 bg-navy-2/60 p-4 text-xs text-mist leading-relaxed">
            <p className="text-gold uppercase tracking-[0.2em] text-[10px] mb-2">Demo credentials</p>
            {role === 'admin' ? (
              <p>
                Administrator · <code className="text-cream">admin</code> / <code className="text-cream">admin@123</code>
              </p>
            ) : (
              <p>
                Student · <code className="text-cream">aarav.mehta</code> / <code className="text-cream">student123</code>
                <br />
                <span className="text-mist/70">Real students receive a unique login from the administrator.</span>
              </p>
            )}
          </div>

          <p className="mt-6 text-xs text-mist">
            Not enrolled yet?{' '}
            <Link to="/admissions" className="text-gold hover:underline">
              Apply for admission
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
