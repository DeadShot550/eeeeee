import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, CalendarDays, ClipboardList, CreditCard, Bell, LayoutGrid, Settings, Award, ChevronDown, CheckCircle2, Clock, Lock, Pin } from 'lucide-react';
import PortalShell, { PageHeader, StatCard, Card } from '../../components/PortalShell';
import Crest from '../../components/Crest';
import { Badge, Button, Confirm, EmptyState, ErrorBox, Field, Input, Spinner, useToast } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { api, errMsg } from '../../lib/api';
import type { Exam, Fee, Result, StudentBundle } from '../../lib/types';
import { DAYS, PERIODS, fmtDate, fmtDateTime, fmtMoney, gradeFor, todayISO } from '../../lib/utils';

const NAV = [
  { id: 'overview', label: 'Overview', icon: <LayoutGrid /> },
  { id: 'syllabus', label: 'Syllabus', icon: <BookOpen /> },
  { id: 'timetable', label: 'Timetable', icon: <CalendarDays /> },
  { id: 'exams', label: 'Examinations', icon: <ClipboardList /> },
  { id: 'results', label: 'Results', icon: <Award /> },
  { id: 'fees', label: 'Fees', icon: <CreditCard /> },
  { id: 'notices', label: 'Notices', icon: <Bell /> },
  { id: 'settings', label: 'Settings', icon: <Settings /> },
];

function examStatus(e: Exam) {
  const t = todayISO();
  if (e.end_date < t) return { label: 'Completed', tone: 'mist' as const };
  if (e.start_date <= t) return { label: 'Ongoing', tone: 'amber' as const };
  return { label: 'Upcoming', tone: 'emerald' as const };
}

export default function StudentPortal() {
  const { tab = 'overview' } = useParams();
  const nav = useNavigate();
  const auth = useAuth();
  const toast = useToast();
  const [data, setData] = useState<StudentBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      setData(await api<StudentBundle>('/api/student'));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const dueFees = data?.fees.filter((f) => f.status === 'due') || [];
  const navItems = NAV.map((n) => (n.id === 'fees' && dueFees.length ? { ...n, badge: dueFees.length } : n));

  const logout = async () => {
    await auth.logout();
    nav('/login');
  };

  const s = data?.student;

  return (
    <PortalShell items={navItems} active={tab} onNav={(id) => nav(`/student/${id}`)} roleLabel="Student Portal" userName={s?.full_name || '…'} userMeta={s ? `${s.class?.name || ''} · Roll ${s.roll_no}` : undefined} onLogout={logout}>
      {loading ? (
        <Spinner label="Opening your portal" tone="light" />
      ) : error || !data ? (
        <ErrorBox message={error || 'Could not load your data'} onRetry={load} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
            {tab === 'overview' && <Overview data={data} go={(t) => nav(`/student/${t}`)} />}
            {tab === 'syllabus' && <SyllabusView data={data} />}
            {tab === 'timetable' && <TimetableView data={data} />}
            {tab === 'exams' && <ExamsView data={data} />}
            {tab === 'results' && <ResultsView data={data} />}
            {tab === 'fees' && <FeesView data={data} reload={load} />}
            {tab === 'notices' && <NoticesView data={data} />}
            {tab === 'settings' && <SettingsView data={data} onDone={() => toast.push({ title: 'Password updated successfully.', tone: 'success' })} />}
          </motion.div>
        </AnimatePresence>
      )}
    </PortalShell>
  );
}

