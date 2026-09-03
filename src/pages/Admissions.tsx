import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Copy, FileSearch, Search, User, Users, XCircle, GraduationCap, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingObjects from '../components/FloatingObjects';
import { Button, Field, Input, Select, Textarea, Spinner, useToast } from '../components/ui';
import { api, errMsg } from '../lib/api';
import type { Admission, PublicData, SchoolClass } from '../lib/types';
import { fmtDate, fmtDateTime, GENDERS } from '../lib/utils';

const steps = [
  { id: 1, title: 'Applicant', icon: <User className="w-4 h-4" /> },
  { id: 2, title: 'Guardian', icon: <Users className="w-4 h-4" /> },
  { id: 3, title: 'Background', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 4, title: 'Review', icon: <Check className="w-4 h-4" /> },
];

interface Form {
  applicant_name: string;
  dob: string;
  gender: string;
  applying_class_id: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  address: string;
  previous_school: string;
  notes: string;
}
const empty: Form = { applicant_name: '', dob: '', gender: '', applying_class_id: '', guardian_name: '', guardian_phone: '', guardian_email: '', address: '', previous_school: '', notes: '' };

export default function Admissions() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'track' ? 'track' : 'apply';
  const [classes, setClasses] = useState<SchoolClass[] | null>(null);
  const toast = useToast();

  useEffect(() => {
    api<PublicData>('/api/public')
      .then((d) => setClasses(d.classes))
      .catch((e) => toast.push({ title: 'Could not load classes', desc: errMsg(e), tone: 'error' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-navy min-h-screen text-cream dark-inputs">
      <Navbar />
      <section className="relative pt-36 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,169,97,0.14),transparent_55%)]" />
        <FloatingObjects density="light" />
        <div className="relative max-w-4xl mx-auto px-5 text-center">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] uppercase tracking-[0.35em] text-gold">Admission Portal · 2026–27</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }} className="font-display text-5xl md:text-7xl mt-4 leading-[0.95]">
            Every great story <em className="gold-text not-italic">begins</em> with a name
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-mist mt-6 max-w-xl mx-auto">
            Submit an application in four brief steps. You will receive an application number to track our decision in real time.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-10 inline-flex p-1 rounded-full border border-gold/30 bg-navy-2/60 backdrop-blur">
            {[
              { id: 'apply', label: 'Apply for Admission', icon: <Sparkles className="w-4 h-4" /> },
              { id: 'track', label: 'Track Application', icon: <FileSearch className="w-4 h-4" /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setParams(t.id === 'track' ? { tab: 'track' } : {})}
                className={`relative inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm uppercase tracking-[0.15em] transition-colors ${tab === t.id ? 'text-navy' : 'text-cream/70 hover:text-cream'}`}
              >
                {tab === t.id && <motion.span layoutId="tab-pill" className="absolute inset-0 bg-gold rounded-full" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
                <span className="relative flex items-center gap-2">{t.icon} {t.label}</span>
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative max-w-4xl mx-auto px-5 pb-28">
        <AnimatePresence mode="wait">
          {tab === 'apply' ? (
            <motion.div key="apply" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <ApplyWizard classes={classes} onTrack={(no) => setParams({ tab: 'track', no })} />
            </motion.div>
          ) : (
            <motion.div key="track" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Tracker initial={params.get('no') || ''} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
      <Footer />
    </div>
  );
}

/* ---------------- Wizard ---------------- */
function ApplyWizard({ classes, onTrack }: { classes: SchoolClass[] | null; onTrack: (no: string) => void }) {
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Admission | null>(null);
  const toast = useToast();

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = (s: number) => {
    const er: Partial<Record<keyof Form, string>> = {};
    if (s === 1) {
      if (form.applicant_name.trim().length < 2) er.applicant_name = 'Please enter the child’s full name.';
      if (!form.dob) er.dob = 'Date of birth is required.';
      else if (new Date(form.dob) > new Date()) er.dob = 'Date of birth cannot be in the future.';
      if (!form.gender) er.gender = 'Please select an option.';
      if (!form.applying_class_id) er.applying_class_id = 'Please choose the class you are applying for.';
    }
    if (s === 2) {
      if (form.guardian_name.trim().length < 2) er.guardian_name = 'Parent / guardian name is required.';
      if (!/^[+\d][\d\s-]{7,}$/.test(form.guardian_phone.trim())) er.guardian_phone = 'Enter a valid phone number.';
      if (form.guardian_email && !/^\S+@\S+\.\S+$/.test(form.guardian_email)) er.guardian_email = 'Enter a valid email address.';
    }
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const next = () => {
    if (!validate(step)) return;
    setDir(1);
    setStep((s) => Math.min(4, s + 1));
  };
  const back = () => {
    setDir(-1);
    setStep((s) => Math.max(1, s - 1));
  };

  const submit = async () => {
    if (!validate(1) || !validate(2)) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<Admission>('/api/admissions', { method: 'POST', body: { ...form, applying_class_id: Number(form.applying_class_id) } });
      setDone(res);
      toast.push({ title: 'Application submitted', desc: `Reference ${res.application_no}`, tone: 'success' });
    } catch (e) {
      toast.push({ title: 'Submission failed', desc: errMsg(e), tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const className = useMemo(() => classes?.find((c) => String(c.id) === form.applying_class_id)?.name || '—', [classes, form.applying_class_id]);

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card-lux rounded-[2rem] p-8 sm:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,169,97,0.15),transparent_60%)]" />
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }} className="relative mx-auto w-20 h-20 rounded-full bg-gold text-navy flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>
        <p className="relative text-[11px] uppercase tracking-[0.3em] text-gold mt-8">Application received</p>
        <h2 className="relative font-display text-4xl md:text-5xl mt-2">Thank you, {done.guardian_name.split(' ')[0]}.</h2>
        <p className="relative text-mist mt-4 max-w-lg mx-auto">
          {done.applicant_name}’s application for <span className="text-cream">{done.class_name}</span> is now with our admissions office. Save the reference below to track the decision.
        </p>
        <div className="relative mt-8 inline-flex items-center gap-4 rounded-2xl border border-gold/40 bg-navy/60 px-6 py-4">
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-[0.3em] text-mist">Application number</p>
            <p className="font-display text-3xl text-gold tracking-wider">{done.application_no}</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(done.application_no);
              toast.push({ title: 'Copied to clipboard', tone: 'success' });
            }}
            className="p-2 rounded-full border border-gold/30 text-gold hover:bg-gold hover:text-navy transition-colors"
            aria-label="Copy"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <div className="relative mt-10 flex flex-wrap justify-center gap-3">
          <Button onClick={() => onTrack(done.application_no)} icon={<FileSearch className="w-4 h-4" />}>
            Track this application
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setDone(null);
              setForm(empty);
              setStep(1);
            }}
          >
            Submit another
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="card-lux rounded-[2rem] overflow-hidden">
      {/* Stepper */}
      <div className="grid grid-cols-4 border-b border-gold/15">
        {steps.map((s) => {
          const active = s.id === step;
          const complete = s.id < step;
          return (
            <button key={s.id} onClick={() => s.id < step && setStep(s.id)} className={`relative flex flex-col sm:flex-row items-center justify-center gap-2 py-4 px-2 text-[10px] sm:text-xs uppercase tracking-[0.15em] transition-colors ${active ? 'text-gold' : complete ? 'text-cream/80' : 'text-mist/60'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${active ? 'bg-gold text-navy border-gold' : complete ? 'bg-gold/20 border-gold/50 text-gold' : 'border-mist/30'}`}>{complete ? <Check className="w-3.5 h-3.5" /> : s.icon}</span>
              {s.title}
              {active && <motion.span layoutId="step-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />}
            </button>
          );
        })}
      </div>

      <div className="p-6 sm:p-10 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 1 && (
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Step 1</p>
                  <h2 className="font-display text-3xl mt-1">About the applicant</h2>
                </div>
                <Field label="Child’s full name" error={errors.applicant_name} className="sm:col-span-2">
                  <Input value={form.applicant_name} onChange={set('applicant_name')} placeholder="e.g. Anaya Kapoor" />
                </Field>
                <Field label="Date of birth" error={errors.dob}>
                  <Input type="date" value={form.dob} onChange={set('dob')} max={new Date().toISOString().slice(0, 10)} />
                </Field>
                <Field label="Gender" error={errors.gender}>
                  <Select value={form.gender} onChange={set('gender')}>
                    <option value="">Select…</option>
                    {GENDERS.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Applying for class" error={errors.applying_class_id} className="sm:col-span-2" hint={classes ? `${classes.length} classes available from Nursery to Class X` : undefined}>
                  <Select value={form.applying_class_id} onChange={set('applying_class_id')} disabled={!classes}>
                    <option value="">{classes ? 'Choose a class…' : 'Loading classes…'}</option>
                    {classes?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.age_range} · {Math.max(0, c.capacity - (c.student_count || 0))} seats
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}
            {step === 2 && (
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Step 2</p>
                  <h2 className="font-display text-3xl mt-1">Guardian & contact</h2>
                </div>
                <Field label="Parent / guardian name" error={errors.guardian_name} className="sm:col-span-2">
                  <Input value={form.guardian_name} onChange={set('guardian_name')} placeholder="Full name" />
                </Field>
                <Field label="Phone" error={errors.guardian_phone}>
                  <Input value={form.guardian_phone} onChange={set('guardian_phone')} placeholder="+91 98…" />
                </Field>
                <Field label="Email (optional)" error={errors.guardian_email}>
                  <Input type="email" value={form.guardian_email} onChange={set('guardian_email')} placeholder="you@example.com" />
                </Field>
                <Field label="Residential address" className="sm:col-span-2">
                  <Textarea value={form.address} onChange={set('address')} placeholder="House, street, city, postcode" className="min-h-[80px]" />
                </Field>
              </div>
            )}
            {step === 3 && (
              <div className="grid gap-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Step 3</p>
                  <h2 className="font-display text-3xl mt-1">Background</h2>
                </div>
                <Field label="Previous school (if any)">
                  <Input value={form.previous_school} onChange={set('previous_school')} placeholder="Name of school, city" />
                </Field>
                <Field label="Why Aurelius? (optional)" hint="Tell us a little about your child — interests, strengths, anything we should know.">
                  <Textarea value={form.notes} onChange={set('notes')} placeholder="A few sentences…" />
                </Field>
              </div>
            )}
            {step === 4 && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Step 4</p>
                <h2 className="font-display text-3xl mt-1">Review & submit</h2>
                <div className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  {[
                    ['Applicant', form.applicant_name],
                    ['Date of birth', fmtDate(form.dob)],
                    ['Gender', form.gender],
                    ['Applying for', className],
                    ['Guardian', form.guardian_name],
                    ['Phone', form.guardian_phone],
                    ['Email', form.guardian_email || '—'],
                    ['Address', form.address || '—'],
                    ['Previous school', form.previous_school || '—'],
                    ['Notes', form.notes || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="border-b border-gold/10 pb-3">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-mist">{k}</p>
                      <p className="text-cream mt-0.5 break-words">{v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-mist mt-6">By submitting, you confirm the details are accurate. Our admissions office will review within 5 working days.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 1} className="text-cream/70 hover:bg-white/5" icon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
          {step < 4 ? (
            <Button onClick={next}>
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={submit} loading={submitting} size="lg">
              Submit application
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Tracker ---------------- */
function Tracker({ initial }: { initial: string }) {
  const [no, setNo] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [app, setApp] = useState<Admission | null>(null);

  const search = async (value = no) => {
    if (!value.trim()) {
      setErr('Enter your application number.');
      return;
    }
    setLoading(true);
    setErr('');
    setApp(null);
    try {
      setApp(await api<Admission>(`/api/admissions?application_no=${encodeURIComponent(value.trim())}`));
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initial) search(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const statusMeta = {
    pending: { label: 'Under Review', tone: 'text-amber border-amber/40 bg-amber/10', icon: <Clock className="w-5 h-5" />, text: 'Our admissions committee is reviewing the application. Decisions are usually made within five working days.' },
    approved: { label: 'Approved', tone: 'text-emerald border-emerald/40 bg-emerald/10', icon: <CheckCircle2 className="w-5 h-5" />, text: 'Congratulations! A place has been offered. Student portal credentials have been issued — please collect them from the admissions office or await our call.' },
    rejected: { label: 'Not Offered', tone: 'text-ruby border-ruby/40 bg-ruby/10', icon: <XCircle className="w-5 h-5" />, text: 'We regret that we are unable to offer a place at this time. You are welcome to reapply in the next admission cycle.' },
  } as const;

  return (
    <div className="card-lux rounded-[2rem] p-6 sm:p-10">
      <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Track your application</p>
      <h2 className="font-display text-3xl mt-1">Enter the reference number</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
        className="mt-6 flex flex-col sm:flex-row gap-3"
      >
        <Input value={no} onChange={(e) => setNo(e.target.value.toUpperCase())} placeholder="APP-2026-XXXXX" className="font-mono tracking-widest" />
        <Button type="submit" loading={loading} icon={<Search className="w-4 h-4" />}>
          Track
        </Button>
      </form>
      {err && <p className="text-sm text-ruby mt-3">{err}</p>}

      {loading && <Spinner label="Searching" />}

      <AnimatePresence>
        {app && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/15 pb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-mist">Applicant</p>
                <p className="font-display text-3xl text-cream">{app.applicant_name}</p>
                <p className="text-sm text-mist mt-1">Applying for {app.class_name} · Guardian {app.guardian_name}</p>
              </div>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm uppercase tracking-[0.15em] ${statusMeta[app.status].tone}`}>
                {statusMeta[app.status].icon} {statusMeta[app.status].label}
              </span>
            </div>

            {/* Timeline */}
            <ol className="mt-8 relative">
              <span className="absolute left-[15px] top-2 bottom-2 w-px bg-gold/20" />
              {[
                { title: 'Application submitted', date: fmtDateTime(app.created_at), done: true },
                { title: 'Under committee review', date: app.status === 'pending' ? 'In progress' : 'Completed', done: true },
                { title: app.status === 'approved' ? 'Place offered' : app.status === 'rejected' ? 'Decision issued' : 'Decision', date: app.reviewed_at ? fmtDateTime(app.reviewed_at) : 'Awaiting', done: app.status !== 'pending' },
              ].map((s, i) => (
                <motion.li key={s.title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 * i }} className="relative pl-12 pb-7 last:pb-0">
                  <span className={`absolute left-0 top-0 w-8 h-8 rounded-full border flex items-center justify-center ${s.done ? 'bg-gold text-navy border-gold' : 'border-mist/30 text-mist bg-navy'}`}>
                    {s.done ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </span>
                  <p className="text-cream">{s.title}</p>
                  <p className="text-xs text-mist mt-0.5">{s.date}</p>
                </motion.li>
              ))}
            </ol>

            <div className="mt-8 rounded-2xl border border-gold/15 bg-navy/50 p-5 text-sm text-cream/85 leading-relaxed">
              {statusMeta[app.status].text}
              {app.review_note && (
                <p className="mt-3 text-mist">
                  <span className="text-gold uppercase tracking-[0.2em] text-[10px]">Note from the office · </span>
                  {app.review_note}
                </p>
              )}
            </div>
            {app.status === 'approved' && (
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/login" className="inline-flex items-center gap-2 bg-gold text-navy px-5 py-2.5 rounded-full text-sm uppercase tracking-[0.15em] hover:bg-gold-light">
                  Go to student portal <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
