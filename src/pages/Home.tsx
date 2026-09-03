import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, ArrowUpRight, BookOpen, Compass, Crown, GraduationCap, Quote, ShieldCheck, Sparkles, Bell, CalendarDays } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingObjects from '../components/FloatingObjects';
import Reveal, { Stagger, itemVariant } from '../components/Reveal';
import Counter from '../components/Counter';
import Crest from '../components/Crest';
import { SectionHeading, Spinner, ErrorBox } from '../components/ui';
import { api, errMsg } from '../lib/api';
import type { PublicData, SchoolClass } from '../lib/types';
import { fmtDate, initials, stageOf } from '../lib/utils';

const marqueeItems = ['Scholarship', 'Character', 'Stewardship', 'Nursery to Class X', 'Est. 1924', 'Cambridge-aligned curriculum', 'Fine Arts & Music', 'Athletics', 'Leadership'];

function HeroWord({ children, i }: { children: string; i: number }) {
  return (
    <motion.span
      className="inline-block"
      initial={{ opacity: 0, y: 40, rotateX: -40 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay: 0.3 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.span>
  );
}

function TiltCard({ stats }: { stats: PublicData['stats'] | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 18 });
  const sry = useSpring(ry, { stiffness: 120, damping: 18 });
  const glareX = useTransform(sry, [-12, 12], ['20%', '80%']);

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 18);
    rx.set(-py * 18);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      style={{ perspective: 1200 }}
    >
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={reset}
        style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }}
        className="relative card-lux rounded-[2rem] p-8 sm:p-10 overflow-hidden animate-float"
      >
        <motion.div style={{ left: glareX }} className="absolute -top-1/2 w-1/2 h-[200%] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent rotate-12 pointer-events-none" />
        <div className="flex items-start justify-between">
          <Crest size={64} />
          <span className="text-[10px] uppercase tracking-[0.3em] text-gold border border-gold/40 rounded-full px-3 py-1">2026 – 27</span>
        </div>
        <p className="mt-8 text-[11px] uppercase tracking-[0.3em] text-gold">Admissions Open</p>
        <h3 className="font-display text-4xl font-medium text-cream mt-2 leading-tight">Nursery through Class X</h3>
        <ul className="mt-6 space-y-3 text-sm text-cream/80">
          {['Personalised learning, 1:12 ratio', 'Digital portal for every scholar', 'Music, arts & athletics in every week'].map((t) => (
            <li key={t} className="flex gap-3">
              <Sparkles className="w-4 h-4 text-gold shrink-0 mt-0.5" /> {t}
            </li>
          ))}
        </ul>
        <div className="mt-8 grid grid-cols-3 gap-3 border-t border-gold/15 pt-6">
          {[
            ['Scholars', stats?.students ?? 0],
            ['Classes', stats?.classes ?? 0],
            ['Faculty', stats?.faculty ?? 0],
          ].map(([l, v]) => (
            <div key={String(l)}>
              <p className="font-display text-3xl text-gold">{stats ? <Counter to={Number(v)} /> : '—'}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-mist">{l}</p>
            </div>
          ))}
        </div>
        <Link to="/admissions" className="mt-8 inline-flex items-center gap-2 text-gold text-sm uppercase tracking-[0.2em] hover:gap-3 transition-all">
          Begin application <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute -left-6 sm:-left-14 top-16 card-lux rounded-2xl px-4 py-3 text-xs text-cream/90 flex items-center gap-2 animate-float"
        style={{ animationDelay: '-3s' }}
      >
        <Crown className="w-4 h-4 text-gold" /> Ranked among top day schools
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute -right-4 sm:-right-10 bottom-10 card-lux rounded-2xl px-4 py-3 text-xs text-cream/90 flex items-center gap-2 animate-float"
        style={{ animationDelay: '-6s' }}
      >
        <ShieldCheck className="w-4 h-4 text-gold" /> Safe, secure campus
      </motion.div>
    </motion.div>
  );
}