/* ---------------- Overview ---------------- */
function Overview({ data, go }: { data: StudentBundle; go: (t: string) => void }) {
  const s = data.student;
  const upcoming = data.exams.filter((e) => e.end_date >= todayISO());
  const due = data.fees.filter((f) => f.status === 'due').reduce((a, f) => a + Number(f.amount), 0);
  const latest = useMemo(() => {
    const byExam = new Map<number, Result[]>();
    data.results.forEach((r) => byExam.set(r.exam_id, [...(byExam.get(r.exam_id) || []), r]));
    const exams = data.exams.filter((e) => byExam.has(e.id)).sort((a, b) => b.start_date.localeCompare(a.start_date));
    if (!exams[0]) return null;
    const rows = byExam.get(exams[0].id)!;
    const pct = Math.round((rows.reduce((a, r) => a + Number(r.marks_obtained), 0) / rows.reduce((a, r) => a + Number(r.max_marks), 0)) * 100);
    return { exam: exams[0], pct };
  }, [data]);

  return (
    <div>
      <div className="grid lg:grid-cols-12 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-8 relative rounded-3xl bg-navy text-cream p-7 sm:p-9 overflow-hidden noise">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,169,97,0.25),transparent_55%)]" />
          <svg className="absolute -right-16 -bottom-16 w-72 h-72 animate-spin-slow opacity-30" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="95" stroke="#c9a961" strokeDasharray="4 10" />
            <circle cx="100" cy="100" r="70" stroke="#c9a961" strokeWidth="0.5" />
          </svg>
          <p className="relative text-[11px] uppercase tracking-[0.3em] text-gold">Good day</p>
          <h1 className="relative font-display text-4xl sm:text-5xl mt-2 leading-tight">{s.full_name}</h1>
          <p className="relative text-mist mt-2">
            {s.class?.name} {s.class?.section ? `· Section ${s.class.section}` : ''} · Roll {s.roll_no} · {s.admission_no}
          </p>
          <div className="relative mt-8 flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-mist">Class teacher</p>
              <p className="text-cream mt-0.5">{s.class?.teacher || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-mist">Room</p>
              <p className="text-cream mt-0.5">{s.class?.room || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-mist">Guardian</p>
              <p className="text-cream mt-0.5">{s.guardian_name || '—'}</p>
            </div>
          </div>
        </motion.div>

        {/* ID Card */}
        <motion.div initial={{ opacity: 0, y: 20, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-4 rounded-3xl bg-gradient-to-br from-cream-2 to-paper border border-gold/40 p-6 relative overflow-hidden shadow-[0_20px_50px_-25px_rgba(143,117,56,0.6)]">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-gold-dark via-gold-light to-gold-dark" />
          <div className="flex items-center justify-between">
            <Crest size={40} />
            <p className="text-[9px] uppercase tracking-[0.3em] text-gold-dark">Scholar ID</p>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-navy text-gold font-display text-2xl flex items-center justify-center">{s.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
            <div>
              <p className="font-display text-xl text-navy leading-tight">{s.full_name}</p>
              <p className="text-xs text-navy/60">{s.class?.name} · Roll {s.roll_no}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-navy/50">Admission No.</p>
              <p className="font-mono text-navy mt-0.5">{s.admission_no}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-navy/50">Blood group</p>
              <p className="text-navy mt-0.5">{s.blood_group || '—'}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-navy/50">Date of birth</p>
              <p className="text-navy mt-0.5">{fmtDate(s.dob)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-navy/50">Valid</p>
              <p className="text-navy mt-0.5">2026 – 27</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard label="Exams ahead" value={upcoming.length} hint={upcoming[0] ? `${upcoming[0].title} · ${fmtDate(upcoming[0].start_date)}` : 'No exam scheduled'} icon={<ClipboardList />} />
        <StatCard label="Fees due" value={fmtMoney(due)} hint={due ? `${data.fees.filter((f) => f.status === 'due').length} pending` : 'All fees paid'} icon={<CreditCard />} accent={due ? 'ruby' : 'emerald'} />
        <StatCard label="Latest result" value={latest ? `${latest.pct}%` : '—'} hint={latest ? `${latest.exam.title} · Grade ${gradeFor(latest.pct).grade}` : 'No results published yet'} icon={<Award />} accent="emerald" />
        <StatCard label="Notices" value={data.notices.length} hint={data.notices[0]?.title || 'Nothing new'} icon={<Bell />} accent="navy" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-6">
        <Card title="Upcoming examinations" action={<button onClick={() => go('exams')} className="text-xs text-gold-dark hover:underline">View all</button>}>
          {upcoming.length === 0 ? (
            <p className="text-sm text-navy/50">No examinations scheduled.</p>
          ) : (
            <ul className="divide-y divide-navy/8">
              {upcoming.slice(0, 4).map((e) => (
                <li key={e.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-navy font-medium">{e.title}</p>
                    <p className="text-xs text-navy/50">{e.term} · {fmtDate(e.start_date)} – {fmtDate(e.end_date)}</p>
                  </div>
                  <Badge tone={examStatus(e).tone}>{examStatus(e).label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Latest notices" action={<button onClick={() => go('notices')} className="text-xs text-gold-dark hover:underline">View all</button>}>
          {data.notices.length === 0 ? (
            <p className="text-sm text-navy/50">No notices yet.</p>
          ) : (
            <ul className="divide-y divide-navy/8">
              {data.notices.slice(0, 4).map((n) => (
                <li key={n.id} className="py-3">
                  <p className="text-sm text-navy font-medium flex items-center gap-2">
                    {n.pinned && <Pin className="w-3 h-3 text-gold-dark" />} {n.title}
                  </p>
                  <p className="text-xs text-navy/55 mt-0.5 line-clamp-2">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Syllabus ---------------- */
function SyllabusView({ data }: { data: StudentBundle }) {
  const [openId, setOpenId] = useState<number | null>(data.syllabus[0]?.id ?? null);
  return (
    <div>
      <PageHeader eyebrow={data.student.class?.name} title="Syllabus" description="Complete term syllabus published by your class teacher." />
      {data.syllabus.length === 0 ? (
        <EmptyState icon={<BookOpen className="w-5 h-5" />} title="Syllabus not published yet" hint="Your teachers will publish the syllabus shortly." />
      ) : (
        <div className="space-y-3">
          {data.syllabus.map((s, i) => {
            const open = openId === s.id;
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl bg-white border border-navy/10 overflow-hidden">
                <button onClick={() => setOpenId(open ? null : s.id)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-navy text-gold font-display text-lg flex items-center justify-center">{s.subject.charAt(0)}</span>
                    <div>
                      <p className="font-display text-xl text-navy">{s.subject}</p>
                      <p className="text-xs text-navy/50">{s.term} · {s.topics.length} topics</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-navy/50 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 border-t border-navy/8 pt-4">
                        {s.description && <p className="text-sm text-navy/70 mb-4">{s.description}</p>}
                        <ol className="grid sm:grid-cols-2 gap-2">
                          {s.topics.map((t, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-navy rounded-xl bg-paper border border-navy/8 px-3 py-2">
                              <span className="text-gold-dark font-display text-base leading-none mt-0.5">{String(idx + 1).padStart(2, '0')}</span>
                              {t}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Timetable ---------------- */
function TimetableView({ data }: { data: StudentBundle }) {
  const todayName = DAYS[new Date().getDay() - 1] || 'Monday';
  const [day, setDay] = useState(todayName);
  const cell = (d: string, p: number) => data.timetable.find((t) => t.day === d && t.period === p);
  return (
    <div>
      <PageHeader eyebrow={data.student.class?.name} title="Weekly timetable" description="Seven periods a day with a short break after the third and lunch after the fifth." />
      {data.timetable.length === 0 ? (
        <EmptyState icon={<CalendarDays className="w-5 h-5" />} title="Timetable not published" hint="Your class timetable will appear here once the office publishes it." />
      ) : (
        <>
          {/* Mobile */}
          <div className="lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-2 scroll-thin">
              {DAYS.map((d) => (
                <button key={d} onClick={() => setDay(d)} className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider whitespace-nowrap border ${day === d ? 'bg-navy text-gold border-navy' : 'border-navy/15 text-navy/70'}`}>
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {PERIODS.map((p) => {
                const c = cell(day, p.n);
                return (
                  <div key={p.n} className="flex items-center gap-4 rounded-2xl bg-white border border-navy/10 px-4 py-3">
                    <div className="text-xs text-navy/50 w-20">
                      {p.start}
                      <br />
                      {p.end}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-navy font-medium">{c?.subject || <span className="text-navy/30">Free period</span>}</p>
                      {c?.teacher && <p className="text-xs text-navy/50">{c.teacher}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Desktop */}
          <div className="hidden lg:block rounded-2xl bg-white border border-navy/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy text-cream">
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-medium w-28">Period</th>
                  {DAYS.map((d) => (
                    <th key={d} className={`text-left px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-medium ${d === todayName ? 'text-gold' : ''}`}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((p, i) => (
                  <tr key={p.n} className={`border-t border-navy/8 ${i === 3 || i === 5 ? 'border-t-2 border-t-gold/40' : ''}`}>
                    <td className="px-4 py-3 text-xs text-navy/60">
                      <span className="font-display text-lg text-navy">{p.n}</span>
                      <br />
                      {p.start} – {p.end}
                    </td>
                    {DAYS.map((d) => {
                      const c = cell(d, p.n);
                      return (
                        <td key={d} className={`px-4 py-3 align-top ${d === todayName ? 'bg-gold/5' : ''}`}>
                          {c ? (
                            <>
                              <p className="text-navy font-medium">{c.subject}</p>
                              <p className="text-xs text-navy/50">{c.teacher}</p>
                            </>
                          ) : (
                            <span className="text-navy/25">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Exams ---------------- */
function ExamsView({ data }: { data: StudentBundle }) {
  return (
    <div>
      <PageHeader eyebrow="Academic calendar" title="Examinations" description="All examinations scheduled for your class and the whole school." />
      {data.exams.length === 0 ? (
        <EmptyState icon={<ClipboardList className="w-5 h-5" />} title="No exam scheduled" />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {data.exams.map((e, i) => {
            const st = examStatus(e);
            const hasResult = data.results.some((r) => r.exam_id === e.id);
            return (
              <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl bg-white border border-navy/10 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-gold-dark">{e.term}</p>
                    <p className="font-display text-2xl text-navy mt-0.5">{e.title}</p>
                  </div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>
                <p className="text-sm text-navy/60 mt-3">{e.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-navy/60">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" /> {fmtDate(e.start_date)} – {fmtDate(e.end_date)}
                  </span>
                  {hasResult && <span className="inline-flex items-center gap-1 text-emerald"><CheckCircle2 className="w-3.5 h-3.5" /> Results published</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Results ---------------- */
function ResultsView({ data }: { data: StudentBundle }) {
  const cards = useMemo(() => {
    const byExam = new Map<number, Result[]>();
    data.results.forEach((r) => byExam.set(r.exam_id, [...(byExam.get(r.exam_id) || []), r]));
    return data.exams
      .filter((e) => byExam.has(e.id))
      .sort((a, b) => b.start_date.localeCompare(a.start_date))
      .map((e) => {
        const rows = byExam.get(e.id)!;
        const got = rows.reduce((a, r) => a + Number(r.marks_obtained), 0);
        const max = rows.reduce((a, r) => a + Number(r.max_marks), 0);
        const pct = max ? Math.round((got / max) * 1000) / 10 : 0;
        return { exam: e, rows, got, max, pct, grade: gradeFor(pct) };
      });
  }, [data]);

  return (
    <div>
      <PageHeader eyebrow="Report cards" title="Results" description="Marks and grades published by the examination office." />
      {cards.length === 0 ? (
        <EmptyState icon={<Award className="w-5 h-5" />} title="No results published yet" hint="Results appear here once your teachers enter marks for an examination." />
      ) : (
        <div className="space-y-6">
          {cards.map((c, i) => (
            <motion.div key={c.exam.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-3xl bg-white border border-navy/10 overflow-hidden">
              <div className="bg-navy text-cream p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(201,169,97,0.2),transparent_60%)]" />
                <div className="relative">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{c.exam.term}</p>
                  <p className="font-display text-3xl mt-1">{c.exam.title}</p>
                  <p className="text-xs text-mist mt-1">{fmtDate(c.exam.start_date)} – {fmtDate(c.exam.end_date)}</p>
                </div>
                <div className="relative flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-mist">Total</p>
                    <p className="font-display text-3xl">{c.got} <span className="text-mist text-lg">/ {c.max}</span></p>
                  </div>
                  <div className="relative w-20 h-20">
                    <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                      <motion.circle cx="18" cy="18" r="15.9" fill="none" stroke="#c9a961" strokeWidth="3" strokeLinecap="round" strokeDasharray="100 100" initial={{ strokeDashoffset: 100 }} animate={{ strokeDashoffset: 100 - c.pct }} transition={{ duration: 1.2, ease: 'easeOut' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-xl text-gold leading-none">{c.grade.grade}</span>
                      <span className="text-[10px] text-mist">{c.pct}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {c.rows.map((r) => {
                    const p = Math.round((Number(r.marks_obtained) / Number(r.max_marks)) * 100);
                    const g = gradeFor(p);
                    return (
                      <div key={r.id} className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-5 sm:col-span-3">
                          <p className="text-sm text-navy font-medium">{r.subject}</p>
                          {r.remarks && <p className="text-[11px] text-navy/50">{r.remarks}</p>}
                        </div>
                        <div className="col-span-4 sm:col-span-6 h-2 rounded-full bg-navy/8 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 1, ease: 'easeOut' }} className={`h-full rounded-full ${g.tone === 'emerald' ? 'bg-emerald' : g.tone === 'gold' ? 'bg-gold' : g.tone === 'amber' ? 'bg-amber' : 'bg-ruby'}`} />
                        </div>
                        <div className="col-span-3 sm:col-span-3 flex items-center justify-end gap-3 text-sm">
                          <span className="text-navy">{r.marks_obtained}<span className="text-navy/40">/{r.max_marks}</span></span>
                          <Badge tone={g.tone}>{g.grade}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-5 text-xs text-navy/50">Overall: <span className="text-navy font-medium">{c.grade.label}</span> · Grade scale: A+ ≥ 90, A ≥ 80, B+ ≥ 70, B ≥ 60, C ≥ 50, D ≥ 40.</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Fees ---------------- */
function FeesView({ data, reload }: { data: StudentBundle; reload: () => Promise<void> }) {
  const [paying, setPaying] = useState<Fee | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const due = data.fees.filter((f) => f.status === 'due');
  const paid = data.fees.filter((f) => f.status === 'paid');
  const sum = (arr: Fee[]) => arr.reduce((a, f) => a + Number(f.amount), 0);

  const pay = async () => {
    if (!paying) return;
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      await api('/api/student', { method: 'POST', body: { action: 'pay-fee', fee_id: paying.id } });
      toast.push({ title: 'Payment successful', desc: `${paying.title} · ${fmtMoney(paying.amount)}`, tone: 'success' });
      setPaying(null);
      await reload();
    } catch (e) {
      toast.push({ title: 'Payment failed', desc: errMsg(e), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Accounts" title="Fees" description="Outstanding and settled fee records for the current academic year." />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Outstanding" value={fmtMoney(sum(due))} hint={due.length ? `${due.length} pending` : 'No pending fees'} accent={due.length ? 'ruby' : 'emerald'} icon={<Clock />} />
        <StatCard label="Paid this year" value={fmtMoney(sum(paid))} hint={`${paid.length} receipts`} accent="emerald" icon={<CheckCircle2 />} />
        <StatCard label="Annual tuition" value={fmtMoney(data.student.class?.annual_fee || 0)} hint={data.student.class?.name} accent="gold" icon={<CreditCard />} />
      </div>
      {data.fees.length === 0 ? (
        <EmptyState icon={<CreditCard className="w-5 h-5" />} title="No fee records" />
      ) : (
        <div className="rounded-2xl bg-white border border-navy/10 divide-y divide-navy/8">
          {[...due, ...paid].map((f) => (
            <div key={f.id} className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.status === 'paid' ? 'bg-emerald/10 text-emerald' : 'bg-ruby/10 text-ruby'}`}>{f.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}</span>
                <div>
                  <p className="text-sm text-navy font-medium">{f.title}</p>
                  <p className="text-xs text-navy/50">{f.status === 'paid' ? `Paid ${fmtDateTime(f.paid_at)}` : `Due ${fmtDate(f.due_date)}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:justify-end">
                <p className="font-display text-2xl text-navy">{fmtMoney(f.amount)}</p>
                {f.status === 'due' ? (
                  <Button size="sm" onClick={() => setPaying(f)}>
                    Pay now
                  </Button>
                ) : (
                  <Badge tone="emerald">Paid</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Confirm open={!!paying} onClose={() => !busy && setPaying(null)} onConfirm={pay} loading={busy} title="Confirm payment" message={paying ? `Pay ${fmtMoney(paying.amount)} for “${paying.title}”? This simulates a secure payment and marks the fee as settled.` : ''} confirmLabel={busy ? 'Processing…' : 'Pay securely'} />
    </div>
  );
}

/* ---------------- Notices ---------------- */
function NoticesView({ data }: { data: StudentBundle }) {
  return (
    <div>
      <PageHeader eyebrow="Notice board" title="Notices" description="Announcements for the whole school and your class." />
      {data.notices.length === 0 ? (
        <EmptyState icon={<Bell className="w-5 h-5" />} title="No notices" />
      ) : (
        <div className="space-y-3">
          {data.notices.map((n, i) => (
            <motion.article key={n.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`rounded-2xl bg-white border p-5 ${n.pinned ? 'border-gold/50' : 'border-navy/10'}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-2xl text-navy">{n.title}</p>
                <div className="flex gap-2 shrink-0">
                  {n.pinned && <Badge tone="gold">Pinned</Badge>}
                  <Badge tone="navy">{n.audience === 'all' ? 'School' : n.audience === 'students' ? 'Students' : 'Your class'}</Badge>
                </div>
              </div>
              <p className="text-sm text-navy/70 mt-2 leading-relaxed whitespace-pre-line">{n.body}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-navy/40 mt-3">{fmtDateTime(n.created_at)}</p>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Settings ---------------- */
function SettingsView({ data, onDone }: { data: StudentBundle; onDone: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const s = data.student;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (next.length < 6) return setErr('New password must be at least 6 characters.');
    if (next !== confirm) return setErr('Passwords do not match.');
    setBusy(true);
    try {
      await api('/api/auth', { method: 'POST', body: { action: 'change-password', current, next } });
      setCurrent('');
      setNext('');
      setConfirm('');
      onDone();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Account" title="Settings" description="Your profile details and login security." />
      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Profile">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Full name', s.full_name],
              ['Username', s.username],
              ['Admission no.', s.admission_no],
              ['Class', `${s.class?.name || ''} ${s.class?.section ? '· ' + s.class.section : ''}`],
              ['Roll no.', String(s.roll_no)],
              ['Date of birth', fmtDate(s.dob)],
              ['Gender', s.gender || '—'],
              ['Blood group', s.blood_group || '—'],
              ['Guardian', s.guardian_name || '—'],
              ['Guardian phone', s.guardian_phone || '—'],
              ['Address', s.address || '—'],
              ['Enrolled', fmtDate(s.created_at)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] uppercase tracking-[0.2em] text-navy/50">{k}</dt>
                <dd className="text-navy mt-0.5 break-words">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-navy/50 mt-5">To correct any detail, please contact the school office.</p>
        </Card>
        <Card title="Change password">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Current password" tone="light">
              <Input tone="light" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </Field>
            <Field label="New password" tone="light" hint="At least 6 characters">
              <Input tone="light" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
            </Field>
            <Field label="Confirm new password" tone="light">
              <Input tone="light" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
            {err && <p className="text-sm text-ruby">{err}</p>}
            <Button type="submit" variant="navy" loading={busy} icon={<Lock className="w-4 h-4" />}>
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