const stageMeta: Record<string, { ages: string; blurb: string; icon: React.ReactNode }> = {
  'Early Years': { ages: 'Ages 3 – 5', blurb: 'Play-led discovery, phonics, numeracy foundations and the joy of belonging.', icon: <Sparkles className="w-5 h-5" /> },
  'Primary School': { ages: 'Ages 6 – 10', blurb: 'Structured literacy, mathematics, sciences and the arts with individual attention.', icon: <BookOpen className="w-5 h-5" /> },
  'Middle School': { ages: 'Ages 11 – 13', blurb: 'Deeper inquiry, laboratories, languages and the first steps into leadership.', icon: <Compass className="w-5 h-5" /> },
  'Senior School': { ages: 'Ages 14 – 16', blurb: 'Rigorous board preparation, mentorship and readiness for the world beyond.', icon: <GraduationCap className="w-5 h-5" /> },
};

export default function Home() {
  const [data, setData] = useState<PublicData | null>(null);
  const [error, setError] = useState('');
  const [tIndex, setTIndex] = useState(0);

  const load = async () => {
    try {
      setError('');
      setData(await api<PublicData>('/api/public'));
    } catch (e) {
      setError(errMsg(e));
    }
  };
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!data?.testimonials.length) return;
    const t = setInterval(() => setTIndex((i) => (i + 1) % data.testimonials.length), 6000);
    return () => clearInterval(t);
  }, [data]);

  const stages = useMemo(() => {
    const map = new Map<string, SchoolClass[]>();
    for (const c of data?.classes || []) {
      const s = stageOf(c.level);
      map.set(s, [...(map.get(s) || []), c]);
    }
    return ['Early Years', 'Primary School', 'Middle School', 'Senior School'].map((s) => ({ name: s, classes: map.get(s) || [] }));
  }, [data]);

  return (
    <div className="bg-navy text-cream min-h-screen">
      <Navbar />

      {/* ---------------- HERO ---------------- */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden noise">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(201,169,97,0.14),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(34,51,87,0.7),transparent_60%)]" />
        <div className="absolute inset-0 grid-pattern" />
        <FloatingObjects />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-36 pb-28 grid lg:grid-cols-12 gap-14 items-center w-full">
          <div className="lg:col-span-7">
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="text-[11px] uppercase tracking-[0.35em] text-gold flex items-center gap-3">
              <span className="w-10 h-px bg-gold" /> Est. 1924 · Nursery to Class X
            </motion.p>
            <h1 className="font-display text-[3.4rem] sm:text-7xl lg:text-[6.2rem] leading-[0.95] font-medium mt-6 text-cream" style={{ perspective: 800 }}>
              <HeroWord i={0}>Where</HeroWord> <HeroWord i={1}>Excellence</HeroWord>
              <br />
              <motion.em initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }} className="gold-text not-italic italic font-medium inline-block">
                Becomes
              </motion.em>{' '}
              <HeroWord i={3}>Tradition</HeroWord>
            </h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }} className="mt-8 text-lg text-mist max-w-xl leading-relaxed">
              A century of quiet distinction. At Aurelius Academy, every scholar is known by name, guided by masters of their craft, and prepared for a life of consequence.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8 }} className="mt-10 flex flex-wrap gap-4">
              <Link to="/admissions" className="group inline-flex items-center gap-3 bg-gold text-navy px-7 py-4 rounded-full text-sm font-medium uppercase tracking-[0.18em] hover:bg-gold-light transition-all shadow-[0_20px_50px_-15px_rgba(201,169,97,0.7)]">
                Begin Admission <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-3 border border-gold/50 text-gold px-7 py-4 rounded-full text-sm uppercase tracking-[0.18em] hover:bg-gold/10 hover:border-gold transition-all">
                Student Portal
              </Link>
            </motion.div>
          </div>
          <div className="lg:col-span-5 px-6 sm:px-10 lg:px-0">
            <TiltCard stats={data?.stats || null} />
          </div>
        </div>

        {/* Marquee */}
        <div className="relative border-y border-gold/15 bg-navy/40 backdrop-blur py-4 overflow-hidden">
          <div className="flex gap-14 whitespace-nowrap animate-marquee w-max">
            {[...marqueeItems, ...marqueeItems].map((m, i) => (
              <span key={i} className="flex items-center gap-14 text-[11px] uppercase tracking-[0.35em] text-cream/60">
                {m} <span className="w-1.5 h-1.5 rotate-45 bg-gold/70 inline-block" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="max-w-3xl mx-auto px-5 py-10">
          <ErrorBox message={error} onRetry={load} />
        </div>
      )}

      {/* ---------------- STATS ---------------- */}
      <section className="relative py-20 hairline">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid grid-cols-2 lg:grid-cols-4 gap-10">
          {[
            { label: 'Years of legacy', value: new Date().getFullYear() - (data?.stats.founded ?? 1924), suffix: '' },
            { label: 'Scholars enrolled', value: data?.stats.students ?? 0, suffix: '' },
            { label: 'Classes offered', value: data?.stats.classes ?? 0, suffix: '' },
            { label: 'Distinguished faculty', value: data?.stats.faculty ?? 0, suffix: '' },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1} className="text-center">
              <p className="font-display text-6xl md:text-7xl text-gold font-medium">{data ? <Counter to={s.value} suffix={s.suffix} /> : '—'}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-mist">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- ABOUT ---------------- */}
      <section id="about" className="relative py-28 overflow-hidden">
        <div className="absolute -right-40 top-20 w-[40rem] h-[40rem] rounded-full bg-[radial-gradient(circle,rgba(201,169,97,0.08),transparent_60%)] blur-3xl" />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-16 items-center">
          <Reveal className="lg:col-span-6 relative">
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3] border border-gold/20">
              <img src="/images/library.jpg" alt="Aurelius library" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold">The Whitmore Library</p>
                  <p className="font-display text-2xl text-cream">42,000 volumes. One reading chair per child.</p>
                </div>
              </div>
            </div>
            <motion.div
              className="absolute -bottom-8 -right-4 sm:-right-10 card-lux rounded-3xl p-6 w-64 animate-float"
              style={{ animationDelay: '-2s' }}
            >
              <Quote className="w-6 h-6 text-gold" />
              <p className="font-display text-lg text-cream mt-2 leading-snug">“We do not raise students. We raise stewards of the future.”</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-mist mt-3">— Founder’s charter, 1924</p>
            </motion.div>
          </Reveal>
          <div className="lg:col-span-6">
            <Reveal>
              <SectionHeading eyebrow="Our Philosophy" title={<>An education measured in <em className="gold-text not-italic">character</em>, not merely marks.</>} description="Founded in 1924 as a school for twelve children beneath a laurel tree, Aurelius Academy has grown into a community of scholars bound by three commitments. Each guides how we teach, how we lead, and how we care." />
            </Reveal>
            <Stagger className="mt-10 grid sm:grid-cols-3 gap-4">
              {[
                { icon: <BookOpen className="w-5 h-5" />, title: 'Scholarship', text: 'Rigorous, joyful learning from phonics to physics.' },
                { icon: <Crown className="w-5 h-5" />, title: 'Character', text: 'Integrity, courtesy and courage practised daily.' },
                { icon: <ShieldCheck className="w-5 h-5" />, title: 'Stewardship', text: 'Service to community, nature and one another.' },
              ].map((p) => (
                <motion.div key={p.title} variants={itemVariant} className="card-lux rounded-2xl p-5 group hover:-translate-y-1 hover:border-gold/40 transition-all duration-500">
                  <div className="w-10 h-10 rounded-full border border-gold/40 text-gold flex items-center justify-center group-hover:bg-gold group-hover:text-navy transition-colors">{p.icon}</div>
                  <p className="font-display text-2xl text-cream mt-4">{p.title}</p>
                  <p className="text-sm text-mist mt-1 leading-relaxed">{p.text}</p>
                </motion.div>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* ---------------- ACADEMICS ---------------- */}
      <section id="academics" className="relative py-28 bg-navy-2/60 border-y border-gold/10 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal>
            <SectionHeading align="center" eyebrow="The Journey" title={<>From <em className="gold-text not-italic">Nursery</em> to Class X</>} description="Thirteen years, four stages, one continuous story. Each class is a chapter with its own masters, rooms and rhythms — all managed live by our academic office." />
          </Reveal>
          {!data && !error ? (
            <Spinner label="Loading academic ladder" />
          ) : (
            <Stagger className="mt-16 grid md:grid-cols-2 xl:grid-cols-4 gap-5">
              {stages.map((stage, si) => {
                const meta = stageMeta[stage.name];
                return (
                  <motion.div key={stage.name} variants={itemVariant} className="relative card-lux rounded-3xl p-7 flex flex-col hover:border-gold/40 transition-colors duration-500 group">
                    <span className="absolute top-6 right-7 font-display text-6xl text-gold/10 group-hover:text-gold/20 transition-colors">{String(si + 1).padStart(2, '0')}</span>
                    <div className="w-11 h-11 rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center justify-center">{meta.icon}</div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gold mt-6">{meta.ages}</p>
                    <h3 className="font-display text-3xl text-cream mt-1">{stage.name}</h3>
                    <p className="text-sm text-mist mt-3 leading-relaxed">{meta.blurb}</p>
                    <div className="mt-6 pt-6 border-t border-gold/15 flex flex-wrap gap-2">
                      {stage.classes.map((c) => (
                        <span key={c.id} title={`${c.teacher} · Room ${c.room}`} className="px-3 py-1.5 rounded-full border border-gold/25 text-xs text-cream/90 hover:bg-gold hover:text-navy transition-colors cursor-default">
                          {c.name} <span className="opacity-60">· {c.student_count}</span>
                        </span>
                      ))}
                      {stage.classes.length === 0 && <span className="text-xs text-mist">Classes to be announced</span>}
                    </div>
                  </motion.div>
                );
              })}
            </Stagger>
          )}

          {/* Class ladder line */}
          {data && (
            <Reveal className="mt-14 hidden lg:block">
              <div className="relative">
                <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
                <div className="relative flex justify-between">
                  {data.classes.map((c, i) => (
                    <motion.div key={c.id} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }} className="flex flex-col items-center group">
                      <span className="w-3 h-3 rotate-45 bg-navy border border-gold group-hover:bg-gold transition-colors" />
                      <span className="mt-3 text-[10px] uppercase tracking-[0.15em] text-mist group-hover:text-gold transition-colors">{c.name.replace('Class ', '')}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ---------------- CAMPUS ---------------- */}
      <section id="campus" className="relative py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <Reveal>
              <SectionHeading eyebrow="Campus Life" title={<>Rooms built for <em className="gold-text not-italic">wonder</em></>} description="Fourteen acres of heritage grounds. Laboratories, studios, a music hall and playing fields — every space designed to invite curiosity." />
            </Reveal>
            <Reveal delay={0.2}>
              <Link to="/admissions" className="inline-flex items-center gap-2 text-gold uppercase tracking-[0.2em] text-sm hover:gap-3 transition-all">
                Arrange a visit <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>
          <Stagger className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[220px]">
            {[
              { src: '/images/campus.jpg', title: 'Heritage Quad', span: 'col-span-2 row-span-2' },
              { src: '/images/lab.jpg', title: 'Science Laboratories', span: 'col-span-1 row-span-1' },
              { src: '/images/music.jpg', title: 'Music Hall', span: 'col-span-1 row-span-2' },
              { src: '/images/sports.jpg', title: 'Playing Fields', span: 'col-span-1 row-span-1' },
              { src: '/images/arts.jpg', title: 'Atelier of Fine Arts', span: 'col-span-2 lg:col-span-2 row-span-1' },
            ].map((c) => (
              <motion.div key={c.title} variants={itemVariant} className={`relative rounded-3xl overflow-hidden group border border-gold/15 ${c.span}`}>
                <img src={c.src} alt={c.title} className="w-full h-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/10 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
                <p className="absolute bottom-5 left-5 font-display text-2xl text-cream translate-y-1 group-hover:translate-y-0 transition-transform">{c.title}</p>
                <span className="absolute top-4 right-4 w-8 h-8 rounded-full border border-gold/60 text-gold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------------- FACULTY ---------------- */}
      <section id="faculty" className="relative py-28 bg-navy-2/60 border-y border-gold/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <Reveal>
            <SectionHeading eyebrow="Distinguished Faculty" title={<>Masters of their <em className="gold-text not-italic">craft</em></>} description="Our teachers are scholars first — published, practised and profoundly patient." />
          </Reveal>
          {!data ? (
            <Spinner label="Loading faculty" />
          ) : (
            <Stagger className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.faculty.map((f) => (
                <motion.div key={f.id} variants={itemVariant} className="card-lux rounded-3xl p-7 hover:border-gold/40 hover:-translate-y-1 transition-all duration-500 group">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 shrink-0">
                      <span className="absolute inset-0 rounded-full border border-gold/50 animate-pulse-ring" />
                      <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-navy-3 to-navy border border-gold/50 flex items-center justify-center font-display text-2xl text-gold">{initials(f.name)}</div>
                    </div>
                    <div>
                      <p className="font-display text-2xl text-cream leading-tight">{f.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-gold mt-1">{f.title}</p>
                    </div>
                  </div>
                  <p className="text-xs text-mist mt-5 uppercase tracking-wider">{f.department} · {f.qualifications}</p>
                  <p className="text-sm text-cream/75 mt-2 leading-relaxed">{f.bio}</p>
                </motion.div>
              ))}
              {data.faculty.length === 0 && <p className="text-mist">Faculty profiles are being updated.</p>}
            </Stagger>
          )}
        </div>
      </section>

      {/* ---------------- TESTIMONIALS + NOTICES ---------------- */}
      <section id="notices" className="relative py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-14">
          <div className="lg:col-span-7">
            <Reveal>
              <SectionHeading eyebrow="Voices" title={<>Families who chose <em className="gold-text not-italic">Aurelius</em></>} />
            </Reveal>
            <div className="relative mt-10 min-h-[260px]">
              <Quote className="absolute -top-4 -left-2 w-20 h-20 text-gold/10" />
              <AnimatePresence mode="wait">
                {data?.testimonials[tIndex] && (
                  <motion.blockquote
                    key={data.testimonials[tIndex].id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6 }}
                    className="relative pl-8 border-l border-gold/40"
                  >
                    <p className="font-display text-2xl md:text-3xl text-cream leading-snug">“{data.testimonials[tIndex].quote}”</p>
                    <footer className="mt-6">
                      <p className="text-gold text-sm uppercase tracking-[0.2em]">{data.testimonials[tIndex].name}</p>
                      <p className="text-mist text-xs mt-1">{data.testimonials[tIndex].role}</p>
                    </footer>
                  </motion.blockquote>
                )}
              </AnimatePresence>
              {data && data.testimonials.length > 1 && (
                <div className="flex gap-2 mt-8 pl-8">
                  {data.testimonials.map((t, i) => (
                    <button key={t.id} onClick={() => setTIndex(i)} className={`h-1 rounded-full transition-all duration-500 ${i === tIndex ? 'w-10 bg-gold' : 'w-4 bg-gold/30'}`} aria-label={`Testimonial ${i + 1}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={0.1}>
              <div className="card-lux rounded-3xl p-7">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-gold flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Notice Board
                  </p>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-mist">Live</span>
                </div>
                <div className="mt-6 space-y-5">
                  {data?.notices.map((n) => (
                    <div key={n.id} className="group">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-display text-xl text-cream leading-tight group-hover:text-gold transition-colors">{n.title}</p>
                        {n.pinned && <span className="text-[9px] uppercase tracking-[0.2em] text-gold border border-gold/40 rounded-full px-2 py-0.5 shrink-0">Pinned</span>}
                      </div>
                      <p className="text-sm text-mist mt-1 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-mist/60 mt-2">{fmtDate(n.created_at)}</p>
                    </div>
                  ))}
                  {data && data.notices.length === 0 && <p className="text-sm text-mist">No public notices at the moment.</p>}
                  {!data && <Spinner />}
                </div>
                {data && data.exams.length > 0 && (
                  <div className="mt-7 pt-6 border-t border-gold/15">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-gold flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" /> Examination Calendar
                    </p>
                    <ul className="mt-4 space-y-3">
                      {data.exams.map((e) => (
                        <li key={e.id} className="flex items-center justify-between text-sm">
                          <span className="text-cream/90">{e.title}</span>
                          <span className="text-mist text-xs">{fmtDate(e.start_date)} – {fmtDate(e.end_date)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,97,0.16),transparent_60%)]" />
        <FloatingObjects density="light" />
        <Reveal className="relative max-w-4xl mx-auto px-5 text-center">
          <Crest size={80} className="mx-auto animate-float" />
          <h2 className="font-display text-5xl md:text-7xl text-cream mt-8 leading-[0.95]">
            Begin your child’s <em className="gold-text not-italic">chapter</em>
          </h2>
          <p className="text-mist mt-6 max-w-xl mx-auto">Applications for the 2026–27 academic year are open across all classes. Complete the portal in under ten minutes and track your application live.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/admissions" className="group inline-flex items-center gap-3 bg-gold text-navy px-8 py-4 rounded-full text-sm font-medium uppercase tracking-[0.18em] hover:bg-gold-light transition-all shadow-[0_20px_50px_-15px_rgba(201,169,97,0.7)]">
              Apply for Admission <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/admissions?tab=track" className="inline-flex items-center gap-3 border border-gold/50 text-gold px-8 py-4 rounded-full text-sm uppercase tracking-[0.18em] hover:bg-gold/10 transition-all">
              Track Application
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
